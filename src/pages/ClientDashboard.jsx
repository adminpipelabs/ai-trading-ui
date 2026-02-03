import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BotList } from '../components/BotList';
import ClientBotSetup from '../components/ClientBotSetup';
import KeyManagement from '../components/KeyManagement';
import { tradingBridge } from '../services/api';
import { Bot, LogOut, RefreshCw } from 'lucide-react';

const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [clientBots, setClientBots] = useState([]);
  const [keyStatus, setKeyStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [error, setError] = useState(null);

  // Get client info from localStorage
  useEffect(() => {
    const loadClient = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
        if (!userStr) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(userStr);
        const walletAddress = user.wallet_address || user.wallet;
        
        if (!walletAddress) {
          setError('No wallet address found. Please log in again.');
          return;
        }

        // Get client by wallet address
        try {
          const { adminAPI } = await import('../services/api');
          const clients = await adminAPI.getClients();
          const foundClient = clients.find(c => 
            c.wallet_address?.toLowerCase() === walletAddress.toLowerCase() ||
            c.wallets?.some(w => w.address?.toLowerCase() === walletAddress.toLowerCase())
          );

          if (!foundClient) {
            setError('Client account not found. Please contact support.');
            return;
          }

          setClient(foundClient);

          // Fetch key status
          try {
            const status = await tradingBridge.getClientKeyStatus(foundClient.id);
            setKeyStatus(status);
          } catch (e) {
            console.error('Failed to fetch key status:', e);
            setKeyStatus({ has_key: false });
          }

          // Fetch bots for this client
          try {
            const bots = await tradingBridge.getBots(foundClient.account_identifier);
            const botsList = Array.isArray(bots) ? bots : (bots.bots || []);
            setClientBots(botsList.filter(bot => bot.client_id === foundClient.id || bot.account === foundClient.account_identifier));
          } catch (e) {
            console.error('Failed to fetch bots:', e);
            setClientBots([]);
          }
        } catch (e) {
          console.error('Failed to load client:', e);
          setError('Failed to load client data. Please try again.');
        }
      } catch (e) {
        console.error('Failed to parse user:', e);
        setError('Failed to load user data. Please log in again.');
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('pipelabs_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('pipelabs_token');
    navigate('/login');
  };

  const handleBotCreated = async () => {
    // Refresh bots and key status
    if (client) {
      try {
        const bots = await tradingBridge.getBots(client.account_identifier);
        const botsList = Array.isArray(bots) ? bots : (bots.bots || []);
        setClientBots(botsList.filter(bot => bot.client_id === client.id || bot.account === client.account_identifier));
        
        const status = await tradingBridge.getClientKeyStatus(client.id);
        setKeyStatus(status);
        setShowKeyInput(false);
      } catch (e) {
        console.error('Failed to refresh after bot creation:', e);
      }
    }
  };

  const handleKeyRotated = async () => {
    if (client) {
      try {
        const status = await tradingBridge.getClientKeyStatus(client.id);
        setKeyStatus(status);
      } catch (e) {
        console.error('Failed to refresh key status:', e);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <RefreshCw size={32} className="animate-spin" style={{ color: '#2563eb' }} />
        <p style={{ color: '#6b7280' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
        padding: '24px'
      }}>
        <div style={{ 
          padding: '24px', 
          borderRadius: '12px', 
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '8px' }}>Error</h2>
          <p style={{ color: '#991b1b', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <p style={{ color: '#6b7280' }}>Client account not found.</p>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#2563eb',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  const hasConnectedKey = keyStatus?.has_key || false;
  const clientChain = client.chain || (client.wallets?.[0]?.chain) || 'solana';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
            Welcome, {client.name}
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0 0' }}>
            {client.account_identifier}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: 'white',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Connect Wallet Key Prompt */}
        {!hasConnectedKey && clientBots.length > 0 && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fbbf2440',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px' }}>
                ⚠️ Connect your trading wallet
              </strong>
              <p style={{ color: '#78350f', margin: 0, fontSize: '14px' }}>
                Your bot needs a trading wallet to operate. Input your private key to get started.
              </p>
            </div>
            <button
              onClick={() => setShowKeyInput(true)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#f59e0b',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Connect Wallet Key
            </button>
          </div>
        )}

        {/* Bot Setup Wizard (if no bots) */}
        {clientBots.length === 0 && !showKeyInput ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Bot size={48} style={{ color: '#2563eb', marginBottom: '16px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
                Set Up Your Trading Bot
              </h2>
              <p style={{ color: '#64748b', fontSize: '16px' }}>
                Get started by creating your first trading bot
              </p>
            </div>
            <ClientBotSetup
              clientId={client.id}
              chain={clientChain}
              onBotCreated={handleBotCreated}
            />
          </div>
        ) : showKeyInput ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <button
                onClick={() => setShowKeyInput(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#64748b',
                  cursor: 'pointer',
                  marginBottom: '16px'
                }}
              >
                ← Back
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>
                Connect Trading Wallet
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                Enter your private key to connect your trading wallet. Your key will be encrypted and stored securely.
              </p>
            </div>
            <ClientBotSetup
              clientId={client.id}
              chain={clientChain}
              onBotCreated={handleBotCreated}
            />
          </div>
        ) : (
          <>
            {/* Bot List */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                  Your Bots ({clientBots.length})
                </h2>
                <button
                  onClick={() => setShowKeyInput(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  <Bot size={16} />
                  Add Bot
                </button>
              </div>
              <BotList 
                bots={clientBots} 
                account={client.account_identifier}
                readOnly={false}
              />
            </div>

            {/* Key Management */}
            {hasConnectedKey && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                  Trading Wallet
                </h2>
                <KeyManagement
                  clientId={client.id}
                  hasKey={hasConnectedKey}
                  chain={clientChain}
                  onKeyRotated={handleKeyRotated}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
