import { NextResponse } from 'next/server';
import {
  getTotalBurned,
  getTodayBurns,
  getHistoricalUsdValue,
  getLatestDailyBurn,
} from '@/lib/database';
import { getCurrentUniPrice } from '@/lib/blockscout';
import type { BurnSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totalBurned = getTotalBurned();
    const todayBurns = getTodayBurns();
    const historicalUsdValue = getHistoricalUsdValue();
    const latestDailyBurn = getLatestDailyBurn();

    // Try to get current price, but don't block if it fails
    let currentPrice: number | null = null;
    try {
      currentPrice = await getCurrentUniPrice();
    } catch (e) {
      console.warn('Failed to fetch current UNI price:', e);
    }

    const currentUsdValue = currentPrice ? totalBurned * currentPrice : null;

    const summary: BurnSummary = {
      total_uni_burned: totalBurned,
      current_usd_value: currentUsdValue,
      historical_usd_value: historicalUsdValue || null,
      today_burns: todayBurns,
      current_uni_price: currentPrice,
      last_updated: latestDailyBurn?.updated_at || new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching burn summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null,
      },
      { status: 500 }
    );
  }
}
