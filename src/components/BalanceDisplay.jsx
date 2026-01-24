import { useState, useEffect } from "react";
import { getBalance } from "../lib/trading";

export function BalanceDisplay({ account = "client_sharp" }) {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await getBalance(account);
      setBalance(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBalance(); }, [account]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold mb-2">Balance</h3>
      <button onClick={fetchBalance} className="text-sm text-blue-500">Refresh</button>
      <pre>{JSON.stringify(balance, null, 2)}</pre>
    </div>
  );
}