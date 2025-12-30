'use client';

interface RefreshIndicatorProps {
  lastUpdated: string | null;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshIndicator({
  lastUpdated,
  isRefreshing,
  onRefresh,
}: RefreshIndicatorProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex items-center gap-3">
      {lastUpdated && (
        <span className="text-sm text-[#8B8B8B]">
          Last updated: {formatTime(lastUpdated)}
        </span>
      )}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`
          p-2 rounded-lg transition-all duration-200
          ${
            isRefreshing
              ? 'bg-[#2D2D2D] cursor-not-allowed'
              : 'bg-[#191919] hover:bg-[#2D2D2D]'
          }
        `}
        aria-label="Refresh data"
      >
        <svg
          className={`w-5 h-5 text-[#FF007A] ${isRefreshing ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
}
