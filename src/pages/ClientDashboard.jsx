import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BotHealthBadge from '../components/BotHealthBadge';
import ClientBotSetup from '../components/ClientBotSetup';
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
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [selectedBotType, setSelectedBotType] = useState(null);
  const [editingBot, setEditingBot] = useState(null);
  const [client, setClient] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [tooltipStates, setTooltipStates] = useState({});
  const [managementMode, setManagementMode] = useState('unset');

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
          const botsData = await tradingBridge.getBots(accountId);
          const botsList = Array.isArray(botsData) ? botsData : (botsData.bots || []);
          // Filter to only this client's bots
          const clientId = clientData?.client_id || client?.id || user.id;
          setBots(botsList.filter(bot => 
            bot.client_id === clientId || 
            bot.account === accountId
          ));
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
      } else {
        setKeyStatus({ has_key: false });
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
    try {
      if (action === 'start') {
        await tradingBridge.startBot(botId);
      } else {
        await tradingBridge.stopBot(botId);
      }
      fetchData();
    } catch (err) {
      console.error(`Failed to ${action} bot:`, err);
      alert(`Failed to ${action} bot: ${err.message || 'Unknown error'}`);
    }
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    localStorage.setItem('pipelabs_has_seen_welcome', 'true');
  };

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
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>P</div>
          <span style={styles.logoText}>Pipe Labs</span>
        </div>
        <nav style={styles.nav}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.navButton,
                ...(activeTab === tab.key ? styles.navButtonActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={styles.headerRight}>
          <div style={styles.walletChip}>
            <span style={styles.chainDot} />
            {(user.wallet_address || user.wallet || '').slice(0, 4)}...{(user.wallet_address || user.wallet || '').slice(-4)}
          </div>
          <button onClick={logout} style={styles.logoutButton}>Log out</button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {activeTab === 'dashboard' ? (
          <DashboardTab
            user={user}
            client={client}
            bots={bots}
            keyStatus={keyStatus}
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
function DashboardTab({ user, client, bots, keyStatus, walletBalance, showSetup, setShowSetup, editingBot, setEditingBot, onStartStop, onRefresh, tooltipStates, setTooltipStates, selectedBotType, setSelectedBotType }) {
  const bot = bots[0]; // Primary bot

  const volumeToday = bot?.stats?.volume_today || 0;
  const volumeTarget = bot?.config?.daily_volume_usd || 5000;
  const volumePercent = volumeTarget > 0 ? Math.min((volumeToday / volumeTarget) * 100, 100) : 0;
  const volume7d = bot?.stats?.volume_7d || 0;

  const clientChain = client?.chain || (client?.wallets?.[0]?.chain) || 'solana';
  const clientId = client?.id || user.id;

  return (
    <div>
      {/* Welcome */}
      <div style={styles.welcomeSection}>
        <h1 style={styles.welcomeTitle}>Welcome back, {user.name || client?.name || 'User'}</h1>
        <p style={styles.welcomeSubtitle}>{user.account_identifier || client?.account_identifier}</p>
      </div>

      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <StatCard
          label={
            <>
              Bot Status
              <InfoTooltip
                id="bot-status"
                text="🟢 Running: Your bot is actively trading. 🟡 Stale: No trades in the last 30 minutes (may be normal for low-frequency settings). 🔴 Stopped: Bot has stopped — usually due to insufficient wallet funds or manual stop. ⚠️ Error: Health check failed — our team is notified automatically. ⚪ Unknown: Status hasn't been checked yet (first check runs within 5 minutes)."
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
            </>
          }
          value={bot?.health_status === 'healthy' ? '🟢 Running' :
                 bot?.health_status === 'stale' ? '🟡 Stale' :
                 bot?.health_status === 'stopped' ? '🔴 Stopped' :
                 bot?.health_status === 'error' ? '⚠️ Error' :
                 bot ? '⚪ Unknown' : 'No Bot'}
          sublabel={bot?.bot_type ? `${bot.bot_type === 'volume' ? 'Volume Bot' : bot.bot_type === 'spread' ? 'Spread Bot' : 'Trading Bot'} · ${bot?.health_message || ''}` : bot?.health_message}
        />
        <StatCard
          label={
            <>
              Wallet Balance
              <InfoTooltip
                id="wallet-balance"
                text="This is the balance of the wallet your bot trades from. Make sure it has enough native token (SOL for Solana, ETH for Ethereum, etc.) for gas fees and enough trading capital to execute trades at your configured sizes. Low balance? Your bot will stop automatically and you'll see a 'Stopped — NO FUNDS' status."
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
            </>
          }
          value={walletBalance?.sol_balance != null
            ? `${walletBalance.sol_balance.toFixed(4)} SOL`
            : walletBalance?.balance_sol != null
            ? `${walletBalance.balance_sol.toFixed(4)} SOL`
            : '—'}
          sublabel={walletBalance?.usd_value ? `≈ $${walletBalance.usd_value.toFixed(2)}` : null}
        />
        <StatCard
          label={
            <>
              Volume Today
              <InfoTooltip
                id="volume-today"
                text="Your daily volume target is the total USD value of trades your bot aims to complete each day. The progress bar shows how much has been completed so far today. This resets at midnight UTC."
                tooltipStates={tooltipStates}
                setTooltipStates={setTooltipStates}
              />
            </>
          }
          value={`$${volumeToday.toLocaleString()}`}
          sublabel={`of $${volumeTarget.toLocaleString()} target`}
          progress={volumePercent}
        />
        <StatCard
          label="Volume (7d)"
          value={`$${volume7d.toLocaleString()}`}
        />
      </div>

      {/* Contextual Banners Based on Key Status + Bot Status */}
      {!keyStatus?.has_key && bots.length > 0 && (
        <div style={styles.warningBanner}>
          <div>
            <strong style={{ color: '#92400e' }}>
              ⚠️ Connect your wallet to activate your bots
            </strong>
            <p style={{ color: '#a16207', margin: '4px 0 0', fontSize: '14px' }}>
              Your bots are ready but need a connected wallet to start trading. Click below to connect your wallet's 
              private key — it's encrypted with AES-256 and never visible to anyone. Once connected, all your bots 
              can start trading.
            </p>
            <p style={{ color: '#a16207', margin: '8px 0 0', fontSize: '13px' }}>
              <strong>Next steps:</strong> Connect wallet → Fund wallet → Start your bots
            </p>
          </div>
          <button 
            onClick={() => {
              // If they have bots but no key, they need to connect a key
              // The setup wizard will create a new bot AND connect the key
              // So we let them choose bot type (or they can just connect key to existing bots)
              setShowSetup(true);
              setSelectedBotType(null); // Let them choose bot type or just connect key
            }} 
            style={styles.connectButton}
          >
            Connect Wallet to Activate Bots
          </button>
        </div>
      )}

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
      {!keyStatus?.has_key && bots.length === 0 && (
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

      {/* Bot Setup Wizard */}
      {showSetup && (
        <div style={styles.section}>
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                setShowSetup(false);
                setSelectedBotType(null);
              }}
              style={styles.backButton}
            >
              ← Back
            </button>
            {selectedBotType && (
              <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 600 }}>
                Setting up: {selectedBotType === 'volume' ? 'Volume Bot' : 'Spread Bot'}
              </span>
            )}
          </div>
          <ClientBotSetup
            clientId={clientId}
            chain={clientChain}
            initialBotType={selectedBotType}
            onBotCreated={() => { 
              setShowSetup(false); 
              setSelectedBotType(null);
              onRefresh(); 
            }}
          />
        </div>
      )}

      {/* Bot List Header - Show when bots exist */}
      {bots.length > 0 && !showSetup && (
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Your Bots ({bots.length})
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bots.map((botItem) => {
            const volumeToday = botItem?.stats?.volume_today || 0;
            const volumeTarget = botItem?.config?.daily_volume_usd || 5000;
            const volumePercent = volumeTarget > 0 ? Math.min((volumeToday / volumeTarget) * 100, 100) : 0;
            
            return (
              <div key={botItem.id} style={styles.section}>
                <div style={styles.sectionHeader}>
                  <div>
                    <h3 style={styles.botName}>{botItem.name}</h3>
                    <span style={styles.botMeta}>
                      {botItem.bot_type === 'volume' ? 'Volume Bot' : 
                       botItem.bot_type === 'spread' ? 'Spread Bot' : 'Trading Bot'}
                      {' · '}
                      {botItem.connector || 'Jupiter'} ({botItem.chain || 'Solana'})
                      {botItem.pair && ` · ${botItem.pair}`}
                    </span>
                  </div>
                  <BotHealthBadge
                    status={botItem.status}
                    healthStatus={botItem.health_status}
                    healthMessage={botItem.health_message}
                    lastTradeTime={botItem.last_trade_time}
                    botId={botItem.id}
                    onRefresh={onRefresh}
                  />
                </div>

                <div style={styles.botCard}>
                  <div style={styles.botGrid}>
                    <BotStat 
                      label="Daily Target" 
                      value={`$${(botItem.config?.daily_volume_usd || 5000).toLocaleString()}`}
                      tooltip="Your daily volume target is the total USD value of trades your bot aims to complete each day."
                      tooltipId={`daily-target-${botItem.id}`}
                      tooltipStates={tooltipStates}
                      setTooltipStates={setTooltipStates}
                    />
                    <BotStat label="Progress" value={`${volumePercent.toFixed(0)}%`} />
                    <BotStat 
                      label="Trade Size" 
                      value={`$${botItem.config?.min_trade_usd || 10} – $${botItem.config?.max_trade_usd || 25}`}
                      tooltip="Each individual trade will be a random amount between your min and max trade size."
                      tooltipId={`trade-size-${botItem.id}`}
                      tooltipStates={tooltipStates}
                      setTooltipStates={setTooltipStates}
                    />
                    <BotStat 
                      label="Interval" 
                      value={`${Math.round((botItem.config?.interval_min_seconds || 900) / 60)}–${Math.round((botItem.config?.interval_max_seconds || 2700) / 60)} min`}
                      tooltip="Time between trades."
                      tooltipId={`interval-${botItem.id}`}
                      tooltipStates={tooltipStates}
                      setTooltipStates={setTooltipStates}
                    />
                    <BotStat label="Last Trade" value={botItem.last_trade_time ? new Date(botItem.last_trade_time).toLocaleString() : 'None yet'} />
                    <BotStat label="Trades Today" value={botItem.stats?.trades_today || '0'} />
                  </div>

                  {/* Progress Bar */}
                  <div style={styles.progressContainer}>
                    <div style={styles.progressBar}>
                      <div style={{ ...styles.progressFill, width: `${volumePercent}%` }} />
                    </div>
                    <span style={styles.progressLabel}>${volumeToday.toLocaleString()} / ${volumeTarget.toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  <div style={styles.botActions}>
                    {!keyStatus?.has_key ? (
                      <button onClick={() => setShowSetup(true)} style={styles.startButton}>
                        🔑 Connect Wallet to Activate
                      </button>
                    ) : botItem.status === 'running' ? (
                      <button onClick={() => onStartStop(botItem.id, 'stop')} style={styles.stopButton}>
                        ⏹ Stop Bot
                      </button>
                    ) : (
                      <button onClick={() => onStartStop(botItem.id, 'start')} style={styles.startButton}>
                        ▶ Start Bot
                      </button>
                    )}
                    <button onClick={() => setEditingBot(botItem)} style={styles.editButton}>
                      ✏️ Edit Settings
                    </button>
                  </div>
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
              {!keyStatus?.has_key ? (
                <button onClick={() => setShowSetup(true)} style={styles.startButton}>
                  🔑 Connect Wallet to Activate
                </button>
              ) : bot.status === 'running' ? (
                <button onClick={() => onStartStop(bot.id, 'stop')} style={styles.stopButton}>
                  ⏹ Stop Bot
                </button>
              ) : (
                <button onClick={() => onStartStop(bot.id, 'start')} style={styles.startButton}>
                  ▶ Start Bot
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
          onSave={async () => {
            setEditingBot(null);
            await onRefresh();
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
    padding: '16px 32px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e5e7eb',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#0d9488',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '16px',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '18px',
    color: '#111827',
  },
  nav: {
    display: 'flex',
    gap: '4px',
  },
  navButton: {
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  navButtonActive: {
    backgroundColor: '#f0fdfa',
    color: '#0d9488',
    fontWeight: 600,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  walletChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    backgroundColor: '#f3f4f6',
    fontSize: '13px',
    fontFamily: 'monospace',
    color: '#374151',
  },
  chainDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#22c55e',
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#fff',
    color: '#6b7280',
    fontSize: '13px',
    cursor: 'pointer',
  },

  // Main
  main: {
    maxWidth: '960px',
    margin: '0 auto',
    padding: '32px 24px',
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
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  startButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  stopButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
  editButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
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
