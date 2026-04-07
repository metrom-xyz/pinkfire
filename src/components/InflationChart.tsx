'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { THEME } from '@/lib/constants';
import { useIsClient } from '@/lib/use-is-client';

interface InflationChartProps {
    currentBurn: number;
}

interface InflationTooltipProps {
    active?: boolean;
    payload?: ReadonlyArray<unknown>;
    currentBurn: number;
    remaining: number;
    isDeflationary: boolean;
}

function InflationTooltip({
    active,
    payload,
    currentBurn,
    remaining,
    isDeflationary,
}: InflationTooltipProps) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[#191919] border border-[#2D2D2D] rounded-lg p-4 shadow-xl">
            <p className="text-sm text-[#8B8B8B] mb-2">Inflation Analysis</p>
            <div className="space-y-2">
                <div>
                    <p className="text-[#8B8B8B] text-xs">Target</p>
                    <p className="text-white font-mono">20,000,000 UNI</p>
                </div>
                <div>
                    <p className="text-[#8B8B8B] text-xs">Current Burned</p>
                    <p className={`font-bold font-mono ${isDeflationary ? 'text-[#27AE60]' : 'text-[#FF007A]'}`}>
                        {currentBurn.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                    </p>
                </div>
                {!isDeflationary && (
                    <div>
                        <p className="text-[#8B8B8B] text-xs">Remaining to Deflationary</p>
                        <p className="text-[#4A4A4A] font-mono">
                            {remaining.toLocaleString(undefined, { maximumFractionDigits: 0 })} UNI
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export function InflationChart({ currentBurn }: InflationChartProps) {
    const TARGET_BURN = 20_000_000;
    const isDeflationary = currentBurn >= TARGET_BURN;
    const isMounted = useIsClient();

    // For the progress bar:
    // If not deflationary:
    //   - segment 1: currentBurn (Pink)
    //   - segment 2: remaining (Grey)
    // If deflationary:
    //   - segment 1: currentBurn (Green) - represents full deflationary status
    const remaining = Math.max(0, TARGET_BURN - currentBurn);

    const data = [
        {
            name: 'Status',
            burned: currentBurn,
            remaining: isDeflationary ? 0 : remaining,
            // Helper for tooltip
            target: TARGET_BURN,
        },
    ];

    // Calculate percentage for display
    const percentage = (currentBurn / TARGET_BURN) * 100;

    return (
        <div className="bg-[#191919] rounded-xl p-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-white">
                        Will UNI be deflationary by the end of 2026?
                    </h2>
                    <p className="text-sm text-[#8B8B8B] mt-1">
                        Comparing total accumulated burns against the annual inflation offset target (20M UNI).
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-[#2D2D2D]/30 px-4 py-2 rounded-lg border border-[#2D2D2D]">
                    <div className="text-right">
                        <span className="text-xs text-[#8B8B8B] block">Progress to Deflationary</span>
                        <span className={`font-mono font-bold ${isDeflationary ? "text-[#27AE60]" : "text-[#FF007A]"}`}>
                            {percentage.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-[120px] w-full">
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={data}
                        >
                            <XAxis type="number" hide domain={[0, Math.max(TARGET_BURN, currentBurn)]} />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                                content={(props) => (
                                    <InflationTooltip
                                        active={props.active}
                                        payload={props.payload}
                                        currentBurn={currentBurn}
                                        remaining={remaining}
                                        isDeflationary={isDeflationary}
                                    />
                                )}
                                cursor={false}
                            />
                            <Bar dataKey="burned" stackId="a" fill={isDeflationary ? "#27AE60" : THEME.primary} radius={isDeflationary ? [4, 4, 4, 4] : [4, 0, 0, 4]} barSize={40} />
                            <Bar dataKey="remaining" stackId="a" fill="#333333" radius={[0, 4, 4, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-pulse bg-[#2D2D2D] rounded-lg w-full h-full opacity-20"></div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-[#8B8B8B] -mt-2">
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-sm ${isDeflationary ? "bg-[#27AE60]" : "bg-[#FF007A]"}`}></span>
                    <span>Current Burned</span>
                </div>
                {!isDeflationary && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-sm bg-[#333333]"></span>
                        <span>Remaining (Target 20M)</span>
                    </div>
                )}
            </div>
        </div>
    );
}
