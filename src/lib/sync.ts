import { getEnabledChains } from './constants';
import {
  upsertDailyBurn,
  insertManyBurnTransactions,
  getLatestBurnTransaction,
  getBurnTransactions,
} from './database';
import {
  getUniBurnTransfers,
  getCurrentUniPrice,
} from './blockscout';
import { getHistoricalPriceWithCache } from './price';
import type { ChainConfig, DailyBurn, BurnTransaction } from '@/types';

export interface SyncResult {
  success: boolean;
  newTransactions: number;
  totalBurned: number;
  currentPrice: number | null;
  lastUpdated: string;
  error?: string;
  chainResults?: ChainSyncResult[];
}

interface ChainSyncResult {
  chain: string;
  newTransactions: number;
  totalBurned: number;
  error?: string;
}

function groupTransactionsByDate(
  transactions: BurnTransaction[]
): Map<string, BurnTransaction[]> {
  const grouped = new Map<string, BurnTransaction[]>();

  for (const tx of transactions) {
    const date = tx.timestamp.split('T')[0];
    const existing = grouped.get(date) || [];
    existing.push(tx);
    grouped.set(date, existing);
  }

  return grouped;
}

async function syncChain(
  chain: ChainConfig,
  currentPrice: number | null,
  now: string
): Promise<ChainSyncResult> {
  try {
    console.log(`[${chain.name}] Starting sync...`);

    // Get the latest transaction for this specific chain
    const latestTx = await getLatestBurnTransaction(chain.id);

    // Fetch new transactions from BlockScout
    const newTransactions = await getUniBurnTransfers(
      chain,
      chain.startDate,
      latestTx?.block_number
    );

    if (newTransactions.length > 0) {
      // Add price data to new transactions
      for (const tx of newTransactions) {
        if (currentPrice) {
          tx.uni_price_usd = currentPrice;
          tx.usd_value = tx.uni_amount * currentPrice;
        }
      }

      await insertManyBurnTransactions(newTransactions);
    }

    // Get all transactions for this chain and recalculate daily burns
    const allChainTxs = await getBurnTransactions(chain.id);
    const filteredTxs = allChainTxs.filter(
      (tx) => tx.timestamp >= chain.startDate
    );
    const groupedByDate = groupTransactionsByDate(filteredTxs);

    const dates = Array.from(groupedByDate.keys()).sort();

    let cumulativeUni = 0;
    let cumulativeUsd = 0;

    for (const date of dates) {
      const dayTransactions = groupedByDate.get(date) || [];
      const dailyUni = dayTransactions.reduce((sum, tx) => sum + tx.uni_amount, 0);

      cumulativeUni += dailyUni;

      let priceForDay = currentPrice;
      const today = new Date().toISOString().split('T')[0];

      if (date !== today) {
        const historicalPrice = await getHistoricalPriceWithCache(date, currentPrice);
        if (historicalPrice) {
          priceForDay = historicalPrice;
        }
      }

      const dailyUsdValue = priceForDay ? dailyUni * priceForDay : null;
      cumulativeUsd += dailyUsdValue || 0;

      const dailyBurn: DailyBurn = {
        date,
        chain: chain.id,
        cumulative_uni: cumulativeUni,
        daily_uni: dailyUni,
        uni_price_usd: priceForDay,
        daily_usd_value: dailyUsdValue,
        cumulative_usd_value: cumulativeUsd,
        updated_at: now,
      };

      await upsertDailyBurn(dailyBurn);
    }

    console.log(`[${chain.name}] Sync complete. ${newTransactions.length} new txs, ${cumulativeUni} total burned.`);

    return {
      chain: chain.id,
      newTransactions: newTransactions.length,
      totalBurned: cumulativeUni,
    };
  } catch (error) {
    console.error(`[${chain.name}] Sync error:`, error);
    return {
      chain: chain.id,
      newTransactions: 0,
      totalBurned: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncBurnData(): Promise<SyncResult> {
  const now = new Date().toISOString();

  try {
    // Get current UNI price once (same across all chains)
    const currentPrice = await getCurrentUniPrice();

    const chains = getEnabledChains();
    const chainResults: ChainSyncResult[] = [];

    // Sync chains sequentially to avoid rate limiting across explorers
    for (const chain of chains) {
      const result = await syncChain(chain, currentPrice, now);
      chainResults.push(result);
    }

    const totalNewTxs = chainResults.reduce((sum, r) => sum + r.newTransactions, 0);
    const totalBurned = chainResults.reduce((sum, r) => sum + r.totalBurned, 0);
    const hasErrors = chainResults.some((r) => r.error);

    return {
      success: !hasErrors,
      newTransactions: totalNewTxs,
      totalBurned,
      currentPrice,
      lastUpdated: now,
      chainResults,
      error: hasErrors
        ? chainResults.filter((r) => r.error).map((r) => `${r.chain}: ${r.error}`).join('; ')
        : undefined,
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      newTransactions: 0,
      totalBurned: 0,
      currentPrice: null,
      lastUpdated: now,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function initialSync(): Promise<SyncResult> {
  console.log('Starting initial multi-chain sync...');
  return syncBurnData();
}
