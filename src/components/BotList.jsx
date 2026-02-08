import { useState, useEffect } from "react";
import EditBotModal from "./EditBotModal";
import BotHealthBadge from "./BotHealthBadge";

const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

// Alert Banner Component
function AlertBanner({ bots, onFilterChange }) {
  const stopped = bots.filter(b => 
    (b.status && b.status.toLowerCase() === 'stopped') ||
    (b.health_status && b.health_status.toLowerCase() === 'stopped')
  ).length;
  
  const stale = bots.filter(b => 
    (b.health_status && b.health_status.toLowerCase() === 'stale') ||
    (b.status && b.status.toLowerCase() === 'stale')
  ).length;
  
  const errors = bots.filter(b => 
    (b.health_status && b.health_status.toLowerCase() === 'error') ||
    (b.status && b.status.toLowerCase() === 'error')
  ).length;
  
  const totalIssues = stopped + stale + errors;
  
  if (totalIssues === 0) return null;
  
  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {totalIssues} bot{totalIssues > 1 ? 's' : ''} need attention:
        </span>
        {stopped > 0 && (
          <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
            {stopped} stopped
          </span>
        )}
        {stale > 0 && (
          <span style={{ color: '#d97706', fontSize: '14px', fontWeight: '500' }}>
            {stale} stale
          </span>
        )}
        {errors > 0 && (
          <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '500' }}>
            {errors} errors
          </span>
        )}
      </div>
      <button
        onClick={() => onFilterChange('issues')}
        style={{
          padding: '6px 12px',
          backgroundColor: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          whiteSpace: 'nowrap'
        }}
      >
        View Issues
      </button>
    </div>
  );
}

