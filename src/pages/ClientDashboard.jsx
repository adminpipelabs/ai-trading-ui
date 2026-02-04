import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import BotHealthBadge from '../components/BotHealthBadge';
import ClientBotSetup from '../components/ClientBotSetup';
import KeyManagement from '../components/KeyManagement';
import EditBotModal from '../components/EditBotModal';
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
  const [editingBot, setEditingBot] = useState(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get client info
      try {
        const { adminAPI } = await import('../services/api');
        const clients = await adminAPI.getClients();
        const foundClient = clients.find(c => 
          c.wallet_address?.toLowerCase() === (user.wallet_address || user.wallet)?.toLowerCase() ||
          c.account_identifier === user.account_identifier ||
          c.wallets?.some(w => w.address?.toLowerCase() === (user.wallet_address || user.wallet)?.toLowerCase())
        );
        setClient(foundClient || user);
      } catch (e) {
        console.error('Failed to fetch client:', e);
        setClient(user);
      }

      // Fetch client's bots
      const accountId = user.account_identifier || client?.account_identifier;
      if (accountId) {
        const botsData = await tradingBridge.getBots(accountId);
        const botsList = Array.isArray(botsData) ? botsData : (botsData.bots || []);
        // Filter to only this client's bots
        const clientId = client?.id || user.id;
        setBots(botsList.filter(bot => 
          bot.client_id === clientId || 
          bot.account === accountId
        ));
      }

      // Fetch key status
      const clientId = client?.id || user.id;
      if (clientId) {
        try {
          const status = await tradingBridge.getClientKeyStatus(clientId);
          setKeyStatus(status);
        } catch (e) {
          console.error('Failed to fetch key status:', e);
          setKeyStatus({ has_key: false });
        }
      }

      // Fetch wallet balance if bot exists
      if (bots.length > 0 && bots[0].id) {
        try {
          // Try to get balance from health endpoint or bot endpoint
          const botId = bots[0].id;
          const balanceRes = await fetch(`${API_BASE}/bots/${botId}/balance/solana`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token')}`,
              'X-Wallet-Address': user.wallet_address || user.wallet,
            },
          });
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            setWalletBalance(balanceData);
          }
        } catch (e) {
          console.error('Failed to fetch balance:', e);
          setWalletBalance(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
    setLoading(false);
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

  const tabs = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'settings', label: 'Settings' },
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
          />
        ) : (
          <SettingsTab
            user={user}
            client={client}
            keyStatus={keyStatus}
            onRefresh={fetchData}
          />
        )}
      </main>
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────
function DashboardTab({ user, client, bots, keyStatus, walletBalance, showSetup, setShowSetup, editingBot, setEditingBot, onStartStop, onRefresh }) {
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
          label="Bot Status"
          value={bot?.health_status === 'healthy' ? '🟢 Running' :
                 bot?.health_status === 'stale' ? '🟡 Stale' :
                 bot?.health_status === 'stopped' ? '🔴 Stopped' :
                 bot?.health_status === 'error' ? '⚠️ Error' :
                 bot ? '⚪ Unknown' : 'No Bot'}
          sublabel={bot?.health_message}
        />
        <StatCard
          label="Wallet Balance"
          value={walletBalance?.sol_balance != null
            ? `${walletBalance.sol_balance.toFixed(4)} SOL`
            : walletBalance?.balance_sol != null
            ? `${walletBalance.balance_sol.toFixed(4)} SOL`
            : '—'}
          sublabel={walletBalance?.usd_value ? `≈ $${walletBalance.usd_value.toFixed(2)}` : null}
        />
        <StatCard
          label="Volume Today"
          value={`$${volumeToday.toLocaleString()}`}
          sublabel={`of $${volumeTarget.toLocaleString()} target`}
          progress={volumePercent}
        />
        <StatCard
          label="Volume (7d)"
          value={`$${volume7d.toLocaleString()}`}
        />
      </div>

      {/* Connect Wallet Banner */}
      {!keyStatus?.has_key && (
        <div style={styles.warningBanner}>
          <div>
            <strong style={{ color: '#92400e' }}>⚠️ Connect your trading wallet</strong>
            <p style={{ color: '#a16207', margin: '4px 0 0', fontSize: '14px' }}>
              Your bot needs a trading wallet to operate. Input your private key to get started.
            </p>
          </div>
          <button onClick={() => setShowSetup(true)} style={styles.connectButton}>
            Connect Wallet Key
          </button>
        </div>
      )}

      {/* Bot Setup Wizard */}
      {showSetup && (
        <div style={styles.section}>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setShowSetup(false)}
              style={styles.backButton}
            >
              ← Back
            </button>
          </div>
          <ClientBotSetup
            clientId={clientId}
            chain={clientChain}
            onBotCreated={() => { setShowSetup(false); onRefresh(); }}
          />
        </div>
      )}

      {/* Bot Detail */}
      {bot && !showSetup && (
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
                  {bot.connector || 'Jupiter'} ({bot.chain || 'Solana'})
                  {bot.pair && ` · ${bot.pair}`}
                </span>
              </div>
            </div>

            <div style={styles.botGrid}>
              <BotStat label="Daily Target" value={`$${(bot.config?.daily_volume_usd || 5000).toLocaleString()}`} />
              <BotStat label="Progress" value={`${volumePercent.toFixed(0)}%`} />
              <BotStat label="Trade Size" value={`$${bot.config?.min_trade_usd || 10} – $${bot.config?.max_trade_usd || 25}`} />
              <BotStat label="Interval" value={`${Math.round((bot.config?.interval_min_seconds || 900) / 60)}–${Math.round((bot.config?.interval_max_seconds || 2700) / 60)} min`} />
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
              {bot.status === 'running' ? (
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
function SettingsTab({ user, client, keyStatus, onRefresh }) {
  const displayClient = client || user;
  const clientChain = client?.chain || (client?.wallets?.[0]?.chain) || 'solana';

  return (
    <div>
      <h1 style={styles.welcomeTitle}>Settings</h1>

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
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────
function StatCard({ label, value, sublabel, progress }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
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

function BotStat({ label, value }) {
  return (
    <div style={styles.botStatItem}>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
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
