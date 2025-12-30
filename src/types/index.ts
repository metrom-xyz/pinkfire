export interface DailyBurn {
  date: string;
  cumulative_uni: number;
  daily_uni: number;
  uni_price_usd: number | null;
  daily_usd_value: number | null;
  cumulative_usd_value: number | null;
  updated_at: string;
}

export interface BurnTransaction {
  tx_hash: string;
  block_number: number;
  timestamp: string;
  uni_amount: number;
  uni_price_usd: number | null;
  usd_value: number | null;
  from_address: string;
}

export interface BurnSummary {
  total_uni_burned: number;
  current_usd_value: number | null;
  historical_usd_value: number | null;
  today_burns: number;
  current_uni_price: number | null;
  last_updated: string;
}

export interface ChartDataPoint {
  date: string;
  displayDate: string;
  cumulative_uni: number;
  daily_uni: number;
  usd_value: number | null;
  isLive?: boolean;
}

export interface BlockScoutTokenTransfer {
  block_number: number;
  timestamp: string;
  transaction_hash: string;
  from: {
    hash: string;
  };
  to: {
    hash: string;
  };
  token: {
    address: string;
    symbol: string;
    decimals: string;
  };
  total: {
    value: string;
    decimals: string;
  };
}

export interface BlockScoutTokenBalance {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: string;
    exchange_rate: string | null;
  };
  value: string;
}

export interface BlockScoutTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: string;
  exchange_rate: string | null;
}

export interface BlockScoutTransferResponse {
  items: BlockScoutTokenTransfer[];
  next_page_params: {
    block_number: number;
    index: number;
    items_count: number;
  } | null;
}
