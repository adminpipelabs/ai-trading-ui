import { useState } from "react";
import { getBalance } from "../lib/trading";

export function BalanceButton({ account = "client_sharp" }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const data = await getBalance(account);
      const b = data.balances?.bitmart;
      if (b) {
        alert(`${account} Balance:\n\nSHARP: ${b.SHARP?.total || 0} (${b.SHARP?.free || 0} free)\nUSDT: $${b.USDT?.total?.toFixed(2) || 0} ($${b.USDT?.free?.toFixed(2) || 0} free)`);
      } else {
        alert("No balance data");
      }
    } catch (err) {
      alert("Error fetching balance");
    }
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading} className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50">
      {loading ? "Loading..." : "Check Balance"}
    </button>
  );
}