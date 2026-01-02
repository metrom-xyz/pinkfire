'use client';

import { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';
import { THEME } from '@/lib/constants';
import { ChartDataPoint } from '@/types';

interface UnvestingChartProps {
    data: ChartDataPoint[];
}

export function UnvestingChart({ data }: UnvestingChartProps) {
    const [viewMode, setViewMode] = useState<'cumulative' | 'daily'>('cumulative');
    const TARGET_ANNUAL_EMISSION = 20_000_000;
    const DAILY_EMISSION = TARGET_ANNUAL_EMISSION / 365;
    const EMISSION_START_DATE = '2026-01-01';

    // Process data to add emission values
    const processedData = data.map((point) => {
        let accumulatedEmission = 0;
        let dailyEmission = 0;

        // Check if date is after or equal to emission start date
        if (point.date >= EMISSION_START_DATE) {
            // Calculate days since Jan 1st (inclusive)
            const start = new Date(EMISSION_START_DATE);
            const current = new Date(point.date);
            const diffTime = current.getTime() - start.getTime();
            // Use Math.round to avoid potential float errors, +1 to include start date
            const daysPassed = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

            if (daysPassed > 0) {
                accumulatedEmission = DAILY_EMISSION * daysPassed;
                dailyEmission = DAILY_EMISSION;
            }
        }

        return {
            ...point,
            emission: accumulatedEmission,
            daily_emission: dailyEmission,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#191919] border border-[#2D2D2D] rounded-lg p-4 shadow-xl">
                    <p className="text-sm text-[#8B8B8B] mb-2">{label}</p>
                    <div className="space-y-2">
                        {payload.map((entry: any) => (
                            <div key={entry.name}>
                                <p className="text-[#8B8B8B] text-xs">{entry.name}</p>
                                <p className="font-mono text-sm" style={{ color: entry.fill.includes('Accumulated Emission') || entry.fill === '#2D2D2D' ? '#8B8B8B' : entry.color }}>
                                    {entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#191919] rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-white">
                        Daily unvesting vs burn
                    </h3>
                </div>

                {/* Switcher */}
                <div className="flex bg-[#0D0D0D] p-1 rounded-lg border border-[#2D2D2D] self-start sm:self-auto">
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
            </div>

            <p className="text-sm text-[#8B8B8B] mb-6">
                This chart represents daily unvesting data with daily burns. Burns start from 29 Dec, while unvesting starts from Jan 1, 2026.
            </p>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {viewMode === 'cumulative' ? (
                        <AreaChart data={processedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={THEME.primary} stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4A4A4A" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#4A4A4A" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="displayDate"
                                stroke="#333"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#333', strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey="emission"
                                stroke="#8B8B8B"
                                fill="url(#colorEmission)"
                                name="Accumulated Emission"
                                strokeWidth={2}
                                fillOpacity={1}
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulative_uni"
                                stroke={THEME.primary}
                                fill="url(#colorBurn)"
                                name="Total Burned"
                                strokeWidth={2}
                                fillOpacity={1}
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={processedData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <XAxis
                                dataKey="displayDate"
                                stroke="#333"
                                tick={{ fill: '#666', fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis hide />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            <Bar
                                dataKey="daily_emission"
                                name="Daily Emission"
                                fill="#2D2D2D"
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                            <Bar
                                dataKey="daily_uni"
                                name="Daily Burned"
                                fill={THEME.primary}
                                radius={[4, 4, 0, 0]}
                                barSize={20}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-[#8B8B8B] mt-4">
                <div className="flex items-center gap-2">
                    {/* Dynamic legend based on view mode */}
                    <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: THEME.primary }}></span>
                    <span>{viewMode === 'cumulative' ? 'Total Burned' : 'Daily Burned'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm bg-[#2D2D2D] border border-[#8B8B8B]"></span>
                    <span>{viewMode === 'cumulative' ? 'Accumulated Emission' : 'Daily Emission'}</span>
                </div>
            </div>
        </div>
    );
}
