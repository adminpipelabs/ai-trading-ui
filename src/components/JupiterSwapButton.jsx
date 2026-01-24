import { useState } from "react";
import { getJupiterQuote, SOLANA_TOKENS } from "../lib/trading";

export function JupiterSwapButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Example: Get quote for 1 SOL to USDC
      const amount = 1000000000; // 1 SOL in lamports
      const quote = await getJupiterQuote(SOLANA_TOKENS.SOL, SOLANA_TOKENS.USDC, amount);
      alert(`Jupiter Quote:\n1 SOL = ${(quote.outAmount / 1000000).toFixed(2)} USDC\nRoute: ${quote.routePlan?.length || 0} hops`);
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
