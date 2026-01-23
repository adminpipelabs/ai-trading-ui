import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { 
  Send, Bot, User, TrendingUp, Wallet, Activity, Users, Plus, BarChart3, 
  Settings, LogOut, ChevronRight, Sparkles, ArrowUpRight, Mail, Lock, 
  Eye, EyeOff, Shield, Moon, Sun, X, Check, ChevronDown, Key, Building,
  Copy, RefreshCw, AlertCircle, CheckCircle2, Trash2, Edit2, Search,
  MoreVertical, ExternalLink, Clock, Filter, Download, UserPlus, ArrowLeft,
  Coins, MessageSquare
} from 'lucide-react';
import { API_URL } from '../config/api';

// ========== THEME CONTEXT ==========
const ThemeContext = createContext();

const themes = {
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f8fafc',
    bgCard: '#ffffff',
    bgCardHover: '#f1f5f9',
    bgInput: '#f1f5f9',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    border: '#e2e8f0',
    accent: '#0d9488',
    accentLight: 'rgba(13, 148, 136, 0.1)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: '0 1px 3px rgba(0,0,0,0.08)',
    shadowLg: '0 4px 20px rgba(0,0,0,0.08)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.15)',
    logoBg: '#0f172a',
  },
  dark: {
    bgPrimary: '#0a0f1a',
    bgSecondary: '#111827',
    bgCard: 'rgba(255,255,255,0.03)',
    bgCardHover: 'rgba(255,255,255,0.06)',
    bgInput: 'rgba(255,255,255,0.05)',
    textPrimary: '#ffffff',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    border: 'rgba(255,255,255,0.1)',
    accent: '#5eead4',
    accentLight: 'rgba(94, 234, 212, 0.15)',
    positive: '#10b981',
    negative: '#ef4444',
    warning: '#f59e0b',
    shadow: 'none',
    shadowLg: '0 4px 20px rgba(0,0,0,0.3)',
    shadowXl: '0 25px 50px rgba(0,0,0,0.5)',
    logoBg: '#1e293b',
  }
};

// Supported exchanges
const EXCHANGES = [
  { id: 'bitmart', name: 'BitMart', requiresMemo: true },
  { id: 'binance', name: 'Binance', requiresMemo: false },
  { id: 'kucoin', name: 'KuCoin', requiresMemo: true },
  { id: 'gateio', name: 'Gate.io', requiresMemo: false },
  { id: 'mexc', name: 'MEXC', requiresMemo: false },
  { id: 'bybit', name: 'Bybit', requiresMemo: false },
  { id: 'okx', name: 'OKX', requiresMemo: true },
  { id: 'htx', name: 'HTX (Huobi)', requiresMemo: false },
];

// Mock client data
const MOCK_CLIENTS = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john@acmecrypto.com',
    company: 'Acme Crypto',
    phone: '+1 555-0123',
    status: 'active',
    createdAt: '2025-12-15T10:00:00Z',
    lastActive: '2026-01-21T14:30:00Z',
    connectors: [
      { id: 1, exchange: 'bitmart', label: 'Main Account', apiKey: 'd8550cca6914e2b2...' },
      { id: 2, exchange: 'binance', label: 'Trading', apiKey: 'abc123def456...' }
    ],
    tokens: ['SHARP/USDT', 'BTC/USDT', 'ETH/USDT'],
    balance: '$245,000',
    pnl: '+$12,450',
    pnlPercent: '+5.4%'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah@tokenventures.io',
    company: 'Token Ventures',
    phone: '+1 555-0456',
    status: 'active',
    createdAt: '2026-01-05T09:00:00Z',
    lastActive: '2026-01-21T12:15:00Z',
    connectors: [
      { id: 3, exchange: 'kucoin', label: 'Primary', apiKey: 'kc789xyz...' }
    ],
    tokens: ['SHARP/USDT', 'SOL/USDT'],
    balance: '$89,500',
    pnl: '+$3,200',
    pnlPercent: '+3.7%'
  },
  {
    id: 3,
    name: 'Michael Chen',
    email: 'mchen@defifund.co',
    company: 'DeFi Fund',
    phone: '+1 555-0789',
    status: 'invited',
    createdAt: '2026-01-20T16:00:00Z',
    lastActive: null,
    connectors: [
      { id: 4, exchange: 'bitmart', label: 'Trading Account', apiKey: 'bm456abc...' }
    ],
    tokens: ['SHARP/USDT'],
    balance: '$0',
    pnl: '$0',
    pnlPercent: '0%'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@blockassets.com',
    company: 'Block Assets',
    phone: '+1 555-0321',
    status: 'inactive',
    createdAt: '2025-11-10T11:00:00Z',
    lastActive: '2025-12-28T09:45:00Z',
    connectors: [],
    tokens: ['BTC/USDT'],
    balance: '$15,000',
    pnl: '-$500',
    pnlPercent: '-3.2%'
  }
];

