import { useState } from "react";
import { spreadOrder } from "../lib/trading";

export function SpreadOrderButton({ token = "SHARP", account = "client_sharp", exchange = "bitmart", amount = 1600 }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await spreadOrder(token, account, exchange, amount);
      alert(`Spread orders placed!\nBuy: $${res.buyPrice}\nSell: $${res.sellPrice}`);
    } catch (err) {
      alert("Error placing orders");
    }
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
      {loading ? "Placing..." : `Spread ${token}`}
    </button>
  );
}
