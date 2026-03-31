import { NextResponse } from 'next/server';
import { getRecentBurnTransactions } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '5', 10);
        const chain = searchParams.get('chain') || undefined;

        const safeLimit = Math.min(Math.max(limit, 1), 20);

        const transactions = await getRecentBurnTransactions(safeLimit, chain);

        return NextResponse.json({
            success: true,
            data: transactions,
            count: transactions.length,
        });
    } catch (error) {
        console.error('Error fetching latest burns:', error);
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
