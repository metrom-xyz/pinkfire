import { NextResponse } from 'next/server';
import { syncBurnData } from '@/lib/sync';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await syncBurnData();

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Synced ${result.newTransactions} new transactions`
        : 'Sync failed',
      data: {
        newTransactions: result.newTransactions,
        totalBurned: result.totalBurned,
        currentPrice: result.currentPrice,
        lastUpdated: result.lastUpdated,
      },
      error: result.error,
    });
  } catch (error) {
    console.error('Error refreshing burn data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
