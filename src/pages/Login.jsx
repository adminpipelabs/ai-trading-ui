import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrowserProvider } from 'ethers';

const API = process.env.REACT_APP_API_URL || 'https://pipelabs-dashboard-production.up.railway.app';

export default function Login() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const detectWallet = () => {
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) return { name: 'MetaMask', provider: window.ethereum };
      if (window.ethereum.isPhantom) return { name: 'Phantom', provider: window.ethereum };
      if (window.ethereum.isCoinbaseWallet) return { name: 'Coinbase Wallet', provider: window.ethereum };
      if (window.ethereum.isTrust) return { name: 'Trust Wallet', provider: window.ethereum };
      return { name: 'Ethereum Wallet', provider: window.ethereum };
    }
    return null;
  };

  const connect = async () => {
    setLoading(true);
    setError('');
    setStatus('');

    try {
      const wallet = detectWallet();
      
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
      const nonceRes = await fetch(`${API}/api/auth/nonce/${walletAddress}`);
      
      if (!nonceRes.ok) {
        throw new Error('Failed to get authentication message from server');
      }

      const { message } = await nonceRes.json();

      // Sign message using ethers (more reliable than personal_sign)
      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Send to backend for verification
      setStatus('Verifying signature...');
      const res = await fetch(`${API}/api/auth/wallet/login`, {
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
            `Wallet address not registered.\n\n` +
            `Please contact your admin to create your account with this wallet address:\n` +
            `${walletAddress}\n\n` +
            `Once your wallet is registered, you can log in.`
          );
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();

      // Store token and user data
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Call auth context login
      login(data.user || data);

      // Redirect based on role
      if (data.user?.role === 'admin' || data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (e) {
      setError(e.message || 'Failed to connect wallet');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)',
      color: '#fff',
      padding: '20px'
    }}>
      {/* Logo */}
      <div style={{
        width: 80,
        height: 80,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
      }}>
        <span style={{ fontSize: 40, fontWeight: 700 }}>P</span>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Pipe Labs</h1>
      <p style={{ color: '#9ca3af', marginBottom: 32, fontSize: 16 }}>AI-Powered Trading Platform</p>

      {/* Connect Button */}
      <button 
        onClick={connect} 
        disabled={loading}
        style={{ 
          marginTop: 20, 
          padding: '16px 48px', 
          fontSize: 16, 
          fontWeight: 600,
          background: loading ? '#4b5563' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff', 
          border: 'none', 
          borderRadius: 12, 
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
          transition: 'all 0.2s',
          minWidth: 200
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 16px rgba(102, 126, 234, 0.4)';
        }}
      >
        {status || (loading ? 'Connecting...' : '🔐 Connect Wallet')}
      </button>

      {/* Status Message */}
      {status && !error && (
        <p style={{ color: '#60a5fa', marginTop: 16, fontSize: 14 }}>{status}</p>
      )}

      {/* Error Message */}
      {error && (
        <div style={{ 
          marginTop: 20, 
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          maxWidth: 500,
          textAlign: 'center'
        }}>
          <p style={{ color: '#fca5a5', fontSize: 14, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
      )}

      {/* Supported Wallets Info */}
      <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>Supported Wallets:</p>
        <p style={{ fontSize: 13 }}>
          MetaMask • Phantom • Coinbase Wallet • Trust Wallet • WalletConnect
        </p>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: 32,
        padding: '16px 24px',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 8,
        maxWidth: 500,
        fontSize: 13,
        lineHeight: 1.6,
        color: '#93c5fd'
      }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>ℹ️ How it works:</p>
        <p>1. Click "Connect Wallet" to connect your wallet</p>
        <p>2. Approve the connection request</p>
        <p>3. Sign the authentication message (no gas fees)</p>
        <p style={{ marginTop: 8, fontWeight: 600 }}>Note: Your wallet address must be registered by an admin.</p>
      </div>
    </div>
  );
}
