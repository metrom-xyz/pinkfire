import { CONSTANTS } from './constants';
import {
  getDb,
  getDailyBurns,
  upsertDailyBurn,
  insertManyBurnTransactions,
  getLatestBurnTransaction,
  getBurnTransactions,
} from './database';
import {
  getUniTransfersToDeadAddress,
  getCurrentUniPrice,
  getDeadAddressUniBalance,
} from './blockscout';
import { getHistoricalPriceWithCache } from './price';
import type { DailyBurn, BurnTransaction } from '@/types';

export interface SyncResult {
  success: boolean;
  newTransactions: number;
  totalBurned: number;
  currentPrice: number | null;
  lastUpdated: string;
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

export async function syncBurnData(): Promise<SyncResult> {
  const now = new Date().toISOString();

  try {
    // Get the latest transaction we have
    const latestTx = getLatestBurnTransaction();

    // Fetch new transactions from BlockScout
    const newTransactions = await getUniTransfersToDeadAddress(
      CONSTANTS.START_DATE,
      latestTx?.block_number
    );

    // Get current UNI price
    const currentPrice = await getCurrentUniPrice();

    if (newTransactions.length > 0) {
      // Add price data to new transactions
      for (const tx of newTransactions) {
        if (currentPrice) {
          tx.uni_price_usd = currentPrice;
          tx.usd_value = tx.uni_amount * currentPrice;
        }
      }

      // Store new transactions
      insertManyBurnTransactions(newTransactions);
    }

    // Get all transactions and recalculate daily burns
    const allTransactions = getBurnTransactions();
    const groupedByDate = groupTransactionsByDate(allTransactions);

    // Sort dates
    const dates = Array.from(groupedByDate.keys()).sort();

    let cumulativeUni = 0;
    let cumulativeUsd = 0;

    for (const date of dates) {
      const dayTransactions = groupedByDate.get(date) || [];
      const dailyUni = dayTransactions.reduce((sum, tx) => sum + tx.uni_amount, 0);

      cumulativeUni += dailyUni;

      // Use current price for today, try to get historical for past dates
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
        cumulative_uni: cumulativeUni,
        daily_uni: dailyUni,
        uni_price_usd: priceForDay,
        daily_usd_value: dailyUsdValue,
        cumulative_usd_value: cumulativeUsd,
        updated_at: now,
      };

      upsertDailyBurn(dailyBurn);
    }

    // If no transactions yet, check current balance as a fallback
    if (allTransactions.length === 0) {
      const currentBalance = await getDeadAddressUniBalance();
      if (currentBalance && currentBalance > 0) {
        // There are burns but we haven't fetched them yet
        // This could happen if we're starting fresh
        console.log('Current dead address UNI balance:', currentBalance);
      }
    }

    return {
      success: true,
      newTransactions: newTransactions.length,
      totalBurned: cumulativeUni,
      currentPrice,
      lastUpdated: now,
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
  console.log('Starting initial sync from', CONSTANTS.START_DATE);

  // Fetch all transactions since start date
  const transactions = await getUniTransfersToDeadAddress(CONSTANTS.START_DATE);
  const currentPrice = await getCurrentUniPrice();

  if (transactions.length > 0) {
    // Add price data
    for (const tx of transactions) {
      if (currentPrice) {
        tx.uni_price_usd = currentPrice;
        tx.usd_value = tx.uni_amount * currentPrice;
      }
    }

    insertManyBurnTransactions(transactions);
  }

  // Now run normal sync to calculate daily burns
  return syncBurnData();
}
