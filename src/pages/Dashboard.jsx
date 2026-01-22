import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import MetricsBar from '../components/MetricsBar';
import SavedPrompts from '../components/SavedPrompts';
import AIConsole from '../components/AIConsole';
import QuickActions from '../components/QuickActions';
import { 
  PanelLeftClose, 
  PanelLeft,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [savedPrompts, setSavedPrompts] = useState([]);
  const aiConsoleRef = useRef(null);

  const handleSelectPrompt = (query) => {
    // Trigger the AI console to send this query
    if (aiConsoleRef.current) {
      aiConsoleRef.current.sendMessage(query);
    }
  };

  const handleSavePrompt = (content) => {
    const newPrompt = {
      id: Date.now().toString(),
      title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
      query: content,
      pinned: false
    };
    setSavedPrompts(prev => [newPrompt, ...prev]);
  };

  const handleDeletePrompt = (id) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  const handleQuickAction = (query) => {
    handleSelectPrompt(query);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      
      <div className="pt-16 flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        {sidebarOpen && (
          <SavedPrompts
            prompts={savedPrompts}
            onSelect={handleSelectPrompt}
            onDelete={handleDeletePrompt}
            onAddNew={() => {}}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toggle Sidebar Button */}
          <div className="p-4 pb-0 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={20} className="text-dark-400" />
              ) : (
                <PanelLeft size={20} className="text-dark-400" />
              )}
            </button>
            
            <div className="flex items-center gap-2 text-dark-400">
              <Sparkles size={16} className="text-primary-400" />
              <span className="text-sm">
                {isAdmin ? 'Admin Console' : `${user?.name}'s Dashboard`}
              </span>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            {/* Metrics */}
            <MetricsBar />

            {/* Quick Actions (collapsed by default, shown above chat) */}
            <div className="mb-4">
              <QuickActions onAction={handleQuickAction} />
            </div>

            {/* AI Console */}
            <div className="flex-1 min-h-0">
              <AIConsoleWrapper 
                ref={aiConsoleRef}
                onSavePrompt={handleSavePrompt}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper to expose sendMessage method
const AIConsoleWrapper = React.forwardRef(({ onSavePrompt }, ref) => {
  const [sendMessage, setSendMessage] = useState(null);

  React.useImperativeHandle(ref, () => ({
    sendMessage: (query) => {
      if (sendMessage) {
        sendMessage(query);
      }
    }
  }));

  return (
    <AIConsoleWithRef 
      onSavePrompt={onSavePrompt}
      onSendMessageReady={(fn) => setSendMessage(() => fn)}
    />
  );
});

// Modified AIConsole that exposes sendMessage
function AIConsoleWithRef({ onSavePrompt, onSendMessageReady }) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);

  // Expose sendMessage function
  React.useEffect(() => {
    if (onSendMessageReady) {
      onSendMessageReady(handleSend);
    }
  }, []);

  // Initial greeting
  React.useEffect(() => {
    const greeting = {
      id: Date.now(),
      role: 'assistant',
      content: isAdmin 
        ? `Welcome back! I'm your trading assistant. I can help you manage all clients, monitor bots, analyze performance, and execute trades across your platform.\n\nTry asking me about client balances, P&L reports, or bot status.`
        : `Hello ${user?.name || 'there'}! I'm your trading assistant. I can help you check your token prices, view P&L, monitor your bots, and more.\n\nWhat would you like to know about your portfolio?`,
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
  }, [isAdmin, user?.name]);

  // Auto-scroll
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://backend-pipelabs-dashboard-production.up.railway.app'}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        actions: data.actions_taken,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-900 rounded-xl border border-dark-700 overflow-hidden h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-3 message-enter ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-dark-600' : 'bg-primary-600'
            }`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className={`max-w-[75%] rounded-xl p-4 ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white rounded-tr-none' 
                : msg.isError
                  ? 'bg-red-900/30 text-red-200 rounded-tl-none'
                  : 'bg-dark-800 text-dark-100 rounded-tl-none'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.actions.map((action, i) => (
                    <span key={i} className="px-2 py-1 bg-dark-700 rounded text-xs text-dark-300">
                      {action.tool || 'action'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">🤖</div>
            <div className="bg-dark-800 rounded-xl rounded-tl-none p-4">
              <div className="flex gap-1">
                <span className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isAdmin ? "Ask about any client, token, or bot..." : "Ask about your portfolio..."}
            className="flex-1 bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="px-6 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 text-white rounded-xl transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}


