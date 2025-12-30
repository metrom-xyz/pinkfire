import { NextResponse } from 'next/server';
import { getDailyBurns } from '@/lib/database';
import type { ChartDataPoint } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dailyBurns = getDailyBurns();

    // Transform to chart data points
    const chartData: ChartDataPoint[] = dailyBurns.map((burn, index) => {
      const date = new Date(burn.date);
      const displayDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      const isLastItem = index === dailyBurns.length - 1;
      const isToday = burn.date === new Date().toISOString().split('T')[0];

      return {
        date: burn.date,
        displayDate,
        cumulative_uni: burn.cumulative_uni,
        daily_uni: burn.daily_uni,
        usd_value: burn.cumulative_usd_value,
        isLive: isLastItem && isToday,
      };
    });

    return NextResponse.json({
      success: true,
      data: chartData,
      count: chartData.length,
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