// ========== CLIENT MANAGEMENT PAGE ==========
function ClientManagement({ onBack, onAddClient, clients, setClients }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (client.wallet_address && client.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Active' },
      invited: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'Invited' },
      inactive: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', text: 'Inactive' }
    };
    const s = styles[status] || styles.inactive;
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
        {s.text}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = (clientId) => {
    setClients(clients.filter(c => c.id !== clientId));
    setShowDeleteConfirm(null);
    setSelectedClient(null);
  };

  const handleResendInvite = (client) => {
    alert(`Invitation resent to ${client.email}`);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg transition-all hover:bg-gray-100"
            style={{ color: theme.textMuted, border: `1px solid ${theme.border}` }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Client Management</h1>
            <p className="text-sm" style={{ color: theme.textMuted }}>{clients.length} total clients</p>
          </div>
        </div>
        <button 
          onClick={onAddClient}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90"
          style={{ background: theme.accent, color: 'white' }}
        >
          <UserPlus size={18} />
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full py-2.5 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'invited', 'inactive'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize"
              style={{ 
                background: statusFilter === status ? theme.accent : theme.bgCard,
                color: statusFilter === status ? 'white' : theme.textSecondary,
                border: `1px solid ${statusFilter === status ? theme.accent : theme.border}`
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Client List & Detail Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Client List */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-2">
            {filteredClients.map(client => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 rounded-xl transition-all cursor-pointer"
                style={{ 
                  background: selectedClient?.id === client.id ? theme.accentLight : theme.bgCard,
                  border: `1px solid ${selectedClient?.id === client.id ? theme.accent : theme.border}`,
                  boxShadow: theme.shadow
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
                      style={{ background: theme.accent, color: 'white' }}
                    >
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium" style={{ color: theme.textPrimary }}>{client.name}</div>
                      <div className="text-xs font-mono" style={{ color: theme.textMuted }}>
                        {client.wallet_address ? `${client.wallet_address.slice(0, 6)}...${client.wallet_address.slice(-4)}` : client.email || 'No wallet'}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(client.status)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <span style={{ color: theme.textMuted }}>
                      <span style={{ color: theme.textSecondary }}>{client.connectors.length}</span> exchanges
                    </span>
                    <span style={{ color: theme.textMuted }}>
                      <span style={{ color: theme.textSecondary }}>{client.tokens.length}</span> tokens
                    </span>
                  </div>
                  <span style={{ color: client.pnlPercent.startsWith('+') ? theme.positive : client.pnlPercent.startsWith('-') ? theme.negative : theme.textMuted }}>
                    {client.pnl}
                  </span>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="text-center py-12" style={{ color: theme.textMuted }}>
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <p>No clients found</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Detail Panel */}
        {selectedClient ? (
          <div 
            className="w-96 rounded-xl overflow-hidden flex flex-col"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg }}
          >
            {/* Detail Header */}
            <div className="p-5 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold"
                    style={{ background: theme.accent, color: 'white' }}
                  >
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold" style={{ color: theme.textPrimary }}>{selectedClient.name}</div>
                    <div className="text-sm" style={{ color: theme.textMuted }}>{selectedClient.company}</div>
                  </div>
                </div>
                {getStatusBadge(selectedClient.status)}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowEditModal(selectedClient)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: theme.bgSecondary, color: theme.textSecondary, border: `1px solid ${theme.border}` }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                {selectedClient.status === 'invited' && (
                  <button 
                    onClick={() => handleResendInvite(selectedClient)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: theme.accentLight, color: theme.accent }}
                  >
                    <Mail size={14} /> Resend
                  </button>
                )}
                <button 
                  onClick={() => setShowDeleteConfirm(selectedClient)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Contact Info */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Contact Info
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail size={14} style={{ color: theme.textMuted }} />
                    <span style={{ color: theme.textPrimary }}>{selectedClient.email}</span>
                  </div>
                  {selectedClient.phone && (
                    <div className="flex items-center gap-3">
                      <Building size={14} style={{ color: theme.textMuted }} />
                      <span style={{ color: theme.textPrimary }}>{selectedClient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Clock size={14} style={{ color: theme.textMuted }} />
                    <span style={{ color: theme.textMuted }}>
                      Joined {formatDate(selectedClient.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Performance
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>Balance</div>
                    <div className="text-lg font-semibold" style={{ color: theme.textPrimary }}>{selectedClient.balance}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                    <div className="text-xs" style={{ color: theme.textMuted }}>P&L</div>
                    <div className="text-lg font-semibold" style={{ color: selectedClient.pnlPercent.startsWith('+') ? theme.positive : selectedClient.pnlPercent.startsWith('-') ? theme.negative : theme.textPrimary }}>
                      {selectedClient.pnl}
                      <span className="text-xs ml-1">{selectedClient.pnlPercent}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exchanges */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Exchanges ({selectedClient.connectors.length})
                </div>
                {selectedClient.connectors.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.connectors.map(conn => (
                      <div key={conn.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: theme.bgSecondary }}>
                        <Key size={14} style={{ color: theme.accent }} />
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                            {EXCHANGES.find(e => e.id === conn.exchange)?.name}
                          </div>
                          <div className="text-xs" style={{ color: theme.textMuted }}>{conn.label}</div>
                        </div>
                        <CheckCircle2 size={14} style={{ color: theme.positive }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm p-3 rounded-xl text-center" style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                    No exchanges configured
                  </div>
                )}
              </div>

              {/* Tokens */}
              <div>
                <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.05em' }}>
                  Trading Pairs ({selectedClient.tokens.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.tokens.map((token, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium"
                          style={{ background: theme.bgSecondary, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>
                      {token}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="w-96 rounded-xl flex items-center justify-center"
            style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}
          >
            <div className="text-center" style={{ color: theme.textMuted }}>
              <Users size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Select a client to view details</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative w-full max-w-md p-6 rounded-2xl" style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <AlertCircle size={24} style={{ color: theme.negative }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Delete Client?</h3>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
                Are you sure you want to delete <strong>{showDeleteConfirm.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: theme.bgSecondary, color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white"
                  style={{ background: theme.negative }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== CLIENT DASHBOARD (View for clients) ==========
function ClientDashboard({ user, theme, isDark }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome back! I can help you check your balances, view P&L, and monitor your portfolio. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Client's assigned tokens
  const clientTokens = ['SHARP/USDT', 'BTC/USDT'];
  const clientData = {
    balance: '$124,500',
    pnl: '+$8,420',
    pnlPercent: '+7.2%',
    tokens: clientTokens
  };

  const quickPrompts = ["Show my balances", "My P&L today", "SHARP/USDT price", "Trade history"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    
    setTimeout(() => {
      let response = { role: 'assistant', content: '', data: null };
      
      if (userInput.toLowerCase().includes('balance')) {
        response.content = "Here are your current balances:";
        response.data = { type: 'balances', tokens: clientTokens.map(t => ({ pair: t, balance: Math.random() * 10000, value: `$${(Math.random() * 50000).toFixed(2)}` })) };
      } else if (userInput.toLowerCase().includes('price') || userInput.toLowerCase().includes('sharp')) {
        response.content = "Here's the current price:";
        response.data = { type: 'price', pair: 'SHARP/USDT', price: '$0.006757', change: '+2.4%' };
      } else if (userInput.toLowerCase().includes('p&l') || userInput.toLowerCase().includes('pnl')) {
        response.content = `Your current P&L is ${clientData.pnl} (${clientData.pnlPercent}) this week.`;
      } else {
        response.content = `I'll look into that for you. Your assigned trading pairs are: ${clientTokens.join(', ')}`;
      }
      
      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <Sparkles size={20} style={{ color: theme.accent }} />
          <span className="text-lg font-semibold" style={{ color: theme.textPrimary }}>AI Trading Assistant</span>
        </div>

        {/* Your Tokens */}
        <div className="mb-6 p-4 rounded-xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
          <div className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted }}>Your Trading Pairs</div>
          <div className="flex flex-wrap gap-2">
            {clientTokens.map((token, i) => (
              <span key={i} className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{ background: theme.accentLight, color: theme.accent }}>
                <Coins size={14} />
                {token}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pr-2 mb-4">
          {messages.map((msg, i) => (
            <div key={i} className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" 
                   style={{ background: msg.role === 'assistant' ? theme.accentLight : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: msg.role === 'assistant' ? theme.accent : 'white' }}>
                {msg.role === 'assistant' ? <Bot size={18} /> : <User size={18} />}
              </div>
              <div className="flex-1 p-4 rounded-2xl text-sm leading-relaxed"
                   style={{ background: msg.role === 'assistant' ? theme.bgCard : (isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'), border: `1px solid ${msg.role === 'assistant' ? theme.border : 'rgba(99, 102, 241, 0.2)'}`, color: theme.textSecondary }}>
                {msg.content}
                {msg.data?.type === 'price' && (
                  <div className="mt-3 p-4 rounded-xl" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold" style={{ color: theme.textPrimary }}>{msg.data.pair}</span>
                      <span className="text-xs font-medium flex items-center gap-1" style={{ color: theme.positive }}>
                        <ArrowUpRight size={14} />{msg.data.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: theme.textPrimary }}>{msg.data.price}</div>
                  </div>
                )}
                {msg.data?.type === 'balances' && (
                  <div className="mt-3 space-y-2">
                    {msg.data.tokens.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${theme.border}` }}>
                        <span className="font-medium" style={{ color: theme.textPrimary }}>{t.pair}</span>
                        <span style={{ color: theme.textSecondary }}>{t.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}><Bot size={18} /></div>
              <div className="p-4 rounded-2xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickPrompts.map((prompt, i) => (
            <button key={i} onClick={() => setInput(prompt)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all"
                    style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
              {prompt}<ChevronRight size={14} />
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex gap-3 p-4 rounded-2xl" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your balances, prices, or P&L..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: theme.textPrimary }}
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                  style={{ background: theme.accent, color: 'white' }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== ADD CLIENT MODAL ==========
function AddClientModal({ isOpen, onClose, onSave }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const [exchangeError, setExchangeError] = useState('');
  
  const [clientData, setClientData] = useState({ name: '', wallet_address: '', email: '', company: '', phone: '' });
  const [connectors, setConnectors] = useState([]);
  const [currentConnector, setCurrentConnector] = useState({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
  const [tokens, setTokens] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setStep(1);
    setClientData({ name: '', wallet_address: '', email: '', company: '', phone: '' });
    setConnectors([]);
    setCurrentConnector({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
    setTokens('');
    setNotes('');
    setShowSuccess(false);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const addConnector = () => {
    // Validate required fields
    if (!currentConnector.exchange) {
      setExchangeError('Please select an exchange');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    if (!currentConnector.apiKey) {
      setExchangeError('Please enter an API key');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    if (!currentConnector.apiSecret) {
      setExchangeError('Please enter an API secret');
      setTimeout(() => setExchangeError(''), 3000);
      return;
    }
    
    // Add connector
    const exchangeName = EXCHANGES.find(e => e.id === currentConnector.exchange)?.name || currentConnector.exchange;
    setConnectors([...connectors, { ...currentConnector, id: Date.now() }]);
    setCurrentConnector({ exchange: '', apiKey: '', apiSecret: '', memo: '', label: '' });
    
    // Show success message
    setExchangeSuccess(true);
    setExchangeError('');
    setTimeout(() => setExchangeSuccess(false), 3000);
  };

  const removeConnector = (id) => setConnectors(connectors.filter(c => c.id !== id));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Import API URL from config (handles runtime detection)
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        alert('No authentication token found. Please log in again.');
        setIsSubmitting(false);
        return;
      }
      
      // Validate wallet address format
      // Validate wallet address (EVM or Solana)
      const isEVM = clientData.wallet_address.match(/^0x[a-fA-F0-9]{40}$/);
      const isSolana = clientData.wallet_address.length >= 32 && clientData.wallet_address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(clientData.wallet_address);
      
      if (!clientData.wallet_address || (!isEVM && !isSolana)) {
        alert('Please enter a valid wallet address:\n- EVM: 0x followed by 40 hex characters\n- Solana: 32-44 base58 characters');
        setIsSubmitting(false);
        return;
      }
      
      // Call backend API to create client
      const requestBody = {
        name: clientData.name,
        wallet_address: clientData.wallet_address,
        email: clientData.email || null,
        status: 'Active'
      };
      
      console.log('Creating client with:', requestBody);
      console.log('API URL:', `${API_URL}/api/admin/quick-client`);
      console.log('Token present:', !!token);
      
      // Use the production-ready quick-client endpoint
      const response = await fetch(`${API_URL}/api/admin/quick-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: clientData.name,
          wallet_address: clientData.wallet_address,
          email: clientData.email || null,
          tier: 'Standard'
        })
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        let errorMessage = 'Failed to create client';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || `Server returned ${response.status}`;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const newClient = await response.json();
      
      // If connectors were added, add them via API keys endpoint
      if (connectors.length > 0 && newClient.id) {
        for (const connector of connectors) {
          try {
            await fetch(`${API_URL}/api/admin/api-keys`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                client_id: newClient.id,
                exchange: connector.exchange,
                api_key: connector.apiKey,
                api_secret: connector.apiSecret,
                passphrase: connector.memo || null
              })
            });
          } catch (err) {
            console.error('Failed to add API key:', err);
          }
        }
      }
      
      onSave?.(newClient);
      setIsSubmitting(false);
      setShowSuccess(true);
    } catch (error) {
      console.error('Client creation error:', error);
      const errorMessage = error?.message || error?.detail || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Failed to create client';
      alert(`Error: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  const selectedExchange = EXCHANGES.find(e => e.id === currentConnector.exchange);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={handleClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl"
           style={{ background: theme.bgPrimary, boxShadow: theme.shadowXl, border: `1px solid ${theme.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.border }}>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
              {showSuccess ? 'Client Added!' : 'Add New Client'}
            </h2>
            {!showSuccess && (
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                Step {step} of 3 — {step === 1 ? 'Client Info' : step === 2 ? 'Exchange Setup' : 'Review & Invite'}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg transition-all" style={{ color: theme.textMuted }}><X size={20} /></button>
        </div>

        {/* Progress */}
        {!showSuccess && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className="h-1 flex-1 rounded-full transition-all" style={{ background: s <= step ? theme.accent : theme.border }} />
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: theme.accentLight, color: theme.accent }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: theme.textPrimary }}>Client Created!</h3>
              <p className="text-sm mb-6" style={{ color: theme.textMuted }}>
                Client <strong>{clientData.name}</strong> has been created with wallet address:
                <br />
                <strong className="font-mono text-xs">{clientData.wallet_address}</strong>
                <br /><br />
                They can now log in using their wallet.
              </p>
              <button onClick={handleClose} className="px-6 py-2.5 rounded-xl font-medium" style={{ background: theme.accent, color: 'white' }}>Done</button>
            </div>
          ) : (
            <>
              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Full Name *</label>
                    <input type="text" value={clientData.name} onChange={e => setClientData({ ...clientData, name: e.target.value })} placeholder="John Smith"
                           className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
                      Wallet Address (EVM) *
                      <span className="ml-2 text-xs font-normal" style={{ color: theme.textMuted }}>(Client will login with this wallet)</span>
                    </label>
                    <div className="relative">
                      <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
                      <input type="text" value={clientData.wallet_address} onChange={e => setClientData({ ...clientData, wallet_address: e.target.value })} placeholder="0x..."
                             className="w-full py-3 pl-11 pr-4 rounded-xl text-sm outline-none font-mono" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>Enter the client's Ethereum wallet address (MetaMask, Phantom, etc.)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Email Address (Optional)</label>
                      <input type="email" value={clientData.email} onChange={e => setClientData({ ...clientData, email: e.target.value })} placeholder="john@company.com"
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>For notifications only</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Company</label>
                      <input type="text" value={clientData.company} onChange={e => setClientData({ ...clientData, company: e.target.value })} placeholder="Company Inc."
                             className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Phone</label>
                    <input type="tel" value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                           className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Assigned Tokens</label>
                    <input type="text" value={tokens} onChange={e => setTokens(e.target.value)} placeholder="SHARP/USDT, BTC/USDT, ETH/USDT"
                           className="w-full py-3 px-4 rounded-xl text-sm outline-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>Comma-separated list of trading pairs this client can view</p>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  {connectors.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>Configured Exchanges</label>
                      {connectors.map(conn => (
                        <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}><Key size={16} /></div>
                            <div>
                              <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>{EXCHANGES.find(e => e.id === conn.exchange)?.name}</div>
                              <div className="text-xs" style={{ color: theme.textMuted }}>{conn.label || `API Key: ${conn.apiKey.slice(0, 8)}...`}</div>
                            </div>
                          </div>
                          <button onClick={() => removeConnector(conn.id)} className="p-2 rounded-lg" style={{ color: theme.negative }}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-4 rounded-xl space-y-4" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="text-sm font-medium" style={{ color: theme.textPrimary }}>Add Exchange Connection</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Exchange *</label>
                        <select value={currentConnector.exchange} onChange={e => setCurrentConnector({ ...currentConnector, exchange: e.target.value })}
                                className="w-full py-2.5 px-3 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                                style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }}>
                          <option value="">Select exchange...</option>
                          {EXCHANGES.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Label</label>
                        <input type="text" value={currentConnector.label} onChange={e => setCurrentConnector({ ...currentConnector, label: e.target.value })} placeholder="Main Account"
                               className="w-full py-2.5 px-3 rounded-lg text-sm outline-none" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>API Key *</label>
                      <input type="text" value={currentConnector.apiKey} onChange={e => setCurrentConnector({ ...currentConnector, apiKey: e.target.value })} placeholder="Enter API key"
                             className="w-full py-2.5 px-3 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>API Secret *</label>
                      <div className="relative">
                        <input type={showApiSecret ? 'text' : 'password'} value={currentConnector.apiSecret} onChange={e => setCurrentConnector({ ...currentConnector, apiSecret: e.target.value })} placeholder="Enter API secret"
                               className="w-full py-2.5 px-3 pr-10 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                        <button type="button" onClick={() => setShowApiSecret(!showApiSecret)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }}>
                          {showApiSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    {selectedExchange?.requiresMemo && (
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: theme.textMuted }}>Memo / Passphrase</label>
                        <input type="text" value={currentConnector.memo} onChange={e => setCurrentConnector({ ...currentConnector, memo: e.target.value })} placeholder="Enter memo"
                               className="w-full py-2.5 px-3 rounded-lg text-sm outline-none font-mono" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                      </div>
                    )}
                    <button onClick={addConnector} disabled={!currentConnector.exchange || !currentConnector.apiKey || !currentConnector.apiSecret}
                            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: theme.accent, color: 'white' }}>
                      <Plus size={16} />Add Exchange
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl" style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}` }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold" style={{ background: theme.accent, color: 'white' }}>
                        {clientData.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: theme.textPrimary }}>{clientData.name}</div>
                        <div className="text-sm font-mono" style={{ color: theme.textMuted }}>{clientData.wallet_address || 'No wallet address'}</div>
                        {clientData.email && <div className="text-xs mt-1" style={{ color: theme.textMuted }}>{clientData.email}</div>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs uppercase font-medium mb-1" style={{ color: theme.textMuted }}>Company</div>
                        <div style={{ color: theme.textPrimary }}>{clientData.company || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase font-medium mb-1" style={{ color: theme.textMuted }}>Exchanges</div>
                        <div style={{ color: theme.textPrimary }}>{connectors.length} configured</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Assigned Tokens</div>
                    <div className="flex flex-wrap gap-2">
                      {tokens ? tokens.split(',').map((token, i) => (
                        <span key={i} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: theme.bgSecondary, color: theme.textPrimary, border: `1px solid ${theme.border}` }}>{token.trim()}</span>
                      )) : <span className="text-sm" style={{ color: theme.textMuted }}>No tokens assigned</span>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Internal Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..." rows={3}
                              className="w-full py-3 px-4 rounded-xl text-sm outline-none resize-none" style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }} />
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: theme.accentLight }}>
                    <div className="flex items-center gap-2 mb-2"><Wallet size={16} style={{ color: theme.accent }} /><span className="text-sm font-medium" style={{ color: theme.accent }}>Wallet Authentication</span></div>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      The client will log in using their wallet address: <strong className="font-mono">{clientData.wallet_address}</strong>
                      <br />
                      They'll connect their wallet and sign a message to authenticate (no password needed).
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!showSuccess && (
          <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: theme.border }}>
            <button onClick={() => step > 1 ? setStep(step - 1) : handleClose()} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()} disabled={(step === 1 && (!clientData.name || !clientData.wallet_address)) || isSubmitting}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-2" style={{ background: theme.accent, color: 'white' }}>
              {isSubmitting ? <><RefreshCw size={16} className="animate-spin" />Sending...</> : step === 3 ? <><Send size={16} />Send Invite</> : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== LOGIN PAGE ==========
function Login({ onLogin }) {
  const { theme, isDark } = useContext(ThemeContext);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Import BrowserProvider dynamically to avoid SSR issues
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      // Dynamic import of ethers
      const { BrowserProvider } = await import('ethers');
      
      // Detect wallet
      let wallet = null;
      if (window.ethereum) {
        if (window.ethereum.isMetaMask) wallet = { name: 'MetaMask', provider: window.ethereum };
        else if (window.ethereum.isPhantom) wallet = { name: 'Phantom', provider: window.ethereum };
        else if (window.ethereum.isCoinbaseWallet) wallet = { name: 'Coinbase Wallet', provider: window.ethereum };
        else if (window.ethereum.isTrust) wallet = { name: 'Trust Wallet', provider: window.ethereum };
        else wallet = { name: 'Ethereum Wallet', provider: window.ethereum };
      }
      
      if (!wallet) {
        setError('No wallet detected. Please install MetaMask, Phantom, or another EVM-compatible wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallet.name}...`);
      
      // Request account access
      const provider = new BrowserProvider(wallet.provider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const walletAddress = accounts[0];
      
      // Get nonce/message from backend
      setStatus('Getting authentication message...');
      const nonceRes = await fetch(`${API_URL}/api/auth/nonce/${walletAddress}`);
      
      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication message from server');
      }

      const { message } = await nonceRes.json();

      // Sign message
      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send to backend for verification
      setStatus('Verifying signature...');
      const res = await fetch(`${API_URL}/api/auth/wallet/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet_address: walletAddress, 
          message, 
          signature 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.detail || 'Login failed';
        
        // Show user-friendly error for unregistered wallets
        if (errorMessage.includes('not registered') || errorMessage.includes('Wallet address not registered')) {
          throw new Error(
            `❌ Wallet address not registered.\n\n` +
            `Your wallet address must be registered by an admin before you can log in.\n\n` +
            `Wallet Address: ${walletAddress}\n\n` +
            `Please contact your admin to create your account. Once registered, you can log in with this wallet.`
          );
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Store token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call onLogin callback with user data - IMPORTANT: Use exact role from backend
      const userData = {
        email: data.user?.email,
        wallet_address: data.user?.wallet_address || walletAddress,
        role: data.user?.role || data.role || 'client', // Check both places
        id: data.user?.id
      };
      
      console.log('Login response:', data); // Debug log
      console.log('User role:', userData.role); // Debug log
      
      onLogin(userData);

    } catch (e) {
      setError(e.message || 'Failed to connect wallet');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300" 
         style={{ background: isDark ? '#0a0f1a' : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)', fontFamily: "'Inter', sans-serif" }}>
      {!isDark && <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`, backgroundSize: '48px 48px' }} />}
      {isDark && <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 20% 20%, rgba(94, 234, 212, 0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(45, 212, 191, 0.08) 0%, transparent 50%)` }} />}
      
      <div className="relative w-full max-w-md p-10 mx-4 rounded-2xl transition-all duration-300"
           style={{ background: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff', border: `1px solid ${theme.border}`, boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.4)' : '0 25px 50px rgba(0,0,0,0.1)' }}>
        <div className="text-center mb-9">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-2xl" style={{ background: theme.logoBg, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>P</div>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: theme.textPrimary }}>Pipe Labs</h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>AI-Powered Trading Platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-5 p-4 rounded-xl text-sm" 
               style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
            <p style={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>{error}</p>
          </div>
        )}

        {/* Status Message */}
        {status && !error && (
          <div className="mb-5 p-3 rounded-xl text-sm text-center" 
               style={{ background: theme.accentLight, color: theme.accent }}>
            {status}
          </div>
        )}

        {/* Connect Wallet Button */}
        <button 
          onClick={connectWallet} 
          disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            background: loading ? '#4b5563' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            boxShadow: loading ? 'none' : '0 4px 16px rgba(102, 126, 234, 0.4)' 
          }}>
          {status || (loading ? 'Connecting...' : '🔐 Connect Wallet')}
        </button>

        {/* Supported Wallets Info */}
        <div className="mt-6 text-center">
          <p className="text-xs font-medium mb-2" style={{ color: theme.textMuted }}>Supported Wallets:</p>
          <p className="text-xs" style={{ color: theme.textMuted }}>
            MetaMask • Phantom • Coinbase Wallet • Trust Wallet • WalletConnect
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 rounded-xl text-xs" 
             style={{ background: theme.accentLight, border: `1px solid ${theme.border}`, color: theme.textSecondary }}>
          <p className="font-semibold mb-2" style={{ color: theme.accent }}>ℹ️ How it works:</p>
          <p className="mb-1">1. Click "Connect Wallet" to connect your wallet</p>
          <p className="mb-1">2. Approve the connection request</p>
          <p className="mb-1">3. Sign the authentication message (no gas fees)</p>
          <p className="mt-2 font-semibold" style={{ color: theme.accent }}>Note: Your wallet address must be registered by an admin.</p>
        </div>
      </div>
    </div>
  );
}

// ========== METRIC CARD ==========
function MetricCard({ icon, label, value, subvalue, positive, onClick }) {
  const { theme } = useContext(ThemeContext);
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

// ========== ADMIN DASHBOARD ==========
function AdminDashboard({ user, onLogout, theme, isDark, toggleTheme }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: "Welcome back. I can help you manage clients, monitor bots, and analyze performance across your platform." }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showClientManagement, setShowClientManagement] = useState(false);
  const [clients, setClients] = useState(MOCK_CLIENTS);
  const messagesEndRef = useRef(null);

  const metrics = { clients: clients.length, volume: '$2.4M', pnl: '+$45,230', pnlPct: '+12.5%', bots: 34 };
  const quickPrompts = ["Show all client balances", "Global P&L this week", "List active bots", "SHARP/USDT price"];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setIsLoading(true);
    setTimeout(() => {
      const isPrice = userInput.toLowerCase().includes('price') || userInput.toLowerCase().includes('sharp');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isPrice ? "Here's the current price from BitMart:" : `Processing: "${userInput}"`,
        data: isPrice ? { type: 'price', pair: 'SHARP/USDT', price: '$0.006757', change: '+2.4%' } : null
      }]);
      setIsLoading(false);
    }, 800);
  };

  const handleAddClient = (newClient) => setClients([...clients, newClient]);

  if (showClientManagement) {
    return (
      <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
        <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} onSave={handleAddClient} />
        <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
            <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
          </div>
          <button onClick={() => setShowClientManagement(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                  style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
            <MessageSquare size={16} />AI Assistant
          </button>
          <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-8"
                  style={{ background: theme.accentLight, color: theme.accent }}>
            <Users size={16} />Clients
          </button>
          <div className="flex-1" />
          <button onClick={toggleTheme} className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-3"
                  style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
            <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark' : 'Light'}</span>
            <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
            </div>
          </button>
          <div className="flex items-center gap-2.5 pt-3" style={{ borderTop: `1px solid ${theme.border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin</div>
              <div className="text-xs" style={{ color: theme.textMuted }}>{user.email}</div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
          </div>
        </aside>
        <ClientManagement onBack={() => setShowClientManagement(false)} onAddClient={() => setShowAddClient(true)} clients={clients} setClients={setClients} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
      <AddClientModal isOpen={showAddClient} onClose={() => setShowAddClient(false)} onSave={handleAddClient} />
      
      <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
            <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
          </div>
          <span className="text-xs font-semibold uppercase px-2 py-1 rounded" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#d97706' }}>Admin</span>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Overview</h3>
          <MetricCard icon={<Users size={16} />} label="Clients" value={metrics.clients} onClick={() => setShowClientManagement(true)} />
          <MetricCard icon={<BarChart3 size={16} />} label="Volume (7d)" value={metrics.volume} />
          <MetricCard icon={<TrendingUp size={16} />} label="P&L (7d)" value={metrics.pnl} subvalue={metrics.pnlPct} positive />
          <MetricCard icon={<Activity size={16} />} label="Active Bots" value={metrics.bots} />
        </div>

        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Quick Actions</h3>
          <button onClick={() => setShowAddClient(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium mb-2"
                  style={{ background: theme.accent, color: 'white' }}><Plus size={16} />Add Client</button>
          <button onClick={() => setShowClientManagement(true)} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                  style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><Users size={16} />Manage Clients</button>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><BarChart3 size={16} />View Reports</button>
        </div>

        <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
          <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                  style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
            <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
              <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
            </div>
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: '#d97706' }}>A</div>
              <div className="flex flex-col">
                <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Admin User</span>
                <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
              </div>
            </div>
            <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col p-6">
        <div className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-2.5 mb-6">
            <Sparkles size={20} style={{ color: theme.accent }} />
            <span className="text-lg font-semibold" style={{ color: theme.textPrimary }}>AI Trading Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 mb-4" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {messages.map((msg, i) => <Message key={i} message={msg} theme={theme} isDark={isDark} />)}
            {isLoading && (
              <div className="flex gap-3 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: theme.accentLight, color: theme.accent }}><Bot size={18} /></div>
                <div className="p-4 rounded-2xl" style={{ background: theme.bgCard, border: `1px solid ${theme.border}` }}>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: theme.textMuted, animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {quickPrompts.map((prompt, i) => (
              <button key={i} onClick={() => setInput(prompt)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium"
                      style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.textSecondary }}>{prompt}<ChevronRight size={14} /></button>
            ))}
          </div>

          <div className="flex gap-3 p-4 rounded-2xl" style={{ background: theme.bgPrimary, border: `1px solid ${theme.border}`, boxShadow: theme.shadowLg }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()}
                   placeholder="Ask about balances, prices, P&L, or bots..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: theme.textPrimary }} />
            <button onClick={handleSend} disabled={!input.trim() || isLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    style={{ background: theme.accent, color: 'white' }}><Send size={18} /></button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-bounce { animation: bounce 1.4s infinite ease-in-out; }
        .animate-spin { animation: spin 1s linear infinite; }
        input::placeholder, textarea::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}

// ========== SIDEBAR (Client) ==========
function ClientSidebar({ user, theme, isDark, toggleTheme, onLogout }) {
  return (
    <aside className="w-64 flex flex-col p-5" style={{ background: theme.bgPrimary, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm" style={{ background: theme.logoBg }}>P</div>
          <span className="font-bold text-sm" style={{ color: theme.textPrimary }}>Pipe Labs</span>
        </div>
        <span className="text-xs font-semibold uppercase px-2 py-1 rounded" style={{ background: theme.accentLight, color: theme.accent }}>Client</span>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Overview</h3>
        <MetricCard icon={<Wallet size={16} />} label="Balance" value="$124,500" />
        <MetricCard icon={<TrendingUp size={16} />} label="P&L" value="+$8,420" subvalue="+7.2%" positive />
        <MetricCard icon={<Coins size={16} />} label="Tokens" value="2" />
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ color: theme.textMuted, letterSpacing: '0.1em' }}>Quick Actions</h3>
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-2"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><BarChart3 size={16} />View Reports</button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}><Settings size={16} />Settings</button>
      </div>

      <div className="pt-4 space-y-3" style={{ borderTop: `1px solid ${theme.border}` }}>
        <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm"
                style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}>
          <span className="flex items-center gap-2.5">{isDark ? <Moon size={16} /> : <Sun size={16} />}{isDark ? 'Dark Mode' : 'Light Mode'}</span>
          <div className="w-9 h-5 rounded-full relative" style={{ background: isDark ? theme.accent : '#cbd5e1' }}>
            <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm" style={{ left: isDark ? '18px' : '2px' }} />
          </div>
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold" style={{ background: theme.accent }}>C</div>
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: theme.textPrimary }}>Client User</span>
              <span className="text-xs" style={{ color: theme.textMuted }}>{user.email}</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg" style={{ color: theme.textMuted }}><LogOut size={16} /></button>
        </div>
      </div>
    </aside>
  );
}

// ========== APP ==========
export default function App() {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const theme = isDark ? themes.dark : themes.light;
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {!user ? (
        <Login onLogin={setUser} />
      ) : user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={() => setUser(null)} theme={theme} isDark={isDark} toggleTheme={toggleTheme} />
      ) : (
        <div className="flex min-h-screen" style={{ background: theme.bgSecondary, fontFamily: "'Inter', sans-serif" }}>
          <ClientSidebar user={user} theme={theme} isDark={isDark} toggleTheme={toggleTheme} onLogout={() => setUser(null)} />
          <ClientDashboard user={user} theme={theme} isDark={isDark} />
        </div>
      )}
    </ThemeContext.Provider>
  );
}
