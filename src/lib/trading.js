const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export async function spreadOrder(token, account = "client_sharp", exchange = "bitmart", amount = 1600) {
  const priceRes = await fetch(`${TRADING_BRIDGE}/market/price?connector=${exchange}&pair=${token}/USDT`);
  const data = await priceRes.json();
  const price = data.price;
  
  const buyPrice = (price * 0.997).toFixed(6);
  const sellPrice = (price * 1.003).toFixed(6);
  
  const buyRes = await fetch(`${TRADING_BRIDGE}/orders/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_name: account,
      connector_name: exchange,
      trading_pair: `${token}/USDT`,
      side: "buy",
      type: "limit",
      amount: amount,
      price: buyPrice
    })
  });
  
  const sellRes = await fetch(`${TRADING_BRIDGE}/orders/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_name: account,
      connector_name: exchange,
      trading_pair: `${token}/USDT`,
      side: "sell",
      type: "limit",
      amount: amount,
      price: sellPrice
    })
  });
  
  return { success: true, price, buyPrice, sellPrice };
}

export async function volumeOrder(token, account1 = "client_sharp", account2 = "client_sharp_2", exchange = "bitmart", amount = 2000) {
  const priceRes = await fetch(`${TRADING_BRIDGE}/market/price?connector=${exchange}&pair=${token}/USDT`);
  const data = await priceRes.json();
  const price = Number(data.price).toFixed(6);
  
  const sellRes = await fetch(`${TRADING_BRIDGE}/orders/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_name: account1,
      connector_name: exchange,
      trading_pair: `${token}/USDT`,
      side: "sell",
      type: "limit",
      amount: amount,
      price: price
    })
  });
  
  const buyRes = await fetch(`${TRADING_BRIDGE}/orders/place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      account_name: account2,
      connector_name: exchange,
      trading_pair: `${token}/USDT`,
      side: "buy",
      type: "limit",
      amount: amount,
      price: price
    })
  });
  
  return { success: true, price, amount };
}

export async function getBalance(account = "client_sharp") {
  const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";
  const res = await fetch(`${TRADING_BRIDGE}/portfolio?account=${account}`);
  return await res.json();
}

export async function getPrice(token, exchange = "bitmart") {
  const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";
  const res = await fetch(`${TRADING_BRIDGE}/market/price?connector=${exchange}&pair=${token}/USDT`);
  return await res.json();
}

// Jupiter (Solana) Integration
const JUPITER_API = "https://quote-api.jup.ag/v6";

export async function getJupiterQuote(inputMint, outputMint, amount) {
  const res = await fetch(`${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`);
  return await res.json();
}

export async function jupiterSwap(inputMint, outputMint, amount, userPublicKey) {
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
