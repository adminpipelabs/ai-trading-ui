import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrowserProvider } from 'ethers';
import bs58 from 'bs58';
// All API calls use trading-bridge directly

export default function Login() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState(null); // 'evm' or 'solana'
  const navigate = useNavigate();
  const { login } = useAuth();

  const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

  // Detect available wallets
  const detectWallets = () => {
    const wallets = { evm: null, solana: null };
    
    // EVM wallets
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.evm = { name: 'MetaMask', provider: window.ethereum };
      else if (window.ethereum.isCoinbaseWallet) wallets.evm = { name: 'Coinbase Wallet', provider: window.ethereum };
      else if (window.ethereum.isTrust) wallets.evm = { name: 'Trust Wallet', provider: window.ethereum };
      else wallets.evm = { name: 'Ethereum Wallet', provider: window.ethereum };
    }
    
    // Solana wallets (Phantom)
    if (window.solana && window.solana.isPhantom) {
      wallets.solana = { name: 'Phantom', provider: window.solana };
    }
    
    return wallets;
  };

  // Connect EVM wallet
  const connectEVM = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('evm');

    try {
      const wallets = detectWallets();
      
      if (!wallets.evm) {
        setError('No EVM wallet detected. Please install MetaMask, Coinbase Wallet, or another EVM-compatible wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.evm.name}...`);
      
      // Request account access
      const provider = new BrowserProvider(wallets.evm.provider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const walletAddress = accounts[0];
      
      // Get nonce/message from trading-bridge
      setStatus('Getting authentication message...');
      console.log('🔗 Using TRADING_BRIDGE_URL for auth:', TRADING_BRIDGE_URL);
      
      let nonceRes;
      try {
        nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchError) {
        console.error('❌ Network error fetching nonce:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
      }
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        console.error('❌ Nonce endpoint failed:', nonceRes.status, errorText);
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      // Sign message using ethers
      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      let signature;
      try {
        signature = await signer.signMessage(message);
      } catch (signError) {
        // Handle user rejection gracefully
        if (signError?.code === 'ACTION_REJECTED' || signError?.reason === 'rejected' || signError?.message?.includes('rejected')) {
          setError('Signature cancelled. Please try again and approve the signature in your wallet.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw signError;
      }

      // Verify signature with backend
      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect EVM wallet');
      setStatus('');
      setLoading(false);
    }
  };

  // Connect Solana wallet
  const connectSolana = async () => {
    setLoading(true);
    setError('');
    setStatus('');
    setWalletType('solana');

    try {
      const wallets = detectWallets();
      
      if (!wallets.solana) {
        setError('No Solana wallet detected. Please install Phantom wallet.');
        setLoading(false);
        return;
      }

      setStatus(`Connecting to ${wallets.solana.name}...`);
      
      // Connect to Phantom
      let response;
      try {
        response = await window.solana.connect();
      } catch (connectError) {
        if (connectError.code === 4001) {
          setError('Connection cancelled. Please try again and approve the connection in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to connect: ${connectError.message}`);
      }

      const walletAddress = response.publicKey.toString();
      console.log('✅ Connected to Solana wallet:', walletAddress);
      
      // Get nonce/message from trading-bridge
      setStatus('Getting authentication message...');
      console.log('🔗 Using TRADING_BRIDGE_URL for auth:', TRADING_BRIDGE_URL);
      
      let nonceRes;
      try {
        nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (fetchError) {
        console.error('❌ Network error fetching nonce:', fetchError);
        throw new Error(`Network error: ${fetchError.message}. Please check your internet connection.`);
      }
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        console.error('❌ Nonce endpoint failed:', nonceRes.status, errorText);
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      // Sign message using Solana wallet
      setStatus('Please sign the message in your wallet...');
      let signature;
      try {
        // Convert message to Uint8Array for Solana signing
        const messageBytes = new TextEncoder().encode(message);
        // Phantom signMessage API: { message: Uint8Array, display?: 'utf8' | 'hex' }
        const signedMessage = await window.solana.signMessage({
          message: messageBytes,
          display: 'utf8'
        });
        // Solana returns signature as Uint8Array, convert to base58 string (Solana standard)
        // The signature format: { signature: Uint8Array, publicKey: PublicKey }
        signature = bs58.encode(signedMessage.signature);
      } catch (signError) {
        if (signError.code === 4001) {
          setError('Signature cancelled. Please try again and approve the signature in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to sign message: ${signError.message}`);
      }

      // Verify signature with backend
      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect Solana wallet');
      setStatus('');
      setLoading(false);
    }
  };

  // Common function to verify signature and complete login
  const verifyAndLogin = async (walletAddress, message, signature) => {
    setStatus('Verifying signature...');
    console.log('🔐 Sending login request to:', `${TRADING_BRIDGE_URL}/auth/verify`);
    
    const res = await fetch(`${TRADING_BRIDGE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        wallet_address: walletAddress, 
        message, 
        signature 
      })
    });

    if (!res.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || 'Login failed';
        console.error('❌ Login failed:', res.status, errorMessage);
      } catch (e) {
        const errorText = await res.text();
        console.error('❌ Login failed (non-JSON):', res.status, errorText);
        errorMessage = `Login failed: ${res.status} ${errorText}`;
      }
      
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
    console.log('✅ Login successful:', data);

    // Call auth context login (handles storage)
    const userData = login({
      user: data.user,
      access_token: data.access_token
    });

    // Redirect based on role
    console.log('Login response:', data);
    console.log('User role:', userData.role);
    
    if (userData.role === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
    
    setLoading(false);
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

      {/* Wallet Connection Buttons */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* EVM Wallet Button */}
        <button 
          onClick={connectEVM} 
          disabled={loading}
          style={{ 
            padding: '16px 32px', 
            fontSize: 16, 
            fontWeight: 600,
            background: loading && walletType === 'evm' ? '#4b5563' : 'linear-gradient(135deg, #627eea 0%, #764ba2 100%)',
            color: '#fff', 
            border: 'none', 
            borderRadius: 12, 
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(98, 126, 234, 0.4)',
            transition: 'all 0.2s',
            minWidth: 180,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(98, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(98, 126, 234, 0.4)';
          }}
        >
          <span>⟠</span>
          <span>{loading && walletType === 'evm' ? 'Connecting...' : 'Connect EVM Wallet'}</span>
        </button>

        {/* Solana Wallet Button */}
        <button 
          onClick={connectSolana} 
          disabled={loading}
          style={{ 
            padding: '16px 32px', 
            fontSize: 16, 
            fontWeight: 600,
            background: loading && walletType === 'solana' ? '#4b5563' : 'linear-gradient(135deg, #9945ff 0%, #14f195 100%)',
            color: '#fff', 
            border: 'none', 
            borderRadius: 12, 
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(153, 69, 255, 0.4)',
            transition: 'all 0.2s',
            minWidth: 180,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(153, 69, 255, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(153, 69, 255, 0.4)';
          }}
        >
          <span>◎</span>
          <span>{loading && walletType === 'solana' ? 'Connecting...' : 'Connect Solana Wallet'}</span>
        </button>
      </div>

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
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p><strong>EVM:</strong> MetaMask • Coinbase Wallet • Trust Wallet</p>
          <p><strong>Solana:</strong> Phantom</p>
        </div>
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
