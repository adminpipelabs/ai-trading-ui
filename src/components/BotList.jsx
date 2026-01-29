import { useState, useEffect } from "react";

const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export function BotList({ account = null, onEditBot = null }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = async () => {
    // Don't fetch if account is not set yet (for client view)
    if (account === null || account === undefined) {
      console.log('⏳ BotList: Waiting for account to be set...');
      setBots([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true); // Set loading when we start fetching
      console.log('🔍 BotList: Fetching bots for account:', account);
      const { tradingBridge } = await import('../services/api');
      const data = await tradingBridge.getBots(account);
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
      alert('Edit functionality: Open bot edit modal with bot data');
    }
  };

  useEffect(() => { 
    fetchBots(); 
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, [account]); // Re-fetch when account changes

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

  return (
    <div style={{fontSize: "14px"}}>
      <div style={{display: "grid", gridTemplateColumns: "20px 1fr 90px 100px 120px 120px 80px 80px 80px", gap: "10px", padding: "8px 0", borderBottom: "1px solid #eee", color: "#888", fontSize: "12px", fontWeight: 600}}>
        <span></span>
        <span>NAME</span>
        <span>TYPE</span>
        <span>PAIR</span>
        <span>EXCHANGE</span>
        <span>STATS</span>
        <span>STATUS</span>
        <span></span>
        <span></span>
      </div>
      {bots.map(bot => (
        <div key={bot.id} style={{display: "grid", gridTemplateColumns: "20px 1fr 90px 100px 120px 120px 80px 80px 80px", gap: "10px", padding: "12px 0", borderBottom: "1px solid #f5f5f5", alignItems: "center"}}>
          <span style={{width: "10px", height: "10px", borderRadius: "50%", backgroundColor: bot.status === "running" ? "#10b981" : bot.status === "error" ? "#ef4444" : "#d1d5db"}} title={bot.status || "stopped"}></span>
          <span style={{fontWeight: 500}}>{bot.name}</span>
          <span style={{color: "#888", fontSize: "12px"}}>{getBotTypeDisplay(bot)}</span>
          <span style={{fontSize: "12px"}}>{bot.pair || '-'}</span>
          <span style={{color: "#888", fontSize: "12px"}}>{getConnectorDisplay(bot)}</span>
          <span style={{color: "#10b981", fontSize: "12px"}}>{getStatsDisplay(bot)}</span>
          <span style={{fontSize: "11px", fontWeight: 500, color: bot.status === "running" ? "#10b981" : bot.status === "error" ? "#ef4444" : "#6b7280", textTransform: "uppercase"}}>
            {bot.status || "stopped"}
          </span>
          <button 
            onClick={() => toggleBot(bot.id, bot.status)} 
            style={{
              padding: "6px 12px", 
              borderRadius: "6px", 
              border: "none", 
              cursor: "pointer", 
              fontSize: "11px", 
              fontWeight: 500,
              backgroundColor: bot.status === "running" ? "#fee2e2" : "#d1fae5", 
              color: bot.status === "running" ? "#dc2626" : "#059669",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.target.style.opacity = "0.8"}
            onMouseOut={(e) => e.target.style.opacity = "1"}
          >
            {bot.status === "running" ? "Stop" : "Start"}
          </button>
          <div style={{display: "flex", gap: "4px"}}>
            <button 
              onClick={() => handleEditBot(bot)} 
              style={{
                padding: "6px 10px", 
                borderRadius: "6px", 
                border: "1px solid #d1d5db", 
                cursor: "pointer", 
                fontSize: "11px", 
                backgroundColor: "#fff",
                color: "#6b7280",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = "#f3f4f6"; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = "#fff"; }}
              title="Edit bot"
            >
              Edit
            </button>
            <button 
              onClick={() => handleDeleteBot(bot.id, bot.name)} 
              style={{
                padding: "6px 10px", 
                borderRadius: "6px", 
                border: "1px solid #fee2e2", 
                cursor: "pointer", 
                fontSize: "11px", 
                backgroundColor: "#fff",
                color: "#dc2626",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = "#fee2e2"; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = "#fff"; }}
              title="Delete bot"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
