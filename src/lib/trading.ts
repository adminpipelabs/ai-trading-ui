
// Jupiter (Solana) Integration
const JUPITER_API = "https://quote-api.jup.ag/v6";

export async function getJupiterQuote(inputMint: string, outputMint: string, amount: number) {
  const res = await fetch(`${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`);
  return await res.json();
}

export async function jupiterSwap(inputMint: string, outputMint: string, amount: number, userPublicKey: string) {
  // Get quote
  const quote = await getJupiterQuote(inputMint, outputMint, amount);
  
  // Get swap transaction
  const swapRes = await fetch(`${JUPITER_API}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey: userPublicKey,
      wrapAndUnwrapSol: true
    })
  });
  
  return await swapRes.json();
}

// Common Solana token mints
export const SOLANA_TOKENS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  WIF: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
};
