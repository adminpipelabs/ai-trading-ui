import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BotHealthBadge from '../components/BotHealthBadge';
import ClientBotSetup from '../components/ClientBotSetup';
import BotSetupWizard from '../components/BotSetupWizard';
import KeyManagement from '../components/KeyManagement';
import EditBotModal from '../components/EditBotModal';
import WelcomeModal from '../components/WelcomeModal';
import { tradingBridge } from '../services/api';

const API_BASE = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bots, setBots] = useState([]);
  const [keyStatus, setKeyStatus] = useState(null);
  const [exchangeCredentials, setExchangeCredentials] = useState(null); // For CEX bots
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedBotType, setSelectedBotType] = useState(null);
  const [editingBot, setEditingBot] = useState(null);
  const [client, setClient] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tooltipStates, setTooltipStates] = useState({});
  const [managementMode, setManagementMode] = useState('unset');
  const [botActionLoading, setBotActionLoading] = useState({}); // Loading state per bot ID: { [botId]: true/false }
  const [expandedBots, setExpandedBots] = useState({}); // Track which bots show activity: { [botId]: true/false }
  const [botTrades, setBotTrades] = useState({}); // Cache trades per bot: { [botId]: [...trades] }
  const [loadingTrades, setLoadingTrades] = useState({}); // Loading state for trades: { [botId]: true/false }
  const [botBalanceData, setBotBalanceData] = useState({}); // Cache balance/volume per bot: { [botId]: {available, locked, volume} }
  const [loadingBalance, setLoadingBalance] = useState({}); // Loading state for balance: { [botId]: true/false }

  const fetchBotTrades = async (botId) => {
    if (loadingTrades[botId] || botTrades[botId]) return; // Already loading or cached
    
    setLoadingTrades(prev => ({ ...prev, [botId]: true }));
    try {
      const stats = await tradingBridge.getBotStats(botId);
      const recentTrades = (stats.recent_trades || []).slice(0, 5); // Show last 5 trades
      setBotTrades(prev => ({ ...prev, [botId]: recentTrades }));
    } catch (err) {
      console.error(`Failed to fetch trades for bot ${botId}:`, err);
      setBotTrades(prev => ({ ...prev, [botId]: [] }));
    } finally {
      setLoadingTrades(prev => ({ ...prev, [botId]: false }));
    }
  };

  const toggleBotActivity = (botId) => {
    const isExpanded = expandedBots[botId];
    setExpandedBots(prev => ({ ...prev, [botId]: !isExpanded }));
    
    // Fetch trades when expanding
    if (!isExpanded && !botTrades[botId]) {
      fetchBotTrades(botId);
    }
  };

  const fetchBotBalanceAndVolume = async (botId, forceRefresh = false) => {
    // Allow retry if forceRefresh is true, or if data doesn't exist yet
    // Don't retry if already loading or if we have valid data (unless forcing)
    if (!forceRefresh && (loadingBalance[botId] || (botBalanceData[botId] && !botBalanceData[botId].error))) {
      return;
    }
    
    setLoadingBalance(prev => ({ ...prev, [botId]: true }));
    try {
      const data = await tradingBridge.getBotBalanceAndVolume(botId);
      setBotBalanceData(prev => ({ ...prev, [botId]: data }));
    } catch (err) {
      console.error(`Failed to fetch balance/volume for bot ${botId}:`, err);
      // Store error info so we can retry later
      setBotBalanceData(prev => ({ ...prev, [botId]: { error: err.message || 'Failed to fetch balance' } }));
    } finally {
      setLoadingBalance(prev => ({ ...prev, [botId]: false }));
    }
  };

  // Fetch balance/volume for all running bots on mount and when bots change
  useEffect(() => {
    if (bots.length > 0) {
      bots.forEach(bot => {
        // Check if bot is running (case-insensitive)
        const isRunning = bot.status && bot.status.toLowerCase() === 'running';
        const hasData = botBalanceData[bot.id] && !botBalanceData[bot.id].error;
        const isLoading = loadingBalance[bot.id];
        
        // Fetch if running and (no data yet OR data has error)
        if (isRunning && !hasData && !isLoading) {
          fetchBotBalanceAndVolume(bot.id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bots.length, JSON.stringify(bots.map(b => ({ id: b.id, status: b.status })))]); // Stable dependency: length + bot IDs/statuses

  useEffect(() => {
    if (!user) return;
    
    // Check if user has seen welcome modal
    const hasSeenWelcome = localStorage.getItem('pipelabs_has_seen_welcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
    
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    let clientData = null;
    
    try {
      // Get client info - use wallet-based endpoint instead of fetching all clients
      const walletAddress = user.wallet_address || user.wallet;
      if (walletAddress) {
        try {
          const clientRes = await fetch(`${API_BASE}/clients/by-wallet/${walletAddress}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token')}`,
              'X-Wallet-Address': walletAddress,
            },
          });
          if (clientRes.ok) {
            clientData = await clientRes.json();
              setClient({
                id: clientData.client_id,
                name: clientData.name,
                account_identifier: clientData.account_identifier,
                wallet_address: walletAddress,
                wallets: clientData.wallets || [],
                connectors: clientData.connectors || [],
                role: clientData.role || 'client',
                management_mode: clientData.management_mode || 'unset',
              });
              setManagementMode(clientData.management_mode || 'unset');
          } else {
            console.warn('Client fetch failed:', clientRes.status, clientRes.statusText);
            // Fallback: use user data
            setClient(user);
            clientData = { account_identifier: user.account_identifier };
          }
        } catch (walletError) {
          console.error('Wallet-based client fetch error:', walletError);
          setClient(user);
          clientData = { account_identifier: user.account_identifier };
        }
      } else {
        setClient(user);
        clientData = { account_identifier: user.account_identifier };
      }

      // Fetch client's bots - independent error handling
      const accountId = clientData?.account_identifier || user.account_identifier || client?.account_identifier;
      if (accountId) {
        try {
          console.log('DEBUG: Fetching bots for account:', accountId);
          const botsData = await tradingBridge.getBots(accountId);
          const botsList = Array.isArray(botsData) ? botsData : (botsData.bots || []);
          console.log('DEBUG: Received bots from API:', botsList.length, 'bots');
          console.log('DEBUG: Bot details:', botsList.map(b => ({ 
            id: b.id, 
            name: b.name, 
            bot_type: b.bot_type, 
            status: b.status,
            account: b.account,
            client_id: b.client_id
          })));
          
          // Filter to only this client's bots
          const clientId = clientData?.client_id || client?.id || user.id;
          const filteredBots = botsList.filter(bot => 
            bot.client_id === clientId || 
            bot.account === accountId
          );
          console.log('DEBUG: Filtered bots:', filteredBots.length, 'bots');
          console.log('DEBUG: Filtered bot details:', filteredBots.map(b => ({ 
            id: b.id, 
            name: b.name, 
            bot_type: b.bot_type, 
            status: b.status 
          })));
          setBots(filteredBots);
        } catch (botsError) {
          console.error('Failed to fetch bots:', botsError);
          setBots([]); // Don't hang - show empty state
        }
      } else {
        setBots([]);
      }

      // Fetch key status - independent error handling (optional, don't block)
      const clientId = clientData?.client_id || client?.id || user.id;
      if (clientId) {
        try {
          const status = await tradingBridge.getClientKeyStatus(clientId);
          setKeyStatus(status);
        } catch (e) {
          console.error('Failed to fetch key status:', e);
          setKeyStatus({ has_key: false }); // Safe default
        }
        
        // Fetch exchange credentials for CEX bots (independent, don't block)
        try {
          const walletAddress = user?.wallet_address || user?.wallet;
          const headers = {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token') ? {
              'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token')}`
            } : {}),
            ...(walletAddress ? { 'X-Wallet-Address': walletAddress } : {}),
            'X-Client-ID': clientId, // Send client_id as fallback
          };
          
          const credsRes = await fetch(`${API_BASE}/exchanges/credentials`, {
            method: 'GET',
            headers,
          });
          
          if (credsRes.ok) {
            const credsData = await credsRes.json();
            setExchangeCredentials(credsData.exchanges || []);
          } else {
            setExchangeCredentials([]); // Safe default
          }
        } catch (e) {
          console.error('Failed to fetch exchange credentials:', e);
          setExchangeCredentials([]); // Safe default
        }
      } else {
        setKeyStatus({ has_key: false });
        setExchangeCredentials([]);
      }

      // Fetch wallet balance if bot exists - independent error handling (optional)
      // We'll fetch balance after bots are loaded (handled separately or via useEffect)
      // For now, set to null - balance can be fetched later when needed
      setWalletBalance(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      // Ensure we have safe defaults
      if (!client) setClient(user);
      if (bots.length === 0) setBots([]);
      if (!keyStatus) setKeyStatus({ has_key: false });
    } finally {
      // CRITICAL: Always clear loading state, even if API calls fail
      setLoading(false);
    }
  };

  const handleStartStop = async (botId, action) => {
    console.log('DEBUG: handleStartStop called', { botId, action });
    
    // Prevent double-click on THIS bot only
    if (botActionLoading[botId]) {
      console.log('DEBUG: Already loading, skipping');
      return;
    }
    
    // Validate botId
    if (!botId) {
      console.error('DEBUG: botId is missing!', botId);
      alert('Error: Bot ID is missing');
      return;
    }
    
    // Set loading state for THIS bot only
    setBotActionLoading(prev => ({ ...prev, [botId]: true }));
    
    try {
      console.log('DEBUG: About to call tradingBridge.startBot/stopBot');
      console.log('DEBUG: botId type:', typeof botId);
      console.log('DEBUG: botId value:', botId);
      console.log('DEBUG: API_BASE:', API_BASE);
      
      if (action === 'start') {
        await tradingBridge.startBot(botId);
      } else {
        await tradingBridge.stopBot(botId);
      }
      
      console.log('DEBUG: Bot action succeeded, refreshing data...');
      // Force refresh - wait a moment for backend to update, then fetch
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms for backend
      await fetchData(); // Refresh bot status
      
      // Force refresh balance data when bot starts
      if (action === 'start') {
        // Clear cache and fetch fresh data
        setBotBalanceData(prev => {
          const updated = { ...prev };
          delete updated[botId];
          return updated;
        });
        // Fetch fresh balance data after a short delay
        setTimeout(() => {
          fetchBotBalanceAndVolume(botId, true); // Force refresh
        }, 1000);
      }
      
      console.log('DEBUG: Data refresh complete');
    } catch (err) {
      console.error(`DEBUG: Failed to ${action} bot:`, err);
      console.error('DEBUG: Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      const errorMsg = err.message || err.detail || err.data?.detail || 'Unknown error';
      alert(`Failed to ${action} bot: ${errorMsg}`);
    } finally {
      // Clear loading state for THIS bot only
      setBotActionLoading(prev => ({ ...prev, [botId]: false }));
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('pipelabs_has_seen_welcome', 'true');
  };

  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'settings', label: 'Settings' },
    { key: 'help', label: 'Help' },
  ];

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {/* Responsive CSS for mobile */}
      <style>{`
        @media (max-width: 768px) {
          .header-nav {
            width: 100%;
            order: 3;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
          }
          .header-logo-text {
            display: none;
          }
          .ai-panel {
            width: calc(100vw - 20px) !important;
            bottom: 10px !important;
            right: 10px !important;
            left: 10px !important;
            max-width: none !important;
          }
        }
        @media (max-width: 480px) {
          .header-right-group {
            gap: 6px;
          }
          .nav-button {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .wallet-chip {
            font-size: 11px !important;
            padding: 4px 8px !important;
          }
        }
        .nav-button {
          transition: all 0.2s ease;
        }
        .nav-button:hover {
          background-color: #f9fafb;
        }
        .nav-button-active {
          transition: all 0.2s ease;
        }
        .nav-button-active:hover {
          background-color: #e0f7f4;
        }
        .ai-button {
          transition: all 0.2s ease;
        }
        .ai-button:hover {
          background-color: #f9fafb;
          border-color: #d1d5db;
        }
        .ai-button-active {
          transition: all 0.2s ease;
        }
        .ai-button-active:hover {
          background-color: #e0f7f4;
          border-color: #0d9488;
        }
        .ai-panel {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ai-input:focus {
          border-color: #0d9488;
          outline: none;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.1);
        }
        .ai-send-button {
          transition: all 0.2s ease;
        }
        .ai-send-button:hover {
          background-color: #0b8377;
          transform: translateY(-1px);
        }
        .ai-send-button:active {
          transform: translateY(0);
        }
        .compact-bot-card {
          transition: all 0.2s ease;
        }
        .compact-bot-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .compact-start-button:hover {
          background-color: #0b8377;
        }
        .compact-stop-button:hover {
          background-color: #dc2626;
        }
        .compact-edit-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
      `}</style>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>P</div>
          <span style={styles.logoText} className="header-logo-text">Pipe Labs</span>
        </div>
        <div style={styles.headerRight} className="header-right-group">
          <button 
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            style={{
              ...styles.aiButton,
              ...(showAIAssistant ? styles.aiButtonActive : {}),
            }}
            className={showAIAssistant ? 'ai-button-active' : 'ai-button'}
            title="AI Assistant"
          >
            🤖 AI
          </button>
          <div style={styles.walletChip} className="wallet-chip">
            <span style={styles.chainDot} />
            {(user.wallet_address || user.wallet || '').slice(0, 4)}...{(user.wallet_address || user.wallet || '').slice(-4)}
          </div>
          <button onClick={logout} style={styles.logoutButton}>Log out</button>
        </div>
        <nav style={styles.nav} className="header-nav">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.navButton,
                ...(activeTab === tab.key ? styles.navButtonActive : {}),
              }}
              className={`nav-button ${activeTab === tab.key ? 'nav-button-active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div style={styles.aiPanel} className="ai-panel">
          <div style={styles.aiPanelHeader}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>AI Assistant</h3>
            <button 
              onClick={() => setShowAIAssistant(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: 0,
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
          <div style={styles.aiPanelContent}>
            <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
              Ask me anything about your trading bots, account settings, or how to use Pipe Labs.
            </p>
            <div style={styles.aiChat}>
              <div style={styles.aiMessage}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>🤖</span>
                  <div>
                    <strong style={{ color: '#0d9488', fontSize: '13px' }}>AI Assistant:</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#374151', lineHeight: '1.6' }}>
                      Hello! I'm here to help you with your trading bots. What would you like to know?
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.aiInputContainer}>
              <input
                type="text"
                placeholder="Type your question..."
                style={styles.aiInput}
                className="ai-input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    // TODO: Implement AI chat functionality
                    e.target.value = '';
                  }
                }}
              />
              <button style={styles.aiSendButton} className="ai-send-button">Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'dashboard' ? (
          <DashboardTab
            user={user}
            client={client}
            bots={bots}
            keyStatus={keyStatus}
            exchangeCredentials={exchangeCredentials}
            walletBalance={walletBalance}
            showSetup={showSetup}
            setShowSetup={setShowSetup}
            editingBot={editingBot}
            setEditingBot={setEditingBot}
            onStartStop={handleStartStop}
            onRefresh={fetchData}
            tooltipStates={tooltipStates}
            setTooltipStates={setTooltipStates}
            selectedBotType={selectedBotType}
            setSelectedBotType={setSelectedBotType}
            botActionLoading={botActionLoading}
            expandedBots={expandedBots}
            setExpandedBots={setExpandedBots}
            botTrades={botTrades}
            loadingTrades={loadingTrades}
            toggleBotActivity={toggleBotActivity}
            botBalanceData={botBalanceData}
            loadingBalance={loadingBalance}
            fetchBotBalanceAndVolume={fetchBotBalanceAndVolume}
          />
        ) : activeTab === 'settings' ? (
          <SettingsTab
            user={user}
            client={client}
            keyStatus={keyStatus}
            onRefresh={fetchData}
            managementMode={managementMode}
            setManagementMode={setManagementMode}
          />
        ) : (
          <HelpTab />
        )}
      </main>

      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
      </div>
    </>
  );
}

// ─── Tooltip Component ────────────────────────────────────────
function InfoTooltip({ text, id, tooltipStates, setTooltipStates }) {
  const isOpen = tooltipStates[id] || false;
  
  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '4px' }}>
      <span
        style={{
          cursor: 'help',
          color: '#6b7280',
          fontSize: '14px',
          fontWeight: 600,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: '1px solid #d1d5db',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff',
        }}
        onMouseEnter={() => setTooltipStates(prev => ({ ...prev, [id]: true }))}
        onMouseLeave={() => setTooltipStates(prev => ({ ...prev, [id]: false }))}
      >
        ℹ️
      </span>
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '8px',
          padding: '12px',
          backgroundColor: '#1f2937',
          color: '#fff',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: '1.5',
          width: '280px',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          {text}
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            border: '6px solid transparent',
            borderTopColor: '#1f2937',
          }} />
        </div>
      )}
    </span>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────
