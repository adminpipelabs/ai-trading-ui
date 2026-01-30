import { BalanceButton } from "../components/BalanceButton";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { SpreadOrderButton } from "../components/SpreadOrderButton";
import { VolumeOrderButton } from "../components/VolumeOrderButton";
import BotManagement from "./admin/BotManagement";
import ClientManagement, { AddClientModal } from "./admin/ClientManagement";
import Overview, { MetricCard } from "./admin/Overview";
import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  Bot, User, Activity, Users, Plus, BarChart3, LogOut, ChevronRight, Moon, Sun, MessageSquare
} from 'lucide-react';
// All API calls use trading-bridge directly
const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

// ========== THEME CONTEXT ==========
const ThemeContext = createContext();

const themes = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgCard: '#ffffff',
    bgCardHover: '#f1f5f9',
    bgInput: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    accent: '#0d9488',
    accentLight: 'rgba(13, 148, 136, 0.1)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
    shadowLg: '0 4px 20px rgba(0,0,0,0.08)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.15)',
    logoBg: '#0f172a',
  },
  dark: {
    bgPrimary: '#0a0f1a',
    bgSecondary: '#111827',
    bgCard: 'rgba(255,255,255,0.03)',
    bgCardHover: 'rgba(255,255,255,0.06)',
    bgInput: 'rgba(255,255,255,0.05)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.1)',
    accent: '#5eead4',
    accentLight: 'rgba(94, 234, 212, 0.15)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: 'none',
    shadowLg: '0 4px 20px rgba(0,0,0,0.3)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.5)',
    logoBg: '#1e293b',
  }
};

// Supported exchanges - All Hummingbot connectors
// Source: https://hummingbot.org/exchanges/
const EXCHANGES = [
  // CLOB CEX (Centralized Exchanges)
  { id: 'binance', name: 'Binance', requiresMemo: false },
  { id: 'bitget', name: 'Bitget', requiresMemo: false },
  { id: 'bitmart', name: 'BitMart', requiresMemo: true },
  { id: 'derive', name: 'Derive', requiresMemo: false },
  { id: 'dydx', name: 'dYdX', requiresMemo: false },
  { id: 'gateio', name: 'Gate.io', requiresMemo: false },
  { id: 'htx', name: 'HTX (Huobi)', requiresMemo: false },
  { id: 'hyperliquid', name: 'Hyperliquid', requiresMemo: false },
  { id: 'kucoin', name: 'KuCoin', requiresMemo: true },
  { id: 'okx', name: 'OKX', requiresMemo: true },
  { id: 'xrpl', name: 'XRP Ledger', requiresMemo: false },
  { id: 'ascendex', name: 'AscendEx', requiresMemo: false },
  { id: 'bitstamp', name: 'Bitstamp', requiresMemo: false },
  { id: 'bitrue', name: 'Bitrue', requiresMemo: false },
  { id: 'bingx', name: 'BingX', requiresMemo: false },
  { id: 'bybit', name: 'Bybit', requiresMemo: false },
  { id: 'btc_markets', name: 'BTC Markets', requiresMemo: false },
  { id: 'coinbase', name: 'Coinbase', requiresMemo: false },
  { id: 'kraken', name: 'Kraken', requiresMemo: false },
  { id: 'mexc', name: 'MEXC', requiresMemo: false },
  { id: 'ndax', name: 'NDAX', requiresMemo: false },
  
  // CLOB DEX (Decentralized Exchanges)
  { id: 'vertex', name: 'Vertex', requiresMemo: false },
  
  // Gateway DEX (AMM/DEX via Gateway)
  { id: 'balancer', name: 'Balancer', requiresMemo: false },
  { id: 'cube', name: 'Cube', requiresMemo: false },
  { id: 'curve', name: 'Curve', requiresMemo: false },
  { id: 'dexalot', name: 'Dexalot', requiresMemo: false },
  { id: 'etcswap', name: 'ETCSwap', requiresMemo: false },
  { id: 'foxbit', name: 'Foxbit', requiresMemo: false },
  { id: 'injective', name: 'Injective Helix', requiresMemo: false },
  { id: 'jupiter', name: 'Jupiter', requiresMemo: false },
  { id: 'meteora', name: 'Meteora', requiresMemo: false },
  { id: 'pancakeswap', name: 'Pancakeswap', requiresMemo: false },
  { id: 'orca', name: 'Orca', requiresMemo: false },
  { id: 'raydium', name: 'Raydium', requiresMemo: false },
  { id: 'quickswap', name: 'Quickswap', requiresMemo: false },
  { id: 'sushiswap', name: 'Sushiswap', requiresMemo: false },
  { id: 'traderjoe', name: 'TraderJoe', requiresMemo: false },
  { id: 'uniswap', name: 'Uniswap', requiresMemo: false },
  { id: 'gateway', name: 'Gateway DEX', requiresMemo: false },
];

