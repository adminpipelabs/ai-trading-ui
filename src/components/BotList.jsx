import { useState, useEffect } from "react";

const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export function BotList() {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBots = async () => {
    const res = await fetch(`${TRADING_BRIDGE}/bots`);
    const data = await res.json();
    setBots(data.bots || []);
    setLoading(false);
  };

  const toggleBot = async (botId, currentStatus) => {
    const action = currentStatus === "running" ? "stop" : "start";
    await fetch(`${TRADING_BRIDGE}/bots/${botId}/${action}`, { method: "POST" });
    fetchBots();
  };

  useEffect(() => { fetchBots(); }, []);

  if (loading) return <div className="text-gray-500">Loading bots...</div>;
  if (bots.length === 0) return <div className="text-gray-500">No bots configured</div>;

  return (
    <div className="space-y-2">
      {bots.map(bot => (
        <div key={bot.id} className="flex items-center justify-between py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${bot.status === "running" ? "bg-green-400" : "bg-gray-300"}`}></span>
            <div>
              <div className="font-medium text-gray-900">{bot.name}</div>
              <div className="text-sm text-gray-500">{bot.exchange} · {bot.pair}</div>
            </div>
          </div>
          <button
            onClick={() => toggleBot(bot.id, bot.status)}
            className={`px-3 py-1 text-sm rounded ${
              bot.status === "running" 
                ? "bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600" 
                : "bg-teal-100 hover:bg-teal-200 text-teal-700"
            }`}
          >
            {bot.status === "running" ? "Stop" : "Start"}
          </button>
        </div>
      ))}
    </div>
  );
}
