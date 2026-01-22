import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  Bot,
  Users,
  Coins
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function MetricCard({ icon: Icon, label, value, change, changeType }) {
  const isPositive = changeType === 'positive' || (change && change > 0);
  const isNegative = changeType === 'negative' || (change && change < 0);

  return (
    <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-primary-400" />
        <span className="text-dark-400 text-sm">{label}</span>
      </div>
      <div className="text-white text-xl font-semibold">{value}</div>
      {change !== undefined && (
        <div className={`text-xs mt-1 ${isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-dark-400'}`}>
          {isPositive && '+'}{change}%
        </div>
      )}
    </div>
  );
}

export default function MetricsBar({ metrics }) {
  const { isAdmin } = useAuth();

  // Default metrics for demo
  const defaultAdminMetrics = {
    clients: 12,
    tokens: 28,
    volume: '$2.4M',
    pnl: '+$45,230',
    pnlChange: 12.5,
    activeBots: 34
  };

  const defaultClientMetrics = {
    tokens: 3,
    portfolioValue: '$125,420',
    volume: '$45,230',
    pnl: '+$1,234',
    pnlChange: 5.3,
    activeBots: 6
  };

  const data = metrics || (isAdmin ? defaultAdminMetrics : defaultClientMetrics);

  if (isAdmin) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MetricCard icon={Users} label="Clients" value={data.clients} />
        <MetricCard icon={Coins} label="Tokens" value={data.tokens} />
        <MetricCard icon={BarChart3} label="Volume (7d)" value={data.volume} />
        <MetricCard icon={TrendingUp} label="P&L (7d)" value={data.pnl} change={data.pnlChange} />
        <MetricCard icon={Bot} label="Active Bots" value={data.activeBots} />
        <MetricCard icon={Wallet} label="Total Value" value={data.totalValue || '$8.2M'} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <MetricCard icon={Coins} label="Tokens" value={data.tokens} />
      <MetricCard icon={Wallet} label="Portfolio" value={data.portfolioValue} />
      <MetricCard icon={BarChart3} label="Volume (7d)" value={data.volume} />
      <MetricCard icon={TrendingUp} label="P&L (7d)" value={data.pnl} change={data.pnlChange} />
      <MetricCard icon={Bot} label="Active Bots" value={data.activeBots} />
    </div>
  );
}
