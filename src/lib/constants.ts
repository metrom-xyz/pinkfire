export const CONSTANTS = {
  DEAD_ADDRESS: '0x000000000000000000000000000000000000dEaD',
  UNI_TOKEN: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  START_DATE: '2025-12-29',
  BLOCKSCOUT_BASE_URL: 'https://eth.blockscout.com/api/v2',
  REFRESH_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  UNI_DECIMALS: 18,
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
} as const;

export const THEME = {
  background: '#0D0D0D',
  surface: '#191919',
  surfaceLight: '#2D2D2D',
  primary: '#FF007A',
  primaryLight: '#FF6BA9',
  text: '#FFFFFF',
  textSecondary: '#8B8B8B',
  success: '#27AE60',
  border: '#2D2D2D',
  chartLine: '#FF007A',
  chartArea: 'rgba(255, 0, 122, 0.1)',
} as const;
