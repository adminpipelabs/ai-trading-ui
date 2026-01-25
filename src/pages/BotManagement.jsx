import { useState, useEffect } from "react";

const API = "https://trading-bridge-production.up.railway.app";

export default function BotManagement() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "all", search: "" });

  const fetchBots = async () => {
    try {
      const res = await fetch(`${API}/bots`);
      const data = await res.json();
      setBots(data.bots || []);
    } catch (err) {
      console.error("Failed to fetch bots", err);
    }
    setLoading(false);
  };

  const toggle = async (botId, status) => {
    const action = status === "running" ? "stop" : "start";
    try {
      await fetch(`${API}/bots/${botId}/${action}`, { method: "POST" });
      fetchBots();
    } catch (err) {
      console.error("Failed to toggle bot", err);
    }
  };

  useEffect(() => { fetchBots(); const i = setInterval(fetchBots, 10000); return () => clearInterval(i); }, []);

  const filteredBots = bots.filter(b => {
    if (filter.status !== "all" && b.status !== filter.status) return false;
    if (filter.search && !b.name.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const stats = { total: bots.length, running: bots.filter(b => b.status === "running").length, stopped: bots.filter(b => b.status === "stopped").length };
  const statusColor = (s) => s === "running" ? "#10b981" : s === "error" ? "#ef4444" : "#94a3b8";
  const goBack = () => { window.location.href = "/"; };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <header style={{ background: "white", borderBottom: "1px solid #e5e7eb", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div onClick={goBack} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, background: "#0d9488", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14 }}>P</div>
              <span style={{ fontWeight: 600, fontSize: 16, color: "#0f172a" }}>Pipe Labs</span>
            </div>
            <span style={{ color: "#94a3b8" }}>-</span>
            <span style={{ fontWeight: 500, color: "#0f172a" }}>Bot Management</span>
          </div>
          <button onClick={goBack} style={{ padding: "8px 16px", background: "#f1f5f9", borderRadius: 6, fontSize: 13, color: "#475569", border: "none", cursor: "pointer" }}>Back to Overview</button>
        </div>
      </header>
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[{ label: "Total", value: stats.total, color: "#0f172a" }, { label: "Running", value: stats.running, color: "#10b981" }, { label: "Stopped", value: stats.stopped, color: "#94a3b8" }].map((s, i) => (
            <div key={i} style={{ background: "white", padding: "14px 20px", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder="Search bots..." value={filter.search} onChange={(e) => setFilter({...filter, search: e.target.value})} style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, width: 180 }} />
              <select value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} style={{ padding: "6px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}>
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
              </select>
            </div>
            <button style={{ background: "#0d9488", color: "white", border: "none", padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>+ Add Bot</button>
          </div>
          {loading ? (<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading bots...</div>) : filteredBots.length === 0 ? (<div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No bots found</div>) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 1fr 100px 100px 80px 120px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}><span></span><span>Name</span><span>Client</span><span>Strategy</span><span>Pair</span><span>P/L</span><span>Actions</span></div>
              {filteredBots.map(bot => (
                <div key={bot.id} style={{ display: "grid", gridTemplateColumns: "50px 1fr 1fr 100px 100px 80px 120px", padding: "12px 16px", borderBottom: "1px solid #f1f5f9", alignItems: "center", fontSize: 13 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(bot.status), boxShadow: bot.status === "running" ? "0 0 0 3px rgba(16,185,129,0.2)" : "none" }}></span><span style={{ fontSize: 10, fontWeight: 600, color: statusColor(bot.status) }}>{bot.status === "running" ? "ON" : "OFF"}</span></span>
                  <span style={{ fontWeight: 500 }}>{bot.name}</span>
                  <span style={{ color: "#64748b" }}>{bot.client || bot.account || "-"}</span>
                  <span style={{ padding: "2px 6px", background: "#dbeafe", color: "#1d4ed8", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{bot.strategy || bot.type || "-"}</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>{bot.pair || "-"}</span>
                  <span style={{ fontWeight: 500, color: "#10b981" }}>-</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => toggle(bot.id, bot.status)} style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, border: "none", borderRadius: 4, cursor: "pointer", background: bot.status === "running" ? "#fef2f2" : "#ecfdf5", color: bot.status === "running" ? "#dc2626" : "#059669" }}>{bot.status === "running" ? "Stop" : "Start"}</button>
                    <button style={{ padding: "4px 10px", fontSize: 11, fontWeight: 500, border: "none", borderRadius: 4, cursor: "pointer", background: "#f1f5f9", color: "#475569" }}>Edit</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
