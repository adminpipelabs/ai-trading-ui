const TRADING_BRIDGE = "https://trading-bridge-production.up.railway.app";

export async function spreadOrder(token: string, account: string = "client_sharp", exchange: string = "bitmart", amount: number = 1600) {
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

export async function volumeOrder(token: string, account1: string = "client_sharp", account2: string = "client_sharp_2", exchange: string = "bitmart", amount: number = 2000) {
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
