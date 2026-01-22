import React from 'react';
import { 
  Pin, 
  Trash2, 
  Clock, 
  Star,
  Plus,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SavedPrompts({ prompts, onSelect, onDelete, onAddNew }) {
  const { isAdmin } = useAuth();

  // Default prompts based on role
  const defaultAdminPrompts = [
    { id: '1', title: 'All P&L Report', query: 'Show me P&L for all clients this week', pinned: true },
    { id: '2', title: 'Underperforming', query: 'Which tokens are underperforming today?', pinned: true },
    { id: '3', title: 'Bot Status', query: 'Show status of all active bots', pinned: false },
    { id: '4', title: 'Volume Leaders', query: 'Top 5 tokens by volume today', pinned: false },
  ];

  const defaultClientPrompts = [
    { id: '1', title: 'Daily SHARP', query: 'How is SHARP doing today?', pinned: true },
    { id: '2', title: 'My P&L', query: 'Show my P&L this week', pinned: true },
    { id: '3', title: 'Bot Status', query: 'What bots are running on my tokens?', pinned: false },
    { id: '4', title: 'Trade History', query: 'Show my trades from today', pinned: false },
  ];

  const savedPrompts = prompts || (isAdmin ? defaultAdminPrompts : defaultClientPrompts);
  const pinnedPrompts = savedPrompts.filter(p => p.pinned);
  const recentPrompts = savedPrompts.filter(p => !p.pinned);

  return (
    <div className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Saved</span>
          <button 
            onClick={onAddNew}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
          >
            <Plus size={16} className="text-dark-400" />
          </button>
        </div>
      </div>

      {/* Pinned Section */}
      {pinnedPrompts.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Pin size={12} className="text-primary-400" />
            <span className="text-xs text-dark-400 uppercase tracking-wide">Pinned</span>
          </div>
          <div className="space-y-1">
            {pinnedPrompts.map(prompt => (
              <button
                key={prompt.id}
                onClick={() => onSelect(prompt.query)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-dark-800 group transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-dark-200 text-sm truncate">{prompt.title}</span>
                  <ChevronRight size={14} className="text-dark-500 opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Section */}
      {recentPrompts.length > 0 && (
        <div className="p-3 flex-1 overflow-auto">
          <div className="flex items-center gap-2 mb-2 px-2">
            <Clock size={12} className="text-dark-400" />
            <span className="text-xs text-dark-400 uppercase tracking-wide">Recent</span>
          </div>
          <div className="space-y-1">
            {recentPrompts.map(prompt => (
              <div
                key={prompt.id}
                className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <button
                  onClick={() => onSelect(prompt.query)}
                  className="flex-1 text-left"
                >
                  <span className="text-dark-300 text-sm truncate block">{prompt.title}</span>
                </button>
                <button
                  onClick={() => onDelete(prompt.id)}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-dark-600 rounded transition-all"
                >
                  <Trash2 size={12} className="text-dark-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Section */}
      <div className="p-3 border-t border-dark-700">
        <div className="flex items-center gap-2 mb-2 px-2">
          <Star size={12} className="text-amber-400" />
          <span className="text-xs text-dark-400 uppercase tracking-wide">Quick Actions</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {isAdmin ? (
            <>
              <ActionButton label="All Balances" onClick={() => onSelect('Show all client balances')} />
              <ActionButton label="P&L Report" onClick={() => onSelect('Generate P&L report for all clients')} />
              <ActionButton label="Stop All" onClick={() => onSelect('Stop all bots')} danger />
              <ActionButton label="System Status" onClick={() => onSelect('Show system health')} />
            </>
          ) : (
            <>
              <ActionButton label="My Balance" onClick={() => onSelect('Check my balances')} />
              <ActionButton label="My P&L" onClick={() => onSelect('Show my P&L today')} />
              <ActionButton label="Bot Status" onClick={() => onSelect('Show my bot status')} />
              <ActionButton label="Trades" onClick={() => onSelect('Show my recent trades')} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
        danger 
          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
          : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
      }`}
    >
      {label}
    </button>
  );
}
