import { NextResponse } from 'next/server';
import {
  getTotalBurned,
  getTodayBurns,
  getHistoricalUsdValue,
  getLatestDailyBurn,
  getPerChainSummary,
} from '@/lib/database';
import { getCurrentUniPrice } from '@/lib/blockscout';
import type { BurnSummary, ChainBurnSummary } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || undefined;

    const totalBurned = await getTotalBurned(chain);
    const todayBurns = await getTodayBurns(chain);
    const historicalUsdValue = await getHistoricalUsdValue(chain);
    const latestDailyBurn = await getLatestDailyBurn();

    let currentPrice: number | null = null;
    try {
      currentPrice = await getCurrentUniPrice();
    } catch (e) {
      console.warn('Failed to fetch current UNI price:', e);
    }

    const currentUsdValue = currentPrice ? totalBurned * currentPrice : null;

    // Get per-chain breakdown (gracefully handle unmigrated DB)
    let perChain: ChainBurnSummary[] = [];
    try {
      const chainRows = await getPerChainSummary();
      perChain = chainRows.map((row) => ({
        chain: row.chain,
        total_uni_burned: row.total_uni,
        historical_usd_value: row.total_usd || null,
        today_burns: row.today_uni,
      }));
    } catch {
      // chain column doesn't exist yet — migration not run
    }

    const summary: BurnSummary = {
      total_uni_burned: totalBurned,
      current_usd_value: currentUsdValue,
      historical_usd_value: historicalUsdValue || null,
      today_burns: todayBurns,
      current_uni_price: currentPrice,
      last_updated: latestDailyBurn?.updated_at || new Date().toISOString(),
      per_chain: perChain,
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
