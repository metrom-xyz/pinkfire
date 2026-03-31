'use client';

import { getEnabledChains } from '@/lib/constants';

interface ChainSelectorProps {
  selected: string | null;
  onChange: (chain: string | null) => void;
}

export function ChainSelector({ selected, onChange }: ChainSelectorProps) {
  const chains = getEnabledChains();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
          selected === null
            ? 'bg-[#FF007A]/20 border-[#FF007A] text-white'
            : 'bg-[#0D0D0D] border-[#2D2D2D] text-[#8B8B8B] hover:text-white hover:border-[#4A4A4A]'
        }`}
      >
        All Chains
      </button>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onChange(chain.id)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border flex items-center gap-1.5 ${
            selected === chain.id
              ? 'bg-[#2D2D2D] border-[#4A4A4A] text-white'
              : 'bg-[#0D0D0D] border-[#2D2D2D] text-[#8B8B8B] hover:text-white hover:border-[#4A4A4A]'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ backgroundColor: chain.color }}
          />
          {chain.name}
        </button>
      ))}
    </div>
  );
}
