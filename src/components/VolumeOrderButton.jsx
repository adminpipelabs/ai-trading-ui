import { useState } from "react";
import { volumeOrder } from "../lib/trading";

export function VolumeOrderButton({ token = "SHARP", account1 = "client_sharp", account2 = "client_sharp_2", exchange = "bitmart", amount = 2000 }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await volumeOrder(token, account1, account2, exchange, amount);
      alert(`Volume order at $${res.price}\nAmount: ${res.amount} ${token}`);
    } catch (err) {
      alert("Need 2nd account setup first");
    }
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
      {loading ? "Placing..." : `Volume ${token}`}
    </button>
  );
}