// ========== UNUSED CODE REMOVED ==========
// ChainBadge and MOCK_CLIENTS removed - not used in production

// ========== CLIENT MANAGEMENT PAGE ==========
// Moved to src/pages/admin/ClientManagement.jsx - component extracted


// ========== LOGIN PAGE ==========
function Login({ onLogin }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'evm' or 'solana'

  const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

  const detectWallets = () => {
    const wallets = { evm: null, solana: null };
    
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.evm = { name: 'MetaMask', provider: window.ethereum };
      else if (window.ethereum.isCoinbaseWallet) wallets.evm = { name: 'Coinbase Wallet', provider: window.ethereum };
      else if (window.ethereum.isTrust) wallets.evm = { name: 'Trust Wallet', provider: window.ethereum };
      else wallets.evm = { name: 'Ethereum Wallet', provider: window.ethereum };
    }
    
    if (window.solana && window.solana.isPhantom) {
      wallets.solana = { name: 'Phantom', provider: window.solana };
    }
    
    return wallets;
  };

  const connectEVM = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('evm');

    try {
      const wallets = detectWallets();
      
      if (!wallets.evm) {
        setError('No EVM wallet detected. Please install MetaMask, Coinbase Wallet, or another EVM-compatible wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.evm.name}...`);
      
      const { BrowserProvider } = await import('ethers');
      const provider = new BrowserProvider(wallets.evm.provider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const walletAddress = accounts[0];
      
      setStatus('Getting authentication message...');
      
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      let signature;
      try {
        signature = await signer.signMessage(message);
      } catch (signError) {
        if (signError?.code === 'ACTION_REJECTED' || signError?.reason === 'rejected' || signError?.message?.includes('rejected')) {
          setError('Signature cancelled. Please try again and approve the signature in your wallet.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw signError;
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect EVM wallet');
      setStatus('');
      setLoading(false);
    }
  };

  const connectSolana = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('solana');

    try {
      const wallets = detectWallets();
      
      if (!wallets.solana) {
        setError('No Solana wallet detected. Please install Phantom wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.solana.name}...`);
      
      let response;
      try {
        response = await window.solana.connect();
      } catch (connectError) {
        if (connectError.code === 4001) {
          setError('Connection cancelled. Please try again and approve the connection in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to connect: ${connectError.message}`);
      }

      const walletAddress = response.publicKey.toString();
      
      setStatus('Getting authentication message...');
      
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      let signature;
      try {
        const bs58 = (await import('bs58')).default;
        const encodedMessage = new TextEncoder().encode(message);
        const { signature: signatureBytes } = await window.solana.signMessage(encodedMessage, "utf8");
        signature = bs58.encode(signatureBytes);
      } catch (signError) {
        if (signError.code === 4001) {
          setError('Signature cancelled. Please try again and approve the signature in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to sign message: ${signError.message}`);
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect Solana wallet');
      setStatus('');
      setLoading(false);
    }
  };

  const verifyAndLogin = async (walletAddress, message, signature) => {
    try {
      setStatus('Verifying signature...');
      
      const verifyRes = await fetch(`${TRADING_BRIDGE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress, message, signature }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json().catch(() => ({ detail: `HTTP ${verifyRes.status}` }));
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const authData = await verifyRes.json();
      
      localStorage.setItem('access_token', authData.access_token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      setStatus('Login successful!');
      setTimeout(() => {
        onLogin(authData.user);
      }, 500);

    } catch (e) {
      setError(e.message || 'Authentication failed');
      setStatus('');
      setLoading(false);
    }
  };

  const wallets = detectWallets();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{
        width: 80,
        height: 80,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <span style={{ fontSize: 40, fontWeight: 700 }}>P</span>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Pipe Labs</h1>
      <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 16 }}>AI-Powered Trading Platform</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button 
          onClick={connectEVM} 
          disabled={loading}
          style={{ 
            padding: '16px 32px', 
            fontSize: 16, 
            fontWeight: 600,
            background: loading && walletType === 'evm' ? '#4b5563' : 'linear-gradient(135deg, #627eea 0%, #764ba2 100%)',
            color: '#fff', 
            border: 'none', 
            borderRadius: 12, 
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(98, 126, 234, 0.4)',
            transition: 'all 0.2s',
            minWidth: 180,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>⟠</span>
          <span>{loading && walletType === 'evm' ? 'Connecting...' : 'Connect EVM Wallet'}</span>
        </button>

        <button 
          onClick={connectSolana} 
          disabled={loading}
          style={{ 
            padding: '16px 32px', 
            fontSize: 16, 
            fontWeight: 600,
            background: loading && walletType === 'solana' ? '#4b5563' : 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
            color: '#fff', 
            border: 'none', 
            borderRadius: 12, 
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(153, 69, 255, 0.4)',
            transition: 'all 0.2s',
            minWidth: 180,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>◎</span>
          <span>{loading && walletType === 'solana' ? 'Connecting...' : 'Connect Solana Wallet'}</span>
        </button>
      </div>

      {status && !error && (
        <p style={{ color: '#60a5fa', marginTop: 16, fontSize: 14 }}>{status}</p>
      )}

      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <p style={{ color: '#fca5a5', fontSize: 14, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
      )}

      <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>Supported Wallets:</p>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p><strong>EVM:</strong> MetaMask • Coinbase Wallet • Trust Wallet</p>
          <p><strong>Solana:</strong> Phantom</p>
        </div>
      </div>

      <div style={{
        marginTop: 32,
        padding: '16px 24px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 8,
        maxWidth: 500,
        fontSize: 13,
        lineHeight: 1.6,
        color: '#93c5fd'
      }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>ℹ️ How it works:</p>
        <p>1. Click "Connect EVM Wallet" or "Connect Solana Wallet"</p>
        <p>2. Approve the connection request</p>
        <p>3. Sign the authentication message (no gas fees)</p>
        <p style={{ marginTop: 8, fontWeight: 600 }}>Note: Your wallet address must be registered by an admin.</p>
      </div>
    </div>
  );
}

// ========== METRIC CARD & MESSAGE ==========
// Moved to src/pages/admin/Overview.jsx - components extracted

// ========== BOT MANAGEMENT VIEW ==========
// Moved to src/pages/admin/BotManagement.jsx - component extracted
// ========== ADMIN DASHBOARD ==========
function AdminDashboard({ user, onLogout, theme, isDark, toggleTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Welcome back. I can help you manage clients, monitor bots, and analyze performance across your platform." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showClientManagement, setShowClientManagement] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [bots, setBots] = useState([]);
  const messagesEndRef = useRef(null);
  
  // Wallet connection state
  const [evmWallet, setEvmWallet] = useState(null);
  const [solanaWallet, setSolanaWallet] = useState(null);
  const [activeChain, setActiveChain] = useState("all"); // "all" | "evm" | "solana"
  
  // Check if we're on /bots or /admin/bots route (HashRouter uses pathname)
  const isBotManagement = location.pathname === '/bots' || location.pathname === '/admin/bots';
  
  // Sync client management view with route
  useEffect(() => {
    if (location.pathname === '/admin/clients') {
      setShowClientManagement(true);
    } else if (location.pathname === '/' || location.pathname === '/admin') {
      setShowClientManagement(false);
    }
  }, [location.pathname]);
  
  // Debug: log location changes
  useEffect(() => {
    console.log('Location changed:', { pathname: location.pathname, hash: location.hash, isBotManagement });
  }, [location.pathname, location.hash, isBotManagement]);
  
  // Load clients from API
  useEffect(() => {
    const loadClients = async () => {
      try {
        setClientsLoading(true);
        console.log('🔄 Loading clients...');
        const { adminAPI } = await import('../services/api');
        console.log('📡 Calling adminAPI.getClients()...');
        const data = await adminAPI.getClients();
        console.log('📦 Raw API response:', data);
        console.log('📊 Response type:', typeof data, 'Is array?', Array.isArray(data), 'Length:', data?.length);
        
        // Transform API response to match expected format
        const transformedClients = (data || []).map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          wallet_address: client.wallet_address,
          wallet_type: client.wallet_type || 'EVM',
          account_identifier: client.account_identifier || `client_${client.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
          company: client.settings?.contactPerson || '',
          phone: client.settings?.telegramId || '',
          status: client.status || 'active',
          createdAt: client.created_at,
          connectors: client.connectors || client.exchanges || [], // Use connectors/exchanges from API
          tokens: client.tokens || (client.tradingPair ? [client.tradingPair] : []), // Use tokens from API
          pairs: client.pairs || [], // Trading pairs/bots
          balance: '$0',
          pnl: '$0',
          pnlPercent: '0%'
        }));
        
        setClients(transformedClients);
        console.log('✅ Loaded clients from API:', transformedClients.length, transformedClients);
      } catch (error) {
        console.error('❌ Failed to load clients:', error);
        console.error('Error details:', error.message, error.stack);
        console.error('Full error object:', error);
        
        // Silently fail - show empty state without alert popup
        // Error is logged to console for debugging
        setClients([]);
      } finally {
        setClientsLoading(false);
      }
    };
    
    loadClients();
  }, []);

  // Load bots from API for metrics
  useEffect(() => {
    const loadBots = async () => {
      try {
        const { tradingBridge } = await import('../services/api');
        const data = await tradingBridge.getBots();
        const botsList = Array.isArray(data) ? data : (data.bots || []);
        setBots(botsList);
      } catch (error) {
        console.error('Failed to load bots for metrics:', error);
        setBots([]);
      }
    };
    
    loadBots();
  }, []);

  // Wallet connection handlers
  const connectEVMWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setEvmWallet(accounts[0]);
      localStorage.setItem('evm_wallet', accounts[0]);
    } catch (error) {
      console.error('EVM connection error:', error);
      if (error.code !== 4001) { // Don't alert on user rejection
        alert('Failed to connect wallet');
      }
    }
  };

  const connectSolanaWallet = async () => {
    // Check for Phantom wallet
    if (window.solana && window.solana.isPhantom) {
      try {
        const resp = await window.solana.connect();
        const address = resp.publicKey.toString();
        setSolanaWallet(address);
        localStorage.setItem('solana_wallet', address);
      } catch (error) {
        // User rejected connection
        if (error.code === 4001) {
          console.log('User rejected Phantom connection');
        } else {
          console.error('Solana connection error:', error);
          alert('Failed to connect Phantom wallet');
        }
      }
    } else {
      // Open Phantom install page
      const install = window.confirm('Phantom wallet not found. Open Phantom website to install?');
      if (install) {
        window.open('https://phantom.app/', '_blank');
      }
    }
  };

  // Load wallets on mount
  useEffect(() => {
    const savedEvm = localStorage.getItem('evm_wallet');
    const savedSolana = localStorage.getItem('solana_wallet');
    if (savedEvm) setEvmWallet(savedEvm);
    if (savedSolana) setSolanaWallet(savedSolana);
  }, []);

  const metrics = { clients: clients.length, volume: '$2.4M', pnl: '+$45,230', pnlPct: '+12.5%', bots: bots?.filter(b => b.status === 'running').length || 0 };
  const quickPrompts = ["Show all client balances", "Global P&L this week", "List active bots", "SHARP/USDT price"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    
    try {
      // Call trading-bridge chat API
      const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
      const token = localStorage.getItem('access_token') || 
                    localStorage.getItem('pipelabs_token') || 
                    localStorage.getItem('auth_token');
      
      const response = await fetch(`${TRADING_BRIDGE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          message: userInput,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
        throw new Error(errorData.detail || `Chat API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle response from Claude MCP via backend
      // Response format: { response: string, actions_taken: array }
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response || 'No response received',
        data: data.actions_taken ? { type: 'agent_response', actions: data.actions_taken } : null
      }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback: If chat API doesn't exist, use direct API calls
      const lowerInput = userInput.toLowerCase();
      const isBalanceQuery = lowerInput.includes('balance') || 
                            lowerInput.includes('how much') || 
                            lowerInput.includes('what is the balance');
      
      if (isBalanceQuery && error.message.includes('404') || error.message.includes('Chat API')) {
        // Fallback to direct balance fetch
        try {
          const { getBalance } = await import('../lib/trading');
          const account = lowerInput.includes('client_sharp_2') ? 'client_sharp_2' : 'client_sharp';
          const balanceData = await getBalance(account);
          const bitmartBalances = balanceData.balances?.bitmart || {};
          
          if (Object.keys(bitmartBalances).length > 0) {
            let balanceText = `**${account} Balance (BitMart):**\n\n`;
            if (bitmartBalances.SHARP) {
              const sharp = bitmartBalances.SHARP;
              balanceText += `**SHARP:** ${(sharp.total || 0).toFixed(8)} (${(sharp.free || 0).toFixed(8)} free)\n`;
            }
            if (bitmartBalances.USDT) {
              const usdt = bitmartBalances.USDT;
              balanceText += `**USDT:** $${(usdt.total || 0).toFixed(2)} ($${(usdt.free || 0).toFixed(2)} free)\n`;
            }
            
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: balanceText,
              data: { type: 'balance', account, balances: balanceData }
            }]);
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
        }
      }
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the chat API endpoint is configured.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (newClient) => {
    // Reload clients from API after adding
    try {
      const { adminAPI } = await import('../services/api');
      const data = await adminAPI.getClients();
      
      // Transform API response
      const transformedClients = (data || []).map(client => ({
        id: client.id,
        name: client.name,
        email: client.email,
        wallet_address: client.wallet_address,
        wallet_type: client.wallet_type || 'EVM',
        company: client.settings?.contactPerson || '',
        phone: client.settings?.telegramId || '',
        status: client.status || 'active',
        createdAt: client.created_at,
        connectors: [],
        tokens: client.settings?.tradingPair ? [client.settings.tradingPair] : [],
        balance: '$0',
        pnl: '$0',
        pnlPercent: '0%'
      }));
      
      setClients(transformedClients);
    } catch (error) {
      console.error('Failed to reload clients:', error);
      // Add new client to existing list as fallback
      setClients([...clients, newClient]);
    }
  };

  // Render sidebar component (reusable)
  const renderSidebar = (activeView) => (
    <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
          <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
        </div>
        <span className="text-xs font-semibold uppercase px-2 py-1 rounded" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>Admin</span>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Overview</h3>
        <MetricCard icon={<Users size={16} />} label="Clients" value={metrics.clients} onClick={() => navigate('/admin/clients')} />
        <MetricCard icon={<BarChart3 size={16} />} label="Volume (7d)" value={metrics.volume} />
        <MetricCard icon={<TrendingUp size={16} />} label="P&L (7d)" value={metrics.pnl} subvalue={metrics.pnlPct} positive />
        <MetricCard icon={<Activity size={16} />} label="Active Bots" value={metrics.bots} onClick={() => navigate('/admin/bots')} />
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>{activeView === 'chat' ? 'Quick Actions' : 'Navigation'}</h3>
        {activeView === 'chat' && (
          <>
            <SpreadOrderButton token="SHARP" />
            <VolumeOrderButton token="SHARP" />
            <BalanceButton account="client_sharp" />
            <button onClick={() => setShowAddClient(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-2"
                    style={{ background: theme.accent, color: 'white' }}><Plus size={16} />Add Client</button>
            <button onClick={() => navigate('/admin/clients')} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><Users size={16} />Manage Clients</button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                    style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><BarChart3 size={16} />View Reports</button>
          </>
        )}
        {activeView !== 'chat' && (
          <>
            <NavLink to="/" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <MessageSquare size={16} />AI Assistant
            </NavLink>
            <NavLink to="/admin/clients" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <Users size={16} />Clients
            </NavLink>
            <NavLink to="/admin/bots" className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                    style={({ isActive }) => ({ background: isActive ? theme.accentLight : 'transparent', color: isActive ? theme.accent : theme.textSecondary, border: `1px solid ${theme.border}`, textDecoration: 'none' })}>
              <Activity size={16} />Bots
            </NavLink>
          </>
        )}
      </div>

      <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
          <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
          </div>
        </button>
        
        {/* Wallet Connections */}
        <div className="mb-4 space-y-2">
          {/* EVM Wallet */}
          <div 
            onClick={connectEVMWallet}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "6px 12px", 
              background: evmWallet ? "#627EEA15" : theme.bgInput, 
              borderRadius: 8, 
              cursor: "pointer",
              border: evmWallet ? "1px solid #627EEA40" : `1px solid ${theme.border}`
            }}
          >
            <span>⟠</span>
            {evmWallet ? (
              <div className="flex-1">
                <div style={{ fontSize: 11, color: theme.textMuted }}>EVM</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#627EEA" }}>{evmWallet.slice(0,6)}...{evmWallet.slice(-4)}</div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: theme.textMuted }}>Connect EVM</span>
            )}
          </div>

          {/* Solana Wallet */}
          <div 
            onClick={connectSolanaWallet}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "6px 12px", 
              background: solanaWallet ? "#9945FF15" : theme.bgInput, 
              borderRadius: 8, 
              cursor: "pointer",
              border: solanaWallet ? "1px solid #9945FF40" : `1px solid ${theme.border}`
            }}
          >
            <span>◎</span>
            {solanaWallet ? (
              <div className="flex-1">
                <div style={{ fontSize: 11, color: theme.textMuted }}>Solana</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#9945FF" }}>{solanaWallet.slice(0,4)}...{solanaWallet.slice(-4)}</div>
              </div>
            ) : (
              <span style={{ fontSize: 13, color: theme.textMuted }}>Connect Solana</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin User</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );

  if (showClientManagement) {
    return (
      <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
        <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} onSave={handleAddClient} />
        {renderSidebar('clients')}
        <ClientManagement onBack={() => navigate('/')} onAddClient={() => setShowAddClient(true)} clients={clients} setClients={setClients} theme={theme} isDark={isDark} />
      </div>
    );
  }

  if (isBotManagement) {
    return (
      <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
        {renderSidebar('bots')}
        <main className="flex-1 p-6">
          <BotManagement theme={theme} isDark={isDark} onBack={() => navigate('/')} activeChain={activeChain} setActiveChain={setActiveChain} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
      {renderSidebar('overview')}
      <Overview 
        user={user}
        metrics={metrics}
        messages={messages}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        handleSend={handleSend}
        quickPrompts={quickPrompts}
        messagesEndRef={messagesEndRef}
        navigate={navigate}
        theme={theme}
        isDark={isDark}
      />
    </div>
  );
}

export default AdminDashboard;
