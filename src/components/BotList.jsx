import { useState, useEffect } from "react";

const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export function BotList({ account = null }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = async () => {
    // Don't fetch if account is not set yet (for client view)
    if (account === null) {
      console.log('⏳ BotList: Waiting for account to be set...');
      setLoading(false);
      return;
    }
    
    try {
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
    }
    setLoading(false);
  };

  const toggleBot = async (botId, currentStatus) => {
    const action = currentStatus === "running" ? "stop" : "start";
    try {
      await fetch(`${TRADING_BRIDGE}/bots/${botId}/${action}`, { method: "POST" });
      fetchBots();
    } catch (err) {
      console.error("Failed to toggle bot", err);
    }
  };

  useEffect(() => { 
    fetchBots(); 
    const interval = setInterval(fetchBots, 10000);
    return () => clearInterval(interval);
  }, [account]); // Re-fetch when account changes

  if (loading) return <div style={{color: "#888", padding: "10px"}}>Loading bots...</div>;
  if (bots.length === 0) return <div style={{color: "#888", padding: "10px"}}>No bots configured</div>;

  return (
    <div style={{fontSize: "14px"}}>
      <div style={{display: "grid", gridTemplateColumns: "20px 1fr 80px 100px 80px 80px 70px", gap: "10px", padding: "8px 0", borderBottom: "1px solid #eee", color: "#888", fontSize: "12px"}}>
        <span></span>
        <span>NAME</span>
        <span>TYPE</span>
        <span>PAIR</span>
        <span>EXCHANGE</span>
        <span>P&L</span>
        <span></span>
      </div>
      {bots.map(bot => (
        <div key={bot.id} style={{display: "grid", gridTemplateColumns: "20px 1fr 80px 100px 80px 80px 70px", gap: "10px", padding: "10px 0", borderBottom: "1px solid #f5f5f5", alignItems: "center"}}>
          <span style={{width: "10px", height: "10px", borderRadius: "50%", backgroundColor: bot.status === "running" ? "#10b981" : "#d1d5db"}}></span>
          <span style={{fontWeight: 500}}>{bot.name}</span>
          <span style={{color: "#888"}}>{bot.strategy || bot.type}</span>
          <span>{bot.pair}</span>
          <span style={{color: "#888"}}>{bot.connector || bot.exchange}</span>
          <span style={{color: "#10b981"}}>-</span>
          <button onClick={() => toggleBot(bot.id, bot.status)} style={{padding: "4px 12px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", backgroundColor: bot.status === "running" ? "#fee2e2" : "#d1fae5", color: bot.status === "running" ? "#dc2626" : "#059669"}}>
            {bot.status === "running" ? "Stop" : "Start"}
          </button>
        </div>
      ))}
    </div>
  );
}