function DashboardTab({ user, client, bots, keyStatus, exchangeCredentials, walletBalance, showSetup, setShowSetup, editingBot, setEditingBot, onStartStop, onRefresh, tooltipStates, setTooltipStates, selectedBotType, setSelectedBotType, botActionLoading, expandedBots, setExpandedBots, botTrades, loadingTrades, toggleBotActivity, botBalanceData, loadingBalance, fetchBotBalanceAndVolume }) {
  const bot = bots[0]; // Primary bot

  const volumeToday = bot?.stats?.volume_today || 0;
  const volumeTarget = bot?.config?.daily_volume_usd || 5000;
  const volumePercent = volumeTarget > 0 ? Math.min((volumeToday / volumeTarget) * 100, 100) : 0;
  const volume7d = bot?.stats?.volume_7d || 0;

  const clientChain = client?.chain || (client?.wallets?.[0]?.chain) || 'solana';
  const clientId = client?.id || user.id;
  const walletAddress = user?.wallet_address || user?.wallet || client?.wallets?.[0]?.address;

  return (
    <div>
          {/* Welcome */}
          <div style={styles.welcomeSection}>
            <h1 style={styles.welcomeTitle}>Welcome back, {user.name || client?.name || 'User'}</h1>
            <p style={styles.welcomeSubtitle}>{user.account_identifier || client?.account_identifier}</p>
          </div>


      {/* Removed "Connect Wallet" banner - credentials are handled during bot creation wizard */}

      {keyStatus?.has_key && bot?.health_status === 'stopped' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          marginBottom: '24px',
        }}>
          <div>
            <strong style={{ color: '#1e40af' }}>✅ Wallet connected</strong>
            <p style={{ color: '#1e3a8a', fontSize: '14px', marginTop: '4px' }}>
              {bot?.health_message?.includes('NO FUNDS') || bot?.health_message?.includes('NO GAS')
                ? 'Your wallet needs more funds. Fund your wallet and click Start Bot.'
                : bot?.health_message || 'Click Start Bot to begin trading.'}
            </p>
          </div>
        </div>
      )}

      {keyStatus?.has_key && bot?.status === 'running' && bot?.health_status === 'healthy' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          borderRadius: '12px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          marginBottom: '24px',
        }}>
          <strong style={{ color: '#166534' }}>✅ Bot is active and trading</strong>
        </div>
      )}

      {/* Show connect banner if no bot exists yet */}
      {bots.length === 0 && (
        <div style={styles.warningBanner}>
          <div>
            <strong style={{ color: '#92400e' }}>⚠️ Create your first trading bot</strong>
            <p style={{ color: '#a16207', margin: '4px 0 0', fontSize: '14px' }}>
              Choose a bot type below to get started. You'll connect your wallet's private key during setup — 
              it's encrypted with AES-256 and never visible to anyone. We recommend using a dedicated trading wallet, 
              not your main wallet.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setSelectedBotType('volume');
                setShowSetup(true);
              }} 
              style={{
                ...styles.connectButton,
                backgroundColor: '#0d9488',
                fontSize: '14px',
                padding: '12px 24px',
              }}
            >
              📊 Create Volume Bot
            </button>
            <button 
              onClick={() => {
                setSelectedBotType('spread');
                setShowSetup(true);
              }} 
              style={{
                ...styles.connectButton,
                backgroundColor: '#6366f1',
                fontSize: '14px',
                padding: '12px 24px',
              }}
            >
              📈 Create Spread Bot
            </button>
          </div>
        </div>
      )}

      {/* Managed Client Message - Show if managed AND has credentials */}
      {client?.management_mode === 'managed' && (client?.connectors?.length > 0 || keyStatus?.has_key) && bots.length === 0 && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          backgroundColor: '#f0fdfa',
          border: '1px solid #0d9488',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#0d9488' }}>
            🤝 Your bots are managed by Pipe Labs
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            Your trading credentials have been configured by our team. Your bots will appear here once they're set up.
          </p>
        </div>
      )}

      {/* Bot Setup Wizard - Only for self-service clients OR managed clients without credentials */}
      {showSetup && (
        <div style={styles.section}>
          <BotSetupWizard
            clientId={clientId}
            onComplete={(bot) => { 
              setShowSetup(false); 
              setSelectedBotType(null);
              onRefresh(); 
            }}
            onCancel={() => {
              setShowSetup(false);
              setSelectedBotType(null);
            }}
          />
        </div>
      )}

      {/* Bot List Header - Show when bots exist */}
      {bots.length > 0 && !showSetup && (
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Your Bots ({bots.length})
            <span style={{ fontSize: '14px', fontWeight: 400, color: '#6b7280', marginLeft: '8px' }}>
              {bots.map(b => b.bot_type).join(', ')}
            </span>
          </h2>
          {/* Always show add bot buttons - wallet will be connected during setup if needed */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => {
                setSelectedBotType('volume');
                setShowSetup(true);
              }} 
              style={{
                ...styles.startButton,
                backgroundColor: '#0d9488',
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              + Add Volume Bot
            </button>
            <button 
              onClick={() => {
                setSelectedBotType('spread');
                setShowSetup(true);
              }} 
              style={{
                ...styles.startButton,
                backgroundColor: '#6366f1',
                fontSize: '13px',
                padding: '8px 16px',
              }}
            >
              + Add Spread Bot
            </button>
          </div>
        </div>
      )}

      {/* Bot List - Show all bots */}
      {bots.length > 0 && !showSetup && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {bots.map((botItem) => {
            const isRunning = botItem.status && botItem.status.toLowerCase() === 'running';
            const balanceData = botBalanceData[botItem.id];
            const isLoadingBalance = loadingBalance[botItem.id];
            
            // Get pair to determine base/quote
            const pair = botItem.pair || (botItem.base_asset && botItem.quote_asset ? `${botItem.base_asset}/${botItem.quote_asset}` : null);
            const [base, quote] = pair ? pair.split('/') : ['', ''];
            
            // Format Available | Locked | Volume display
            const formatBalanceDisplay = () => {
              if (isLoadingBalance) {
                return <span style={{ color: '#9ca3af', fontSize: '12px' }}>Loading balance...</span>;
              }
              
              if (!balanceData) {
                // No data yet - try fetching if bot is running
                if (isRunning) {
                  // Trigger fetch if not already loading
                  if (!loadingBalance[botItem.id]) {
                    setTimeout(() => fetchBotBalanceAndVolume(botItem.id), 100);
                  }
                }
                return <span style={{ color: '#9ca3af', fontSize: '12px' }}>Balance unavailable</span>;
              }
              
              if (balanceData.error) {
                return (
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>
                    Error: {balanceData.error}
                    <button 
                      onClick={() => fetchBotBalanceAndVolume(botItem.id, true)}
                      style={{ marginLeft: '8px', fontSize: '11px', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Retry
                    </button>
                  </span>
                );
              }
              
              const available = balanceData.available || {};
              const locked = balanceData.locked || {};
              const volume = balanceData.volume;
              
              // Format: Available | Locked | Volume (compact horizontal display)
              const formatValue = (val, decimals = 2) => {
                if (val === 0) return '0';
                return val.toLocaleString(undefined, {maximumFractionDigits: decimals, minimumFractionDigits: 0});
              };
              
              // Always show Available and Locked (even if 0)
              const baseAvail = available[base] || 0;
              const quoteAvail = available[quote] || 0;
              const baseLocked = locked[base] || 0;
              const quoteLocked = locked[quote] || 0;
              
              const availableDisplay = base && quote
                ? `Available: ${formatValue(baseAvail, 4)} ${base} | ${formatValue(quoteAvail, 2)} ${quote}`
                : 'Available: 0 | 0';
              
              const lockedDisplay = base && quote
                ? `Locked: ${formatValue(baseLocked, 4)} ${base} | ${formatValue(quoteLocked, 2)} ${quote}`
                : 'Locked: 0 | 0';
              
              let volumeDisplay = '';
              
              // Volume display based on bot type
              const botType = botItem.bot_type || botItem.strategy || '';
              if (botType.toLowerCase() === 'spread') {
                // Spread Bot: Buy/Sell orders done
                const buyCount = volume?.buy_count || 0;
                const sellCount = volume?.sell_count || 0;
                volumeDisplay = `Buy/Sell: ${buyCount} buys, ${sellCount} sells`;
              } else {
                // Volume Bot: Total volume traded (USD)
                const volumeValue = volume?.value_usd || volume?.total_volume_usd || 0;
                volumeDisplay = `Volume: $${formatValue(volumeValue, 0)}`;
              }
              
              return (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  fontSize: '12px', 
                  color: '#000000',
                  lineHeight: '1.4'
                }}>
                  <div style={{ fontWeight: 500, color: '#000000' }}>{availableDisplay}</div>
                  <div style={{ fontWeight: 500, color: '#dc2626' }}>{lockedDisplay}</div>
                  <div style={{ fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>{volumeDisplay}</div>
                </div>
              );
            };
            
            return (
              <div key={botItem.id} style={styles.compactBotCard} className="compact-bot-card">
                {/* Essential Info Row */}
                <div style={styles.compactBotHeader}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={styles.compactBotName}>
                        {botItem.name}
                      </h3>
                      {/* Clear Status Badge */}
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: 600,
                        backgroundColor: isRunning ? '#d1fae5' : '#f3f4f6',
                        color: isRunning ? '#065f46' : '#6b7280',
                        whiteSpace: 'nowrap',
                      }}>
                        {isRunning ? '🟢 Running' : '⚪ Stopped'}
                      </span>
                    </div>
                    {/* Show health message if there's an issue */}
                    {botItem.health_message && botItem.health_status !== 'healthy' && (
                      <span style={{
                        fontSize: '12px',
                        color: '#ef4444',
                        display: 'block',
                        marginTop: '4px',
                        marginBottom: '8px',
                      }}>
                        {botItem.health_message}
                      </span>
                    )}
                    {/* Available | Locked | Volume */}
                    <div style={{ marginTop: '8px' }}>
                      {formatBalanceDisplay()}
                    </div>
                  </div>
                  {/* Controls */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {isRunning ? (
                      <button 
                        onClick={() => onStartStop(botItem.id, 'stop')} 
                        style={styles.compactStopButton}
                        className="compact-stop-button"
                        disabled={botActionLoading[botItem.id]}
                        title="Stop Bot"
                      >
                        {botActionLoading[botItem.id] ? '⏳' : '⏹'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => onStartStop(botItem.id, 'start')} 
                        style={styles.compactStartButton}
                        className="compact-start-button"
                        disabled={botActionLoading[botItem.id]}
                        title="Start Bot"
                      >
                        {botActionLoading[botItem.id] ? '⏳' : '▶'}
                      </button>
                    )}
                    <button 
                      onClick={() => setEditingBot(botItem)} 
                      style={styles.compactEditButton}
                      className="compact-edit-button"
                      title="Edit Settings"
                    >
                      ✏️
                    </button>
                  </div>
                </div>

                {/* Recent Activity - Expandable section to verify trading */}
                <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                  <button
                    onClick={() => toggleBotActivity(botItem.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      fontSize: '12px',
                      cursor: 'pointer',
                      padding: '4px 0',
                      fontWeight: 500,
                    }}
                  >
                    <span>{expandedBots[botItem.id] ? '▼' : '▶'}</span>
                    <span>Recent Activity</span>
                    {botItem.stats?.trades_today > 0 && (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        ({botItem.stats.trades_today} trades today)
                      </span>
                    )}
                  </button>

                  {expandedBots[botItem.id] && (
                    <div style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {loadingTrades[botItem.id] ? (
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>Loading trades...</div>
                      ) : botTrades[botItem.id] && botTrades[botItem.id].length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {botTrades[botItem.id].map((trade, idx) => {
                            const tradeTime = trade.created_at 
                              ? new Date(trade.created_at).toLocaleString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : 'Unknown';
                            const sideColor = trade.side?.toLowerCase() === 'buy' ? '#10b981' : '#ef4444';
                            
                            return (
                              <div key={trade.id || idx} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '4px',
                              }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: sideColor + '20',
                                    color: sideColor,
                                    fontWeight: 600,
                                    fontSize: '10px',
                                  }}>
                                    {trade.side?.toUpperCase() || 'N/A'}
                                  </span>
                                  <span style={{ color: '#6b7280' }}>
                                    ${trade.value_usd ? trade.value_usd.toFixed(2) : '0.00'}
                                  </span>
                                  {trade.amount && (
                                    <span style={{ color: '#9ca3af' }}>
                                      {parseFloat(trade.amount).toFixed(4)}
                                    </span>
                                  )}
                                </div>
                                <span style={{ color: '#9ca3af', fontSize: '10px' }}>
                                  {tradeTime}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
                          No trades yet. Trades will appear here once the bot starts trading.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legacy: Single Bot Detail (kept for backward compatibility) */}
      {bot && bots.length === 1 && !showSetup && false && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Bot</h2>
            <BotHealthBadge
              status={bot.status}
              healthStatus={bot.health_status}
              healthMessage={bot.health_message}
              lastTradeTime={bot.last_trade_time}
              botId={bot.id}
              onRefresh={onRefresh}
            />
          </div>

          <div style={styles.botCard}>
            <div style={styles.botHeader}>
              <div>
                <h3 style={styles.botName}>{bot.name}</h3>
                <span style={styles.botMeta}>
                  {bot.bot_type === 'volume' ? 'Volume Bot' : 
                   bot.bot_type === 'spread' ? 'Spread Bot' : 'Trading Bot'}
                  {' · '}
                  {bot.connector || 'Jupiter'} ({bot.chain || 'Solana'})
                  {bot.pair && ` · ${bot.pair}`}
                </span>
              </div>
            </div>

            <div style={styles.botGrid}>
              <BotStat 
                label="Daily Target" 
                value={`$${(bot.config?.daily_volume_usd || 5000).toLocaleString()}`}
                tooltip="Your daily volume target is the total USD value of trades your bot aims to complete each day."
                tooltipId="daily-target"
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
              <BotStat label="Progress" value={`${volumePercent.toFixed(0)}%`} />
              <BotStat 
                label="Trade Size" 
                value={`$${bot.config?.min_trade_usd || 10} – $${bot.config?.max_trade_usd || 25}`}
                tooltip="Each individual trade will be a random amount between your min and max trade size. Randomization makes the trading activity look natural."
                tooltipId="trade-size"
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
              <BotStat 
                label="Interval" 
                value={`${Math.round((bot.config?.interval_min_seconds || 900) / 60)}–${Math.round((bot.config?.interval_max_seconds || 2700) / 60)} min`}
                tooltip="Time between trades. Your bot waits a random duration between the min and max interval before placing the next trade. Shorter intervals = more trades per day = reaching your volume target faster."
                tooltipId="interval"
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
              <BotStat label="Last Trade" value={bot.last_trade_time ? new Date(bot.last_trade_time).toLocaleString() : 'None yet'} />
              <BotStat label="Trades Today" value={bot.stats?.trades_today || '0'} />
            </div>

            {/* Progress Bar */}
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${volumePercent}%` }} />
              </div>
              <span style={styles.progressLabel}>${volumeToday.toLocaleString()} / ${volumeTarget.toLocaleString()}</span>
            </div>

            {/* Actions — NO DELETE (admin only) */}
            <div style={styles.botActions}>
              {/* Always show Start/Stop button based on bot status */}
              {bot.status === 'running' ? (
                <button 
                  onClick={() => onStartStop(bot.id, 'stop')} 
                  style={styles.stopButton}
                  disabled={botActionLoading[bot.id]}
                >
                  {botActionLoading[bot.id] ? '⏳ Stopping...' : '⏹ Stop Bot'}
                </button>
              ) : (
                <button 
                  onClick={() => onStartStop(bot.id, 'start')} 
                  style={styles.startButton}
                  disabled={botActionLoading[bot.id]}
                >
                  {botActionLoading[bot.id] ? '⏳ Starting...' : '▶ Start Bot'}
                </button>
              )}
              <button onClick={() => setEditingBot(bot)} style={styles.editButton}>
                ✏️ Edit Settings
              </button>
              {/* NO DELETE BUTTON — admin only */}
            </div>
          </div>
        </div>
      )}

      {/* No Bot — Show Setup */}
      {bots.length === 0 && !showSetup && (
        <div style={styles.emptyState}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3 style={{ marginBottom: '8px' }}>No bots yet</h3>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            Set up your first trading bot to get started.
          </p>
          <button onClick={() => setShowSetup(true)} style={styles.startButton}>
            + Add Bot
          </button>
        </div>
      )}

      {/* Edit Bot Modal */}
      {editingBot && (
        <EditBotModal
          bot={editingBot}
          isOpen={!!editingBot}
          onClose={() => setEditingBot(null)}
          onSave={async (botId, payload) => {
            try {
              await tradingBridge.updateBot(botId, payload);
              setEditingBot(null);
              await onRefresh();
            } catch (error) {
              console.error('Failed to update bot:', error);
              throw error; // Let EditBotModal handle the error display
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────
function SettingsTab({ user, client, keyStatus, onRefresh, managementMode, setManagementMode }) {
  const displayClient = client || user;
  const clientChain = client?.chain || (client?.wallets?.[0]?.chain) || 'solana';

  const handleManagementModeChange = async (mode) => {
    try {
      const clientId = displayClient.id || user.id;
      const response = await fetch(`${API_BASE}/clients/${clientId}/management-mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Wallet-Address': user.wallet_address || user.wallet,
        },
        body: JSON.stringify({ mode }),
      });
      
      if (response.ok) {
        setManagementMode(mode);
        alert(`Management mode set to ${mode === 'self' ? 'Self-Service' : 'Pipe Labs Managed'}`);
      } else {
        alert('Failed to update management mode');
      }
    } catch (error) {
      console.error('Error updating management mode:', error);
      alert('Error updating management mode');
    }
  };

  return (
    <div>
      <h1 style={styles.welcomeTitle}>Settings</h1>

      {/* Management Mode Choice */}
      <div style={{ ...styles.section, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>Bot Management</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
          Choose how you'd like to manage your trading bot.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          <div 
            onClick={() => handleManagementModeChange('self')}
            style={{
              flex: '1',
              minWidth: '280px',
              padding: '24px',
              borderRadius: '12px',
              border: managementMode === 'self' ? '2px solid #0d9488' : '1px solid #e5e7eb',
              cursor: 'pointer',
              backgroundColor: managementMode === 'self' ? '#f0fdfa' : '#fff',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>🛠 Self-Service</h4>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              You manage everything — connect your wallet, configure your bot, 
              start and stop as needed. Full control from your dashboard.
            </p>
            <ul style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', paddingLeft: '16px' }}>
              <li>You connect your own wallet key</li>
              <li>You configure bot settings</li>
              <li>You start and stop your bot</li>
              <li>Dashboard access 24/7</li>
            </ul>
          </div>

          <div 
            onClick={() => handleManagementModeChange('managed')}
            style={{
              flex: '1',
              minWidth: '280px',
              padding: '24px',
              borderRadius: '12px',
              border: managementMode === 'managed' ? '2px solid #0d9488' : '1px solid #e5e7eb',
              cursor: 'pointer',
              backgroundColor: managementMode === 'managed' ? '#f0fdfa' : '#fff',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>🤝 Pipe Labs Managed</h4>
            <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
              Our team handles everything for you — setup, configuration, monitoring, 
              and optimization. You just watch the results.
            </p>
            <ul style={{ fontSize: '13px', color: '#6b7280', marginTop: '12px', paddingLeft: '16px' }}>
              <li>Pipe Labs configures your bot</li>
              <li>We monitor and optimize performance</li>
              <li>You provide wallet key securely through dashboard</li>
              <li>Regular performance updates</li>
            </ul>
            <p style={{ fontSize: '12px', color: '#0d9488', marginTop: '8px', fontWeight: 600 }}>
              Available on Professional and Enterprise plans
            </p>
          </div>
        </div>
      </div>

      <div style={{ ...styles.section, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>Account</h2>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Name</span>
          <span style={styles.settingValue}>{displayClient.name || user.name}</span>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Account ID</span>
          <span style={styles.settingValue}>{displayClient.account_identifier || user.account_identifier}</span>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Wallet</span>
          <span style={{ ...styles.settingValue, fontFamily: 'monospace' }}>
            {user.wallet_address || user.wallet}
          </span>
        </div>
      </div>

      <div style={{ ...styles.section, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>Trading Wallet</h2>
        <KeyManagement
          clientId={displayClient.id || user.id}
          hasKey={keyStatus?.has_key || false}
          chain={clientChain}
          onKeyRotated={onRefresh}
        />
        {keyStatus?.has_key && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
            <p>Connected by: {keyStatus.key_added_by || 'unknown'}</p>
            {keyStatus.wallet_address && (
              <p>Address: <code>{keyStatus.wallet_address}</code></p>
            )}
            {keyStatus.key_connected_at && (
              <p>Connected: {new Date(keyStatus.key_connected_at).toLocaleDateString()}</p>
            )}
          </div>
        )}
      </div>

      <div style={{ ...styles.section, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>How It Works</h2>
        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
          <p style={{ marginBottom: '16px' }}>
            Your bot uses your connected wallet to place trades on Jupiter (Solana's largest DEX). Here's what happens behind the scenes:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}>Your bot places alternating buy and sell orders throughout the day</li>
            <li style={{ marginBottom: '8px' }}>Each trade is a random size within your configured range</li>
            <li style={{ marginBottom: '8px' }}>Trades are spaced out at random intervals to appear natural</li>
            <li style={{ marginBottom: '8px' }}>The bot automatically stops if your wallet runs low on funds</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
            Your Wallet Key
          </h3>
          <p style={{ marginBottom: '12px' }}>
            Your private key is encrypted the moment you submit it and stored securely. It is only decrypted briefly in memory when executing a trade, then immediately cleared. No one at Pipe Labs can view your key.
          </p>
          <p style={{ marginBottom: '12px' }}>
            You can:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
            <li style={{ marginBottom: '8px' }}><strong>Rotate your key</strong> — swap to a new wallet at any time</li>
            <li style={{ marginBottom: '8px' }}><strong>Revoke your key</strong> — immediately stops all bots and deletes the stored key</li>
          </ul>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', marginTop: '24px', marginBottom: '12px' }}>
            Funding Your Wallet
          </h3>
          <p style={{ marginBottom: '12px' }}>
            Your trading wallet needs:
          </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li style={{ marginBottom: '8px' }}><strong>Native token for gas fees</strong> (SOL for Solana, ETH for Ethereum, etc.)</li>
              <li style={{ marginBottom: '8px' }}><strong>Trading capital</strong> — native token or your trading token for actual trades (depends on your daily volume target)</li>
            </ul>
          <p style={{ marginBottom: '12px', fontSize: '13px', color: '#6b7280', fontStyle: 'italic' }}>
            Example: For a $5,000/day volume target with $10-$25 trades, your wallet should have at least $200-$500 in tradeable assets to run comfortably through the day.
          </p>

          <div style={{
            marginTop: '24px',
            padding: '16px',
            backgroundColor: '#f0fdfa',
            borderRadius: '8px',
            border: '1px solid #ccfbf1',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#0d9488' }}>
              💡 <strong>Need Help?</strong> Contact{' '}
              <a href="mailto:support@pipelabs.xyz" style={{ color: '#0d9488', textDecoration: 'underline' }}>
                support@pipelabs.xyz
              </a>
              {' '}or reach out to your account manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Help Tab ────────────────────────────────────────
function HelpTab() {
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: "Is my private key safe?",
      a: "Yes. Your key is encrypted with AES-256 (bank-grade encryption) the instant you submit it. It's never stored in plain text and never visible to our team. You can revoke it at any time."
    },
    {
      q: "What happens if my wallet runs out of funds?",
      a: "Your bot automatically stops and the status changes to \"Stopped — NO FUNDS.\" Top up your wallet and restart the bot from the dashboard."
    },
    {
      q: "Can I change my volume target?",
      a: "Yes. Click \"Edit Settings\" on your bot to adjust the daily volume target, trade sizes, intervals, and slippage tolerance. Changes take effect on the next trade cycle."
    },
    {
      q: "Can I stop my bot anytime?",
      a: "Yes. Click \"Stop Bot\" and it stops immediately. You can restart it whenever you're ready."
    },
    {
      q: "What does \"Stale\" status mean?",
      a: "It means no trades have been placed in 30+ minutes. This can be normal if your interval settings are long, or it might indicate an issue. If it persists, check your wallet balance."
    },
    {
      q: "How much do I need for gas fees?",
      a: "Gas fees vary by chain (SOL for Solana, ETH/Gwei for Ethereum, etc.). We recommend keeping enough native token for several days of trading. The bot will stop automatically if gas runs too low."
    },
    {
      q: "Can Pipe Labs access my funds?",
      a: "The bot can only execute trades on the DEX you've configured. It cannot transfer funds out of your wallet to another address. You maintain full ownership and can revoke access at any time."
    },
    {
      q: "How do I switch to a different wallet?",
      a: "Go to Settings → Trading Wallet → Rotate Key. Enter your new wallet's private key. The old key is overwritten immediately."
    }
  ];

  return (
    <div>
      <h1 style={styles.welcomeTitle}>Help & FAQ</h1>

      <div style={{ ...styles.section, marginTop: '24px' }}>
        <h2 style={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div style={{ marginTop: '16px' }}>
          {faqs.map((faq, index) => (
            <div
              key={index}
              style={{
                borderBottom: '1px solid #e5e7eb',
                padding: '16px 0',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#111827',
                }}>
                  {faq.q}
                </span>
                <span style={{
                  fontSize: '20px',
                  color: '#6b7280',
                  marginLeft: '16px',
                }}>
                  {openFaq === index ? '−' : '+'}
                </span>
              </button>
              {openFaq === index && (
                <p style={{
                  marginTop: '12px',
                  fontSize: '14px',
                  color: '#6b7280',
                  lineHeight: '1.7',
                }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{
        ...styles.section,
        marginTop: '24px',
        backgroundColor: '#f0fdfa',
        border: '1px solid #ccfbf1',
      }}>
        <h2 style={styles.sectionTitle}>Still Need Help?</h2>
        <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
          Our support team is here to help. Reach out anytime:
        </p>
        <div style={{ fontSize: '14px', color: '#374151' }}>
          <p style={{ marginBottom: '8px' }}>
            📧 Email: <a href="mailto:support@pipelabs.xyz" style={{ color: '#0d9488', textDecoration: 'underline' }}>support@pipelabs.xyz</a>
          </p>
          <p>
            💬 Contact your account manager for priority support
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────
function StatCard({ label, value, sublabel, progress }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statLabel, display: 'flex', alignItems: 'center' }}>{label}</div>
      <span style={styles.statValue}>{value}</span>
      {sublabel && <span style={styles.statSublabel}>{sublabel}</span>}
      {progress != null && (
        <div style={{ ...styles.progressBar, marginTop: '8px', height: '4px' }}>
          <div style={{
            ...styles.progressFill,
            width: `${progress}%`,
            backgroundColor: progress > 75 ? '#22c55e' : progress > 40 ? '#eab308' : '#ef4444',
          }} />
        </div>
      )}
    </div>
  );
}

function BotStat({ label, value, tooltip, tooltipId, tooltipStates, setTooltipStates }) {
  return (
    <div style={styles.botStatItem}>
      <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center' }}>
        {label}
        {tooltip && (
          <InfoTooltip
            id={tooltipId}
            text={tooltip}
            tooltipStates={tooltipStates}
            setTooltipStates={setTooltipStates}
          />
        )}
      </span>
      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{value}</span>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #0d9488',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
    flexWrap: 'wrap',
    gap: '8px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  logo: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: '#0d9488',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '14px',
    flexShrink: 0,
  },
  logoText: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#111827',
    whiteSpace: 'nowrap',
  },
  nav: {
    display: 'flex',
    gap: '2px',
    width: '100%',
    justifyContent: 'flex-start',
    order: 3,
    minWidth: 0,
  },
  navButton: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  navButtonActive: {
    backgroundColor: '#f0fdfa',
    color: '#0d9488',
    fontWeight: 600,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  aiButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  aiButtonActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488',
    color: '#0d9488',
  },
  walletChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '5px 10px',
    borderRadius: '16px',
    backgroundColor: '#f3f4f6',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#374151',
    whiteSpace: 'nowrap',
  },
  chainDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
    flexShrink: 0,
  },
  logoutButton: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#6b7280',
    fontSize: '12px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  // AI Assistant Panel
  aiPanel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '380px',
    maxWidth: 'calc(100vw - 40px)',
    maxHeight: '500px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  aiPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #e5e7eb',
  },
  aiPanelContent: {
    padding: '16px',
    flex: '1',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  aiChat: {
    flex: '1',
    marginBottom: '16px',
    minHeight: '200px',
    maxHeight: '300px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  aiMessage: {
    padding: '12px',
    backgroundColor: '#f0fdfa',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '8px',
    border: '1px solid #ccfbf1',
  },
  aiInputContainer: {
    display: 'flex',
    gap: '8px',
  },
  aiInput: {
    flex: '1',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    fontSize: '13px',
    outline: 'none',
  },
  aiSendButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Main
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '24px 16px',
  },

  // Welcome
  welcomeSection: {
    marginBottom: '24px',
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },

  // Cards
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
    marginTop: '8px',
  },
  statSublabel: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },

  // Warning Banner
  warningBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderRadius: '12px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fbbf2440',
    marginBottom: '24px',
  },
  connectButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f59e0b',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    marginBottom: '24px',
  },
  // Compact section (for when we have many bots)
  compactSection: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '12px 16px',
    marginBottom: '12px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },

  // Bot Card
  botCard: {
    padding: '0',
  },
  botHeader: {
    marginBottom: '20px',
  },
  botName: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  botMeta: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  botGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  botStatItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  // Compact Bot Card Styles
  compactBotCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
  },
  compactBotHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '10px',
    gap: '12px',
  },
  compactBotName: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  compactBotMeta: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  compactBotStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px 16px',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #f3f4f6',
  },
  compactStatItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: '60px',
  },
  compactStatLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  compactStatValue: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  },
  compactProgressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  compactProgressBar: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    borderRadius: '3px',
    backgroundColor: '#0d9488',
    transition: 'width 0.3s ease',
  },
  compactProgressLabel: {
    fontSize: '11px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    minWidth: '100px',
    textAlign: 'right',
  },
  compactStartButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '36px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  compactStopButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '36px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  compactEditButton: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    minWidth: '36px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },

  // Progress
  progressContainer: {
    marginBottom: '20px',
  },
  progressBar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    backgroundColor: '#0d9488',
    transition: 'width 0.5s ease',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '6px',
    display: 'block',
  },

  // Actions
  botActions: {
    display: 'flex',
    flexDirection: 'row',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  startButton: {
    padding: '12px 24px', // Increased for mobile touch targets
    minHeight: '44px', // iOS/Android minimum touch target
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    WebkitTapHighlightColor: 'transparent', // Remove mobile tap highlight
  },
  stopButton: {
    padding: '12px 24px', // Increased for mobile touch targets
    minHeight: '44px', // iOS/Android minimum touch target
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    WebkitTapHighlightColor: 'transparent', // Remove mobile tap highlight
  },
  editButton: {
    padding: '12px 24px', // Increased for mobile touch targets
    minHeight: '44px', // iOS/Android minimum touch target
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
    WebkitTapHighlightColor: 'transparent', // Remove mobile tap highlight
  },
  backButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#64748b',
    cursor: 'pointer',
    marginBottom: '16px',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '60px 24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },

  // Settings
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  settingLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  settingValue: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111827',
  },
};
