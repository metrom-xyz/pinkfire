import { NextResponse } from 'next/server';
import { getDailyBurns, getDailyBurnsAggregated } from '@/lib/database';
import { getEnabledChains } from '@/lib/constants';
import type { ChartDataPoint, DailyBurn } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chain = searchParams.get('chain') || undefined;

    let dailyBurns: DailyBurn[];

    if (chain) {
      dailyBurns = await getDailyBurns(chain);
    } else {
      dailyBurns = await getDailyBurnsAggregated();
    }

    // Also fetch per-chain daily data for stacked chart breakdown
    const enabledChains = getEnabledChains();
    const perChainData = new Map<string, Map<string, number>>();

    if (!chain) {
      // Fetch all chains' daily data for the breakdown
      const allDailyBurns = await getDailyBurns();
      for (const burn of allDailyBurns) {
        if (!perChainData.has(burn.date)) {
          perChainData.set(burn.date, new Map());
        }
        perChainData.get(burn.date)!.set(burn.chain, burn.daily_uni);
      }
    }

    const chartData: ChartDataPoint[] = dailyBurns.map((burn, index) => {
      const date = new Date(burn.date);
      const displayDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const isLastItem = index === dailyBurns.length - 1;
      const isToday = burn.date === new Date().toISOString().split('T')[0];

      const point: ChartDataPoint = {
        date: burn.date,
        displayDate,
        cumulative_uni: burn.cumulative_uni,
        daily_uni: burn.daily_uni,
        usd_value: burn.cumulative_usd_value,
        isLive: isLastItem && isToday,
      };

      // Add per-chain daily values for stacked chart
      if (!chain && perChainData.has(burn.date)) {
        const dayChains = perChainData.get(burn.date)!;
        for (const c of enabledChains) {
          point[`daily_${c.id}`] = dayChains.get(c.id) || 0;
        }
      }

      return point;
    });

    return NextResponse.json({
      success: true,
      data: chartData,
      count: chartData.length,
      chains: enabledChains.map((c) => ({ id: c.id, name: c.name, color: c.color })),
    });
  } catch (error) {
    console.error('Error fetching daily burns:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
      },
      { status: 500 }
    );
  }
}
