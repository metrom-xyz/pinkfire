import { CONSTANTS } from './constants';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getHistoricalUniPrice(date: string): Promise<number | null> {
  try {
    // Format date for CoinGecko: dd-mm-yyyy
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}-${month}-${year}`;

    const url = `${CONSTANTS.COINGECKO_API_URL}/coins/uniswap/history?date=${formattedDate}&localization=false`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited by CoinGecko
        console.warn('CoinGecko rate limit hit');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.market_data?.current_price?.usd ?? null;
  } catch (error) {
    console.error(`Error fetching historical price for ${date}:`, error);
    return null;
  }
}

export async function getCurrentUniPriceFromCoinGecko(): Promise<number | null> {
  try {
    const url = `${CONSTANTS.COINGECKO_API_URL}/simple/price?ids=uniswap&vs_currencies=usd`;

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.uniswap?.usd ?? null;
  } catch (error) {
    console.error('Error fetching current UNI price from CoinGecko:', error);
    return null;
  }
}

// Cache for prices to avoid redundant API calls
const priceCache = new Map<string, number>();

export async function getHistoricalPriceWithCache(
  date: string,
  fallbackPrice: number | null = null
): Promise<number | null> {
  if (priceCache.has(date)) {
    return priceCache.get(date) ?? null;
  }

  // Rate limit: wait before making request
  await delay(1000);

  const price = await getHistoricalUniPrice(date);

  if (price !== null) {
    priceCache.set(date, price);
    return price;
  }

  // Use fallback price if historical price not available
  if (fallbackPrice !== null) {
    return fallbackPrice;
  }

  return null;
}

export function clearPriceCache(): void {
  priceCache.clear();
}
