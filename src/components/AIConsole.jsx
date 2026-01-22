import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  Paperclip, 
  Bot,
  User,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { agentAPI } from '../services/api';
import { 
  PriceCard, 
  PerformanceCard, 
  BotCard, 
  TableCard,
  ActionCard,
  TextCard
} from './ResponseCard';

export default function AIConsole({ onSavePrompt }) {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const greeting = {
      id: Date.now(),
      role: 'assistant',
      content: isAdmin 
        ? `Welcome back! I'm your trading assistant. I can help you manage all clients, monitor bots, analyze performance, and execute trades across your platform.\n\nWhat would you like to do?`
        : `Hello ${user?.name || 'there'}! I'm your trading assistant. I can help you check your token prices, view P&L, monitor your bots, and more.\n\nWhat would you like to know?`,
      timestamp: new Date().toISOString()
    };
    setMessages([greeting]);
  }, [isAdmin, user?.name]);

  const handleSend = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Call the backend
      const response = await agentAPI.sendMessage(messageText);
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        actions: response.actions_taken,
        data: parseResponseData(response),
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Send error:', err);
      setError('Failed to send message. Please try again.');
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        isError: true,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Parse response to detect card types
  const parseResponseData = (response) => {
    const data = {};
    
    if (response.actions_taken && response.actions_taken.length > 0) {
      const action = response.actions_taken[0];
      
      if (action.tool === 'get_prices' && action.result) {
        const prices = action.result.prices || action.result;
        if (prices) {
          const pair = Object.keys(prices)[0];
          if (pair && prices[pair]) {
            data.type = 'price';
            data.card = {
              token: pair.split('-')[0],
              pair: pair,
              price: prices[pair].price,
              exchange: action.input?.connector_name || 'exchange',
              change: 0 // Would come from additional data
            };
          }
        }
      }
      
      if (action.tool === 'get_portfolio' && action.result) {
        data.type = 'table';
        data.card = {
          title: 'Portfolio Balances',
          columns: ['Asset', 'Balance', 'Value'],
          rows: Object.entries(action.result.balances || {}).map(([asset, balance]) => [
            asset, 
            balance.total?.toFixed(4) || '0', 
            `$${(balance.total * 100).toFixed(2)}`
          ])
        };
      }
    }
    
    return data;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSave = (messageContent) => {
    if (onSavePrompt) {
      onSavePrompt(messageContent);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-dark-950 rounded-xl border border-dark-700 overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            onSave={handleSave}
          />
        ))}
        
        {loading && (
          <div className="flex items-start gap-3 message-enter">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-dark-800 rounded-xl rounded-tl-none p-4">
              <div className="flex items-center gap-2">
                <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
                <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
                <div className="typing-dot w-2 h-2 bg-primary-400 rounded-full" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAdmin ? "Ask about any client, token, or bot..." : "Ask about your portfolio..."}
              className="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 pr-12 text-white placeholder-dark-400 focus:outline-none focus:border-primary-500 resize-none"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-primary-600 hover:bg-primary-700 disabled:bg-dark-700 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors"
          >
            {loading ? (
              <Loader2 size={20} className="text-white animate-spin" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-dark-500">
          <span>Press Enter to send</span>
          <span>•</span>
          <span>Shift+Enter for new line</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, onSave }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <div className={`flex items-start gap-3 message-enter ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser 
          ? 'bg-dark-600' 
          : isError 
            ? 'bg-red-600' 
            : 'bg-primary-600'
      }`}>
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Bot size={16} className="text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-xl p-4 ${
          isUser 
            ? 'bg-primary-600 text-white rounded-tr-none' 
            : isError
              ? 'bg-red-900/30 text-red-200 rounded-tl-none border border-red-800/50'
              : 'bg-dark-800 text-dark-100 rounded-tl-none'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {/* Action chips */}
          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.actions.map((action, i) => (
                <span 
                  key={i}
                  className="px-2 py-1 bg-dark-700 rounded text-xs text-dark-300"
                >
                  {action.tool || 'action'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rich Card Rendering */}
        {message.data?.type === 'price' && (
          <div className="mt-3">
            <PriceCard 
              data={message.data.card}
              onSave={() => onSave(message.content)}
              onDownload={() => console.log('Download price data')}
            />
          </div>
        )}

        {message.data?.type === 'performance' && (
          <div className="mt-3">
            <PerformanceCard 
              data={message.data.card}
              onSave={() => onSave(message.content)}
              onDownload={() => console.log('Download performance data')}
            />
          </div>
        )}

        {message.data?.type === 'bot' && (
          <div className="mt-3">
            <BotCard 
              data={message.data.card}
              onStart={() => console.log('Start bot')}
              onStop={() => console.log('Stop bot')}
              onAdjust={() => console.log('Adjust bot')}
            />
          </div>
        )}

        {message.data?.type === 'table' && (
          <div className="mt-3">
            <TableCard 
              {...message.data.card}
              onDownload={() => console.log('Download table')}
            />
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-xs text-dark-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}
