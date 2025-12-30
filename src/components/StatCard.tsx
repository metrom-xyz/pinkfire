'use client';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  isLoading?: boolean;
  highlight?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  isLoading = false,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`
        rounded-xl p-6 transition-all duration-200
        ${highlight ? 'bg-[#FF007A]/10 border border-[#FF007A]/30' : 'bg-[#191919]'}
        hover:bg-[#2D2D2D]
      `}
    >
      <h3 className="text-sm font-medium text-[#8B8B8B] mb-2">{title}</h3>
      {isLoading ? (
        <div className="h-9 w-32 bg-[#2D2D2D] rounded animate-pulse" />
      ) : (
        <p
          className={`text-3xl font-bold ${highlight ? 'text-[#FF007A]' : 'text-white'}`}
        >
          {value}
        </p>
      )}
      {subtitle && (
        <p className="text-sm text-[#8B8B8B] mt-1">{subtitle}</p>
      )}
    </div>
  );
}
