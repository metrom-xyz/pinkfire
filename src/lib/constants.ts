import type { ChainConfig } from '@/types';

export const CONSTANTS = {
  DEAD_ADDRESS: '0x000000000000000000000000000000000000dEaD',
  UNI_TOKEN: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
  START_DATE: '2025-12-29',
  BLOCKSCOUT_BASE_URL: 'https://eth.blockscout.com/api/v2',
  REFRESH_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  UNI_DECIMALS: 18,
  COINGECKO_API_URL: 'https://api.coingecko.com/api/v3',
} as const;

export const CHAINS: ChainConfig[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    blockscoutBaseUrl: 'https://eth.blockscout.com/api/v2',
    uniTokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    // Ethereum: track transfers TO 0xdEaD (no releaser needed, direct burns)
    startDate: '2025-12-29',
    color: '#627EEA',
    enabled: true,
  },
  {
    id: 'unichain',
    name: 'Unichain',
    chainId: 130,
    blockscoutBaseUrl: 'https://unichain.blockscout.com/api/v2',
    uniTokenAddress: '0x8f187aA05619a017077f5308904739877ce9eA21',
    releaserAddress: '0xe0A780E9105aC10Ee304448224Eb4A2b11A77eeB',
    startDate: '2025-12-29',
    color: '#FF007A',
    enabled: true,
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    blockscoutBaseUrl: 'https://arbitrum.blockscout.com/api/v2',
    uniTokenAddress: '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0',
    releaserAddress: '0xB8018422bcE25D82E70cB98FdA96a4f502D89427',
    startDate: '2026-03-08',
    color: '#12AAFF',
    enabled: true,
  },
  {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    blockscoutBaseUrl: 'https://base.blockscout.com/api/v2',
    uniTokenAddress: '0xc3De830EA07524a0761646a6a4e4be0e114a3C83',
    releaserAddress: '0xFf77c0ED0B6b13A20446969107E5867abc46f53a',
    startDate: '2026-03-08',
    color: '#0052FF',
    enabled: true,
  },
  {
    id: 'optimism',
    name: 'OP Mainnet',
    chainId: 10,
    blockscoutBaseUrl: 'https://explorer.optimism.io/api/v2',
    uniTokenAddress: '0x6fd9d7AD17242c41f7131d257212c54A0e816691',
    releaserAddress: '0x94460443Ca27FFC1baeCa61165fde18346C91AbD',
    startDate: '2026-03-08',
    color: '#FF0420',
    enabled: true,
  },
  {
    id: 'celo',
    name: 'Celo',
    chainId: 42220,
    blockscoutBaseUrl: 'https://celo.blockscout.com/api/v2',
    uniTokenAddress: '0xeE571697998ec64e32B57D754D700c4dda2f2a0e',
    releaserAddress: '0x2758FbaA228D7d3c41dD139F47dab1a27bF9bc25',
    startDate: '2026-03-08',
    color: '#FCFF52',
    enabled: true,
  },
  {
    id: 'soneium',
    name: 'Soneium',
    chainId: 1868,
    blockscoutBaseUrl: 'https://soneium.blockscout.com/api/v2',
    uniTokenAddress: '0x2e334AEb8C438eF66B966de7956Cc2c854e2814D',
    releaserAddress: '0xc9CC50A75cE2a5f88fa77B43e3b050480c731b6e',
    startDate: '2026-03-08',
    color: '#7B68EE',
    enabled: false, // No Releaser activity yet
  },
  {
    id: 'worldchain',
    name: 'Worldchain',
    chainId: 480,
    blockscoutBaseUrl: 'https://worldchain-mainnet.explorer.alchemy.com/api/v2',
    uniTokenAddress: '0x3988513793bCE39f0167064A9F7fC3617FaF0AB0',
    releaserAddress: '0x455e844D286631566cF98D6cb2996149734618C6',
    startDate: '2026-03-08',
    color: '#00C853',
    enabled: false, // No Releaser activity yet
  },
  {
    id: 'xlayer',
    name: 'X Layer',
    chainId: 196,
    blockscoutBaseUrl: 'https://www.okx.com/web3/explorer/xlayer/api/v2',
    uniTokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    releaserAddress: '0xe122E231cb52aea99690963Fd73E91e33E97468f',
    startDate: '2026-03-08',
    color: '#E6E6E6',
    enabled: false, // Enable after verifying explorer API compatibility
  },
  {
    id: 'zora',
    name: 'Zora',
    chainId: 7777777,
    blockscoutBaseUrl: 'https://explorer.zora.energy/api/v2',
    uniTokenAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    releaserAddress: '0x2f98eD4D04e633169FbC941BFCc54E785853b143',
    startDate: '2026-03-08',
    color: '#A855F7',
    enabled: false, // Enable after verifying UNI token address
  },
];

export function getEnabledChains(): ChainConfig[] {
  return CHAINS.filter((c) => c.enabled);
}

export function getChainById(id: string): ChainConfig | undefined {
  return CHAINS.find((c) => c.id === id);
}

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
