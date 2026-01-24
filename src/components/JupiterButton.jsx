import { useState } from "react";

const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export function JupiterButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${TRADING_BRIDGE}/jupiter/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_token: "SOL", output_token: "USDC", amount: 1 })
      });
      const data = await res.json();
      alert(`Jupiter Quote:\n1 SOL = ${data.output_amount?.toFixed(2) || "?"} USDC`);
    } catch (err) {
      alert("Error getting quote");
    }
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading} className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50">
      {loading ? "Loading..." : "Jupiter Quote"}
    </button>
  );
}