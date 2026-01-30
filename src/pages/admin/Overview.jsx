import React, { useRef, useEffect } from 'react';
import { Bot, User, Users, BarChart3, TrendingUp, Activity, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

// ========== METRIC CARD ==========
export function MetricCard({ icon, label, value, subvalue, positive, onClick }) {
  const { theme } = useTheme();
  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl mb-2 transition-all ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
         style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, boxShadow: theme.shadow }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}>{icon}</div>
      <div className="flex-1">
        <div className="text-xs font-medium" style={{ color: theme.textMuted }}>{label}</div>
        <div className="text-base font-semibold flex items-center gap-1.5" style={{ color: theme.textPrimary }}>
          {value}
          {subvalue && <span className="text-xs font-medium" style={{ color: positive ? theme.positive : theme.negative }}>{subvalue}</span>}
        </div>
      </div>
      {onClick && <ChevronRight size={16} style={{ color: theme.textMuted }} />}
    </div>
  );
}

// ========== MESSAGE ==========
function Message({ message, theme, isDark }) {
  return (
    <div className="flex gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
           style={{ background: message.role === 'assistant' ? theme.accentLight : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: message.role === 'assistant' ? theme.accent : 'white' }}>
        {message.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
      </div>
      <div className="flex-1 p-4 rounded-2xl text-sm leading-relaxed"
           style={{ background: message.role === 'assistant' ? theme.bgCard : (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'), border: `1px solid ${message.role === 'assistant' ? theme.border : 'rgba(99, 102, 241, 0.2)'}`, color: theme.textSecondary }}>
        {message.content}
        {message.data?.type === 'price' && (
          <div className="mt-3 p-4 rounded-xl" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${theme.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold" style={{ color: theme.textPrimary }}>{message.data.pair}</span>
              <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.positive }}><ArrowUpRight size={14} />{message.data.change}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{message.data.price}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== OVERVIEW COMPONENT ==========
export default function Overview({ user, metrics, messages, input, setInput, isLoading, handleSend, quickPrompts, messagesEndRef, navigate, theme, isDark }) {
  const { theme: themeFromContext } = useTheme();
  const finalTheme = theme || themeFromContext;

  useEffect(() => { 
    if (messagesEndRef?.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [messages, messagesEndRef]);

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: finalTheme.textPrimary }}>Admin Dashboard</h1>
          <p className="text-sm" style={{ color: finalTheme.textMuted }}>Welcome back, {user?.name || user?.wallet_address || 'Admin'}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard icon={<Users size={16} />} label="Clients" value={metrics.clients} onClick={() => navigate('/admin/clients')} />
          <MetricCard icon={<BarChart3 size={16} />} label="Volume (7d)" value={metrics.volume} />
          <MetricCard icon={<TrendingUp size={16} />} label="P&L (7d)" value={metrics.pnl} subvalue={metrics.pnlPct} positive />
          <MetricCard icon={<Activity size={16} />} label="Active Bots" value={metrics.bots} onClick={() => navigate('/admin/bots')} />
        </div>

        {/* Chat Interface */}
        <div className="rounded-xl" style={{ background: finalTheme.bgCard, border: `1px solid ${finalTheme.border}`, padding: '24px' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: finalTheme.accentLight, color: finalTheme.accent }}>
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: finalTheme.textPrimary }}>AI Assistant</h2>
              <p className="text-xs" style={{ color: finalTheme.textMuted }}>Ask me anything about your platform</p>
            </div>
          </div>

          <div className="space-y-4 mb-6" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {messages.map((msg, i) => (
              <Message key={i} message={msg} theme={finalTheme} isDark={isDark} />
            ))}
            {isLoading && (
              <div className="flex gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: finalTheme.accentLight, color: finalTheme.accent }}>
                  <Bot size={18} />
                </div>
                <div className="flex-1 p-4 rounded-2xl text-sm" style={{ background: finalTheme.bgSecondary, color: finalTheme.textMuted }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none"
              style={{ background: finalTheme.bgInput, border: `1px solid ${finalTheme.border}`, color: finalTheme.textPrimary }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: finalTheme.accent, color: 'white' }}
            >
              Send
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(prompt);
                  setTimeout(() => handleSend(), 100);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: finalTheme.bgSecondary, color: finalTheme.textSecondary, border: `1px solid ${finalTheme.border}` }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
