'use client';

import { RefreshIndicator } from './RefreshIndicator';

interface HeaderProps {
  lastUpdated: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function Header({ lastUpdated, isRefreshing, onRefresh }: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <span className="text-3xl" role="img" aria-label="fire">
          🔥
        </span>
        <h1 className="text-2xl font-bold text-white">UNI Burn Tracker</h1>
      </div>
      <RefreshIndicator
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />
    </header>
  );
}
