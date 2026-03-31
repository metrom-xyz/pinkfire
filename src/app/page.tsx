'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Header,
  StatCard,
  BurnChart,
  Footer,
  InflationChart,
  UnvestingChart,
  ChainSelector,
  ChainBreakdown,
} from '@/components';
import type { BurnSummary, ChartDataPoint } from '@/types';
import { CONSTANTS } from '@/lib/constants';
import { useState, useCallback } from 'react';

interface ChainInfo {
  id: string;
  name: string;
  color: string;
}

interface DailyBurnsResponse {
  success: boolean;
  data: ChartDataPoint[];
  count: number;
  chains: ChainInfo[];
  error?: string;
}

interface SummaryResponse {
  success: boolean;
  data: BurnSummary | null;
  error?: string;
}

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
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
  const [selectedChain, setSelectedChain] = useState<string | null>(null);

  const chainParam = selectedChain ? `?chain=${selectedChain}` : '';

  const {
    data: dailyData,
    isLoading: isDailyLoading,
    error: dailyError,
  } = useQuery<DailyBurnsResponse>({
    queryKey: ['daily-burns', selectedChain],
    queryFn: async () => {
      const res = await fetch(`/api/burns/daily${chainParam}`);
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
    queryKey: ['burn-summary', selectedChain],
    queryFn: async () => {
      const res = await fetch(`/api/burns/summary${chainParam}`);
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
  const chains = dailyData?.chains || [];
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

        {/* Chain Selector */}
        <div className="mb-6">
          <ChainSelector selected={selectedChain} onChange={setSelectedChain} />
        </div>

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
              summary?.historical_usd_value
                ? `USD Value at burn: ${formatUSD(summary.historical_usd_value)}`
                : undefined
            }
            isLoading={isLoading}
            highlight
          />
          <StatCard
            title="Current UNI Price"
            value={
              summary?.current_uni_price
                ? new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(summary.current_uni_price)
                : '$0.00'
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

        {/* Inflation Analysis Chart */}
        <InflationChart currentBurn={summary?.total_uni_burned || 0} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Unvesting Analysis Chart */}
          <UnvestingChart data={chartData} />

          {/* Burn Chart */}
          <BurnChart
            data={chartData}
            isLoading={isDailyLoading}
            chains={chains}
            selectedChain={selectedChain}
          />
        </div>

        {/* Chain Breakdown - only show when viewing all chains */}
        {!selectedChain && summary?.per_chain && summary.per_chain.length > 0 && (
          <div className="mt-6">
            <ChainBreakdown perChain={summary.per_chain} />
          </div>
        )}

        {/* Footer Info */}
        <Footer />
      </div>
    </main>
  );
}
