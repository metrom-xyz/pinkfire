'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import type { ChartDataPoint } from '@/types';
import { THEME } from '@/lib/constants';

interface BurnChartProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: ChartDataPoint;
  }>;
  showUsd: boolean;
}

function CustomTooltip({ active, payload, showUsd }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const formattedDate = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-[#191919] border border-[#2D2D2D] rounded-lg p-4 shadow-xl">
      <p className="text-sm text-[#8B8B8B] mb-2">{formattedDate}</p>
      <div className="space-y-1">
        <p className="text-white">
          <span className="text-[#8B8B8B]">Cumulative: </span>
          <span className="font-bold text-[#FF007A]">
            {data.cumulative_uni.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{' '}
            UNI
          </span>
        </p>
        <p className="text-white">
          <span className="text-[#8B8B8B]">Daily: </span>
          <span className="font-medium">
            {data.daily_uni.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{' '}
            UNI
          </span>
        </p>
        {showUsd && data.usd_value && (
          <p className="text-white">
            <span className="text-[#8B8B8B]">USD Value: </span>
            <span className="font-medium text-[#27AE60]">
              ${data.usd_value.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        )}
        {data.isLive && (
          <p className="text-xs text-[#FF007A] mt-2 flex items-center gap-1">
            <span className="w-2 h-2 bg-[#FF007A] rounded-full animate-pulse" />
            Live (updating)
          </p>
        )}
      </div>
    </div>
  );
}

export function BurnChart({ data, isLoading = false }: BurnChartProps) {
  const [showUsd, setShowUsd] = useState(false);
  const [viewMode, setViewMode] = useState<'cumulative' | 'daily'>('daily');

  if (isLoading) {
    return (
      <div className="bg-[#191919] rounded-xl p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#FF007A] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#8B8B8B]">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#191919] rounded-xl p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl text-[#8B8B8B] mb-2">No burn data yet</p>
            <p className="text-sm text-[#8B8B8B]">
              Tracking burns starting from December 29, 2025
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.cumulative_uni));
  const maxDailyValue = Math.max(...data.map((d) => d.daily_uni), 10); // Ensure at least some height

  const yDomain = [0, Math.ceil(maxValue * 1.1)];
  const dailyYDomain = [0, Math.ceil(maxDailyValue * 1.1)];

  return (
    <div className="bg-[#191919] rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-semibold text-white">Daily Burn History</h2>

        <div className="flex items-center gap-4">
          {/* Switcher */}
          <div className="flex bg-[#0D0D0D] p-1 rounded-lg border border-[#2D2D2D]">
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'cumulative'
                ? 'bg-[#2D2D2D] text-white'
                : 'text-[#8B8B8B] hover:text-white'
                }`}
            >
              Cumulative
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'daily'
                ? 'bg-[#2D2D2D] text-white'
                : 'text-[#8B8B8B] hover:text-white'
                }`}
            >
              Daily
            </button>
          </div>

          {viewMode === 'cumulative' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUsd}
                onChange={(e) => setShowUsd(e.target.checked)}
                className="w-4 h-4 rounded border-[#2D2D2D] bg-[#191919] text-[#FF007A] focus:ring-[#FF007A] focus:ring-offset-0"
              />
              <span className="text-sm text-[#8B8B8B]">Show USD Value</span>
            </label>
          )}
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'cumulative' ? (
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <defs>
                <linearGradient id="burnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={THEME.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={THEME.border}
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                stroke={THEME.textSecondary}
                tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                axisLine={{ stroke: THEME.border }}
                tickLine={{ stroke: THEME.border }}
              />
              <YAxis
                stroke={THEME.textSecondary}
                tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                axisLine={{ stroke: THEME.border }}
                tickLine={{ stroke: THEME.border }}
                domain={yDomain}
                tickFormatter={(value) =>
                  value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}M`
                    : value >= 1000
                      ? `${(value / 1000).toFixed(1)}K`
                      : value.toString()
                }
              />
              {showUsd && (
                <YAxis
                  yAxisId="usd"
                  orientation="right"
                  stroke={THEME.success}
                  tick={{ fill: THEME.success, fontSize: 12 }}
                  axisLine={{ stroke: THEME.border }}
                  tickLine={{ stroke: THEME.border }}
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `$${(value / 1000000).toFixed(1)}M`
                      : value >= 1000
                        ? `$${(value / 1000).toFixed(1)}K`
                        : `$${value}`
                  }
                />
              )}
              <Tooltip content={<CustomTooltip showUsd={showUsd} />} />
              <Area
                type="monotone"
                dataKey="cumulative_uni"
                stroke="transparent"
                fill="url(#burnGradient)"
              />
              <Line
                type="monotone"
                dataKey="cumulative_uni"
                stroke={THEME.chartLine}
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: THEME.primary,
                  stroke: THEME.background,
                  strokeWidth: 2,
                }}
              />
              {showUsd && (
                <Line
                  type="monotone"
                  dataKey="usd_value"
                  yAxisId="usd"
                  stroke={THEME.success}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
            </ComposedChart>
          ) : (
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={THEME.border}
                vertical={false}
              />
              <XAxis
                dataKey="displayDate"
                stroke={THEME.textSecondary}
                tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                axisLine={{ stroke: THEME.border }}
                tickLine={{ stroke: THEME.border }}
              />
              <YAxis
                stroke={THEME.textSecondary}
                tick={{ fill: THEME.textSecondary, fontSize: 12 }}
                axisLine={{ stroke: THEME.border }}
                tickLine={{ stroke: THEME.border }}
                domain={dailyYDomain}
                tickFormatter={(value) =>
                  value >= 1000000
                    ? `${(value / 1000000).toFixed(1)}M`
                    : value >= 1000
                      ? `${(value / 1000).toFixed(1)}K`
                      : value.toString()
                }
              />
              <Tooltip content={<CustomTooltip showUsd={false} />} cursor={{ fill: 'transparent' }} />
              <Bar
                dataKey="daily_uni"
                name="Daily Burned"
                fill={THEME.primary}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
