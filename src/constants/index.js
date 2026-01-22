// Supported exchanges
export const EXCHANGES = [
  { id: 'bitmart', name: 'BitMart', requiresMemo: true },
  { id: 'binance', name: 'Binance', requiresMemo: false },
  { id: 'kucoin', name: 'KuCoin', requiresMemo: true },
  { id: 'gateio', name: 'Gate.io', requiresMemo: false },
  { id: 'mexc', name: 'MEXC', requiresMemo: false },
  { id: 'bybit', name: 'Bybit', requiresMemo: false },
  { id: 'okx', name: 'OKX', requiresMemo: true },
  { id: 'htx', name: 'HTX (Huobi)', requiresMemo: false },
  { id: 'coinbase', name: 'Coinbase', requiresMemo: false },
  { id: 'kraken', name: 'Kraken', requiresMemo: false },
];

// Client status options
export const CLIENT_STATUSES = {
  ACTIVE: 'active',
  INVITED: 'invited',
  INACTIVE: 'inactive',
};

// Status badge styles
export const STATUS_STYLES = {
  active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Active' },
  invited: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Invited' },
  inactive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Inactive' },
};

// Quick prompts for AI chat
export const ADMIN_QUICK_PROMPTS = [
  "Show all client balances",
  "Global P&L this week",
  "List active bots",
  "SHARP/USDT price on BitMart",
];

export const CLIENT_QUICK_PROMPTS = [
  "Show my balances",
  "My P&L today",
  "Trade history",
  "SHARP/USDT price",
];