export function BotList({ account = null, onEditBot = null, readOnly = false, activeChain = "all" }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBot, setEditingBot] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'running', 'stopped', 'errors', 'issues'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBots = async () => {
    // If account is null, fetch all bots (admin view)
    // If account is set, fetch bots for that account (client view)
    try {
      setLoading(true); // Set loading when we start fetching
      console.log('🔍 BotList: Fetching bots for account:', account || 'ALL (admin view)');
      const { tradingBridge } = await import('../services/api');
      const data = await tradingBridge.getBots(account || null);
      let botsList = Array.isArray(data) ? data : (data.bots || []);
      console.log('📦 BotList: Received bots:', botsList.length, botsList);
      
      // If account filter not supported by backend, filter on frontend
      if (account && botsList.length > 0) {
        const beforeFilter = botsList.length;
        botsList = botsList.filter(bot => bot.account === account);
        console.log(`🔍 BotList: Filtered ${beforeFilter} bots by account "${account}", found ${botsList.length}`);
      }
      
      setBots(botsList);
      console.log('✅ BotList: Set bots:', botsList.length);
    } catch (err) {
      console.error("❌ BotList: Failed to fetch bots", err);
      setBots([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async (botId, currentStatus) => {
    const action = currentStatus === "running" ? "stop" : "start";
    try {
      // Use apiCall helper to ensure auth headers are included
      const { tradingBridge } = await import('../services/api');
      await tradingBridge[action === 'start' ? 'startBot' : 'stopBot'](botId);
      fetchBots();
    } catch (err) {
      console.error("Failed to toggle bot", err);
      alert(`Failed to ${action} bot: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDeleteBot = async (botId, botName) => {
    if (!window.confirm(`Are you sure you want to delete "${botName}"?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const { tradingBridge } = await import('../services/api');
      await tradingBridge.deleteBot(botId);
      alert(`Bot "${botName}" deleted successfully.`);
      fetchBots();
    } catch (err) {
      console.error("Failed to delete bot", err);
      alert(`Failed to delete bot: ${err.message || 'Unknown error'}`);
    }
  };

  const handleEditBot = (bot) => {
    if (onEditBot) {
      onEditBot(bot);
    } else {
      setEditingBot(bot);
    }
  };

  const handleSaveBot = async (botId, payload) => {
    try {
      const { tradingBridge } = await import('../services/api');
      await tradingBridge.updateBot(botId, payload);
      alert(`Bot "${payload.name}" updated successfully.`);
      fetchBots(); // Refresh bot list
    } catch (err) {
      console.error("Failed to update bot", err);
      throw new Error(err.message || 'Failed to update bot');
    }
  };

  useEffect(() => { 
    fetchBots(); 
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, [account, activeChain]); // Re-fetch when account or chain filter changes

  if (loading) return <div style={{color: "#888", padding: "10px"}}>Loading bots...</div>;
  if (bots.length === 0) return <div style={{color: "#888", padding: "10px"}}>No bots configured</div>;

  // Format bot type display
  const getBotTypeDisplay = (bot) => {
    if (bot.bot_type) return bot.bot_type.charAt(0).toUpperCase() + bot.bot_type.slice(1);
    if (bot.strategy) return bot.strategy;
    return 'N/A';
  };

  // Format connector display
  const getConnectorDisplay = (bot) => {
    if (bot.connector) {
      const connector = bot.connector.toLowerCase();
      if (connector === 'jupiter') return 'Jupiter (Solana)';
      if (connector === 'bitmart') return 'BitMart (CEX)';
      return connector;
    }
    return bot.exchange || 'N/A';
  };

  // Format stats display
  const getStatsDisplay = (bot) => {
    if (!bot.stats || Object.keys(bot.stats).length === 0) return '-';
    const stats = bot.stats;
    if (bot.bot_type === 'volume') {
      const volumeToday = stats.volume_today || 0;
      const dailyTarget = bot.config?.daily_volume_usd || 0;
      const progress = dailyTarget > 0 ? ((volumeToday / dailyTarget) * 100).toFixed(0) : 0;
      return `$${volumeToday.toFixed(0)}/${dailyTarget.toFixed(0)} (${progress}%)`;
    }
    if (bot.bot_type === 'spread') {
      const pnl = stats.pnl_usd || 0;
      return `$${pnl.toFixed(2)}`;
    }
    return '-';
  };

  // Filter bots
  const filteredBots = bots.filter(bot => {
    // Search filter
    if (searchQuery && !bot.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    const status = (bot.status || bot.health_status || '').toLowerCase();
    if (filter === 'running') return status === 'running';
    if (filter === 'stopped') return status === 'stopped';
    if (filter === 'errors') return status === 'error';
    if (filter === 'issues') {
      return status === 'stopped' || status === 'stale' || status === 'error';
    }
    
    return true; // 'all'
  });

  // Get status color
  const getStatusColor = (bot) => {
    const status = (bot.status || bot.health_status || '').toLowerCase();
    if (status === 'running') return '#10b981';
    if (status === 'stopped') return '#ef4444';
    if (status === 'stale') return '#f59e0b';
    if (status === 'error') return '#dc2626';
    return '#6b7280';
  };

  // Adjust grid columns based on readOnly mode - more compact
  const gridColumns = readOnly 
    ? "10px 1fr 70px 90px 100px 90px 100px" // No button columns for read-only
    : "10px 1fr 70px 90px 100px 90px 100px 120px"; // Full columns with compact icon buttons

  return (
    <div style={{fontSize: "14px"}}>
      {/* Alert Banner */}
      {!readOnly && <AlertBanner bots={bots} onFilterChange={setFilter} />}
      
      {/* Filters and Search */}
      {!readOnly && (
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search bots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '13px',
              flex: 1,
              maxWidth: '300px',
              minWidth: '200px'
            }}
          />
          
          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: 'All' },
              { key: 'running', label: 'Running' },
              { key: 'stopped', label: 'Stopped' },
              { key: 'errors', label: 'Errors' },
              { key: 'issues', label: 'Issues' }
            ].map(f => {
              const issueCount = f.key === 'issues' ? bots.filter(b => {
                const s = (b.status || b.health_status || '').toLowerCase();
                return s === 'stopped' || s === 'stale' || s === 'error';
              }).length : null;
              
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: filter === f.key ? '#6366f1' : '#f3f4f6',
                    color: filter === f.key ? 'white' : '#374151',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: filter === f.key ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.label} {issueCount !== null && issueCount > 0 && `(${issueCount})`}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Compact Table Header */}
      <div style={{display: "grid", gridTemplateColumns: gridColumns, gap: "8px", padding: "8px 0", borderBottom: "2px solid #e5e7eb", color: "#6b7280", fontSize: "12px", fontWeight: 600}}>
        <span></span>
        <span>NAME</span>
        <span>TYPE</span>
        <span>PAIR</span>
        <span>EXCHANGE</span>
        <span>STATS</span>
        <span>STATUS</span>
        {!readOnly && <span style={{textAlign: 'right'}}>ACTIONS</span>}
      </div>
      
      {/* Compact Bot Rows */}
      {filteredBots.length === 0 ? (
        <div style={{padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px'}}>
          {searchQuery ? 'No bots found matching your search' : 'No bots found'}
        </div>
      ) : (
        filteredBots.map(bot => {
          const statusColor = getStatusColor(bot);
          const isStopped = (bot.status || bot.health_status || '').toLowerCase() === 'stopped';
          
          return (
            <div 
              key={bot.id} 
              style={{
                display: "grid", 
                gridTemplateColumns: gridColumns, 
                gap: "8px", 
                padding: "8px 0", 
                borderBottom: "1px solid #f3f4f6", 
                alignItems: "center",
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Status Dot */}
              <span 
                style={{
                  width: "10px", 
                  height: "10px", 
                  borderRadius: "50%", 
                  backgroundColor: statusColor
                }} 
                title={bot.status || bot.health_status || "stopped"}
              />
              
              {/* Bot Name */}
              <span style={{fontWeight: 500, fontSize: '14px'}}>{bot.name}</span>
              
              {/* Type */}
              <span style={{color: "#6b7280", fontSize: "12px"}}>{getBotTypeDisplay(bot)}</span>
              
              {/* Pair */}
              <span style={{fontSize: "12px"}}>{bot.pair || '-'}</span>
              
              {/* Exchange */}
              <span style={{color: "#6b7280", fontSize: "12px"}}>{getConnectorDisplay(bot)}</span>
              
              {/* Stats */}
              <span style={{color: "#10b981", fontSize: "12px"}}>{getStatsDisplay(bot)}</span>
              
              {/* Status Badge */}
              <span>
                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: statusColor + '20',
                  color: statusColor
                }}>
                  {bot.status || bot.health_status || 'Unknown'}
                </span>
              </span>
              
              {/* Actions (Icon Buttons) */}
              {!readOnly && (
                <div style={{display: "flex", gap: "4px", justifyContent: 'flex-end'}}>
                  {isStopped ? (
                    <button 
                      onClick={() => toggleBot(bot.id, bot.status)} 
                      title="Start Bot"
                      style={{
                        padding: "6px 8px", 
                        borderRadius: "4px", 
                        border: "none", 
                        cursor: "pointer", 
                        fontSize: "12px",
                        backgroundColor: "#10b981",
                        color: "white",
                        minWidth: '32px',
                        transition: "opacity 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.target.style.opacity = "1"}
                    >
                      ▶
                    </button>
                  ) : (
                    <button 
                      onClick={() => toggleBot(bot.id, bot.status)} 
                      title="Stop Bot"
                      style={{
                        padding: "6px 8px", 
                        borderRadius: "4px", 
                        border: "none", 
                        cursor: "pointer", 
                        fontSize: "12px",
                        backgroundColor: "#ef4444",
                        color: "white",
                        minWidth: '32px',
                        transition: "opacity 0.2s"
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                      onMouseLeave={(e) => e.target.style.opacity = "1"}
                    >
                      ⏹
                    </button>
                  )}
                  <button 
                    onClick={() => handleEditBot(bot)} 
                    title="Edit Bot"
                    style={{
                      padding: "6px 8px", 
                      borderRadius: "4px", 
                      border: "none", 
                      cursor: "pointer", 
                      fontSize: "12px",
                      backgroundColor: "#6366f1",
                      color: "white",
                      minWidth: '32px',
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => handleDeleteBot(bot.id, bot.name)} 
                    title="Delete Bot"
                    style={{
                      padding: "6px 8px", 
                      borderRadius: "4px", 
                      border: "none", 
                      cursor: "pointer", 
                      fontSize: "12px",
                      backgroundColor: "#dc2626",
                      color: "white",
                      minWidth: '32px',
                      transition: "opacity 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = "0.8"}
                    onMouseLeave={(e) => e.target.style.opacity = "1"}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
      
      {/* Results Count */}
      {!readOnly && filteredBots.length > 0 && (
        <div style={{ 
          marginTop: '12px', 
          fontSize: '13px', 
          color: '#6b7280',
          paddingTop: '12px',
          borderTop: '1px solid #e5e7eb'
        }}>
          Showing {filteredBots.length} of {bots.length} bots
        </div>
      )}
      
      {/* Edit Bot Modal */}
      <EditBotModal
        bot={editingBot}
        isOpen={!!editingBot}
        onClose={() => setEditingBot(null)}
        onSave={handleSaveBot}
      />
    </div>
  );
}
