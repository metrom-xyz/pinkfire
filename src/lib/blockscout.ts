import { CONSTANTS } from './constants';
import type {
  ChainConfig,
  BlockScoutTokenTransfer,
  BlockScoutTransferResponse,
  BlockScoutTokenBalance,
  BlockScoutTokenInfo,
  BurnTransaction,
} from '@/types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry<T>(
  url: string,
  retries = 3,
  backoffMs = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        if (response.status === 429) {
          await delay(backoffMs * Math.pow(2, i));
          continue;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await delay(backoffMs * Math.pow(2, i));
    }
  }
  throw new Error('Max retries reached');
}

// --- Token info (Ethereum mainnet only, for price) ---

export async function getUniTokenInfo(): Promise<BlockScoutTokenInfo | null> {
  try {
    const url = `${CONSTANTS.BLOCKSCOUT_BASE_URL}/tokens/${CONSTANTS.UNI_TOKEN}`;
    return await fetchWithRetry<BlockScoutTokenInfo>(url);
  } catch (error) {
    console.error('Error fetching UNI token info:', error);
    return null;
  }
}

export async function getCurrentUniPrice(): Promise<number | null> {
  try {
    const tokenInfo = await getUniTokenInfo();
    if (tokenInfo?.exchange_rate) {
      return parseFloat(tokenInfo.exchange_rate);
    }
    return null;
  } catch (error) {
    console.error('Error fetching UNI price:', error);
    return null;
  }
}

export async function getDeadAddressUniBalance(chain: ChainConfig): Promise<number | null> {
  try {
    const url = `${chain.blockscoutBaseUrl}/addresses/${CONSTANTS.DEAD_ADDRESS}/token-balances`;
    const balances = await fetchWithRetry<BlockScoutTokenBalance[]>(url);

    const uniBalance = balances.find(
      (b) => b.token.address.toLowerCase() === chain.uniTokenAddress.toLowerCase()
    );

    if (uniBalance) {
      const value = BigInt(uniBalance.value);
      const decimals = parseInt(uniBalance.token.decimals);
      return Number(value) / Math.pow(10, decimals);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching dead address UNI balance on ${chain.name}:`, error);
    return null;
  }
}

// --- Chain-aware transfer fetching ---

export async function getUniBurnTransfers(
  chain: ChainConfig,
  startDate: string,
  afterBlockNumber?: number
): Promise<BurnTransaction[]> {
  const transactions: BurnTransaction[] = [];
  const startTimestamp = new Date(startDate).getTime();
  let nextPageParams: { block_number: number; index: number; items_count: number } | null = null;
  let hasMore = true;

  // L2 chains with a Releaser: track UNI transfers FROM the Releaser (bridge-burns)
  // Ethereum (no releaser): track UNI transfers TO 0xdEaD (direct burns)
  const isReleaserMode = !!chain.releaserAddress;
  const trackAddress = isReleaserMode ? chain.releaserAddress! : CONSTANTS.DEAD_ADDRESS;
  const filterDirection = isReleaserMode ? 'from' : 'to';

  console.log(`[${chain.name}] Tracking ${filterDirection} ${trackAddress.slice(0, 10)}...`);

  while (hasMore) {
    try {
      let url = `${chain.blockscoutBaseUrl}/addresses/${trackAddress}/token-transfers`;
      const params = new URLSearchParams({
        type: 'ERC-20',
        filter: filterDirection,
        token: chain.uniTokenAddress,
      });

      if (nextPageParams) {
        params.set('block_number', nextPageParams.block_number.toString());
        params.set('index', nextPageParams.index.toString());
        params.set('items_count', nextPageParams.items_count.toString());
      }

      url = `${url}?${params.toString()}`;
      console.log(`[${chain.name}] Fetching:`, url);

      const response = await fetchWithRetry<BlockScoutTransferResponse>(url);
      console.log(`[${chain.name}] Got items:`, response.items?.length || 0);

      for (const transfer of response.items) {
        const txTimestamp = new Date(transfer.timestamp).getTime();

        if (txTimestamp < startTimestamp) {
          hasMore = false;
          break;
        }

        if (afterBlockNumber && transfer.block_number <= afterBlockNumber) {
          hasMore = false;
          break;
        }

        const decimals = parseInt(transfer.total.decimals);
        const amount = Number(BigInt(transfer.total.value)) / Math.pow(10, decimals);

        transactions.push({
          tx_hash: transfer.transaction_hash,
          chain: chain.id,
          block_number: transfer.block_number,
          timestamp: transfer.timestamp,
          uni_amount: amount,
          uni_price_usd: null,
          usd_value: null,
          from_address: transfer.from.hash,
        });
      }

      nextPageParams = response.next_page_params;
      hasMore = hasMore && nextPageParams !== null;

      if (hasMore) {
        await delay(200);
      }
    } catch (error) {
      console.error(`[${chain.name}] Error fetching transfers:`, error);
      hasMore = false;
    }
  }

  console.log(`[${chain.name}] Total transactions found:`, transactions.length);
  return transactions;
}

export async function getHistoricalUniPrice(date: string): Promise<number | null> {
  try {
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const url = `${CONSTANTS.COINGECKO_API_URL}/coins/uniswap/history?date=${formattedDate}&localization=false`;

    const response = await fetchWithRetry<{
      market_data?: {
        current_price?: {
          usd?: number;
        };
      };
    }>(url);

    return response.market_data?.current_price?.usd ?? null;
  } catch (error) {
    console.error(`Error fetching historical price for ${date}:`, error);
    return null;
  }
}
