"use client";
import { useState } from "react";
import { spreadOrder } from "@/lib/trading";

export function SpreadOrderButton({ token = "SHARP" }: { token?: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await spreadOrder(token);
      alert(`Spread orders placed!\nBuy: $${res.buyPrice}\nSell: $${res.sellPrice}`);
    } catch (err) {
      alert("Error placing orders");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleClick}
      disabled={loading}
      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
    >
      {loading ? "Placing..." : `Spread Order ${token}`}
    </button>
  );
}
