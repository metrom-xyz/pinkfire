'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getEnabledChains } from '@/lib/constants';
import type { ChainBurnSummary } from '@/types';
import { useIsClient } from '@/lib/use-is-client';

interface ChainBreakdownProps {
  perChain: ChainBurnSummary[];
}

interface ChainBreakdownTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number }>;
  total: number;
}

function ChainBreakdownTooltip({ active, payload, total }: ChainBreakdownTooltipProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  if (entry?.value === undefined) return null;
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-[#191919] border border-[#2D2D2D] rounded-lg p-3 shadow-xl">
      <p className="text-sm font-medium text-white">{entry.name}</p>
      <p className="text-sm text-[#8B8B8B]">
        {entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
      </p>
      <p className="text-xs text-[#8B8B8B]">{pct}%</p>
    </div>
  );
}

export function ChainBreakdown({ perChain }: ChainBreakdownProps) {
  const isMounted = useIsClient();
  const chains = getEnabledChains();

  const chainMap = new Map(chains.map((c) => [c.id, c]));

  const data = perChain
    .filter((c) => c.total_uni_burned > 0)
    .map((c) => ({
      name: chainMap.get(c.chain)?.name || c.chain,
      value: c.total_uni_burned,
      color: chainMap.get(c.chain)?.color || '#8B8B8B',
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#191919] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Burns by Chain</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-[200px] h-[200px]">
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={(props) => (
                    <ChainBreakdownTooltip
                      active={props.active}
                      payload={props.payload}
                      total={total}
                    />
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-pulse bg-[#2D2D2D] rounded-full w-[170px] h-[170px] opacity-20" />
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={entry.name} className="flex items-center gap-2 text-sm">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[#8B8B8B]">{entry.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-white font-mono">{entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI</span>
                  <span className="text-[#8B8B8B] font-mono ml-2">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
