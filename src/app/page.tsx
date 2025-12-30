'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header, StatCard, BurnChart } from '@/components';
import type { BurnSummary, ChartDataPoint } from '@/types';
import { CONSTANTS } from '@/lib/constants';
import { useState, useCallback } from 'react';

interface DailyBurnsResponse {
  success: boolean;
  data: ChartDataPoint[];
  count: number;
  error?: string;
}

interface SummaryResponse {
  success: boolean;
  data: BurnSummary | null;
  error?: string;
}

function formatNumber(value: number, decimals = 2): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dailyData,
    isLoading: isDailyLoading,
    error: dailyError,
  } = useQuery<DailyBurnsResponse>({
    queryKey: ['daily-burns'],
    queryFn: async () => {
      const res = await fetch('/api/burns/daily');
      if (!res.ok) throw new Error('Failed to fetch daily burns');
      return res.json();
    },
    refetchInterval: CONSTANTS.REFRESH_INTERVAL_MS,
  });

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useQuery<SummaryResponse>({
    queryKey: ['burn-summary'],
    queryFn: async () => {
      const res = await fetch('/api/burns/summary');
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    refetchInterval: CONSTANTS.REFRESH_INTERVAL_MS,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/burns/refresh');
      await queryClient.invalidateQueries({ queryKey: ['daily-burns'] });
      await queryClient.invalidateQueries({ queryKey: ['burn-summary'] });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const chartData = dailyData?.data || [];
  const summary = summaryData?.data;
  const isLoading = isDailyLoading || isSummaryLoading;
  const hasError = dailyError || summaryError;

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header
          lastUpdated={summary?.last_updated || null}
          isRefreshing={isRefreshing || isLoading}
          onRefresh={handleRefresh}
        />

        {hasError && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400">
              Error loading data. Please try refreshing.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total UNI Burned"
            value={
              summary?.total_uni_burned
                ? `${formatNumber(summary.total_uni_burned)} UNI`
                : '0 UNI'
            }
            subtitle={
              summary?.current_uni_price
                ? `@ ${formatUSD(summary.current_uni_price)}/UNI`
                : undefined
            }
            isLoading={isLoading}
            highlight
          />
          <StatCard
            title="Current USD Value"
            value={
              summary?.current_usd_value
                ? formatUSD(summary.current_usd_value)
                : '$0'
            }
            subtitle={
              summary?.historical_usd_value
                ? `Historical: ${formatUSD(summary.historical_usd_value)}`
                : undefined
            }
            isLoading={isLoading}
          />
          <StatCard
            title="Today's Burns"
            value={
              summary?.today_burns
                ? `${formatNumber(summary.today_burns)} UNI`
                : '0 UNI'
            }
            subtitle="Since midnight UTC"
            isLoading={isLoading}
          />
        </div>

        {/* Chart */}
        <BurnChart data={chartData} isLoading={isDailyLoading} />

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#8B8B8B]">
            Tracking burns to{' '}
            <a
              href={`https://etherscan.io/address/${CONSTANTS.DEAD_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF007A] hover:underline"
            >
              {CONSTANTS.DEAD_ADDRESS.slice(0, 6)}...
              {CONSTANTS.DEAD_ADDRESS.slice(-4)}
            </a>{' '}
            since {CONSTANTS.START_DATE}
          </p>
          <p className="text-xs text-[#8B8B8B] mt-2">
            Data refreshes every 5 minutes via BlockScout API
          </p>
        </div>
      </div>
    </main>
  );
}
