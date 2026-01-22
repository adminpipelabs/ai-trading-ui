import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Bot, 
  FileText, 
  Download,
  PlayCircle,
  StopCircle,
  Users,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function QuickActions({ onAction }) {
  const { isAdmin } = useAuth();

  const adminActions = [
    { id: 'all-balances', icon: Wallet, label: 'All Balances', query: 'Show me all client balances', color: 'primary' },
    { id: 'global-pnl', icon: TrendingUp, label: 'Global P&L', query: 'Show P&L report for all clients this week', color: 'green' },
    { id: 'bot-status', icon: Bot, label: 'Bot Status', query: 'Show status of all active bots', color: 'blue' },
    { id: 'alerts', icon: AlertTriangle, label: 'Alerts', query: 'Show any underperforming tokens or issues', color: 'amber' },
    { id: 'start-all', icon: PlayCircle, label: 'Start All Bots', query: 'Start all paused bots', color: 'green' },
    { id: 'stop-all', icon: StopCircle, label: 'Stop All Bots', query: 'Stop all running bots', color: 'red' },
    { id: 'client-summary', icon: Users, label: 'Client Summary', query: 'Give me a summary of all client activity today', color: 'purple' },
    { id: 'export-report', icon: Download, label: 'Export Report', query: 'Generate and download a full platform report', color: 'dark' },
  ];

  const clientActions = [
    { id: 'my-balances', icon: Wallet, label: 'My Balances', query: 'Check my current balances', color: 'primary' },
    { id: 'my-pnl', icon: TrendingUp, label: 'My P&L', query: 'Show my P&L this week', color: 'green' },
    { id: 'my-bots', icon: Bot, label: 'Bot Status', query: 'What bots are running on my tokens?', color: 'blue' },
    { id: 'trade-history', icon: FileText, label: 'Trade History', query: 'Show my trades from today', color: 'purple' },
    { id: 'download-trades', icon: Download, label: 'Download Trades', query: 'Download my trade history as CSV', color: 'dark' },
    { id: 'token-status', icon: Settings, label: 'Token Status', query: 'Show detailed status of all my tokens', color: 'amber' },
  ];

  const actions = isAdmin ? adminActions : clientActions;

  const colorClasses = {
    primary: 'bg-primary-600/20 text-primary-400 hover:bg-primary-600/30',
    green: 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
    blue: 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30',
    amber: 'bg-amber-600/20 text-amber-400 hover:bg-amber-600/30',
    red: 'bg-red-600/20 text-red-400 hover:bg-red-600/30',
    purple: 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30',
    dark: 'bg-dark-600 text-dark-200 hover:bg-dark-500',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.query)}
          className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${colorClasses[action.color]}`}
        >
          <action.icon size={20} className="mb-1" />
          <span className="text-xs font-medium">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
