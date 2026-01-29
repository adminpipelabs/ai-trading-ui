import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrowserProvider } from 'ethers';
import bs58 from 'bs58';

const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

export default function Login() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletType, setWalletType] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const detectWallets = () => {
    const wallets = { evm: null, solana: null };
    
    if (window.ethereum) {
      if (window.ethereum.isMetaMask) wallets.evm = { name: 'MetaMask', provider: window.ethereum };
      else if (window.ethereum.isCoinbaseWallet) wallets.evm = { name: 'Coinbase Wallet', provider: window.ethereum };
      else if (window.ethereum.isTrust) wallets.evm = { name: 'Trust Wallet', provider: window.ethereum };
      else wallets.evm = { name: 'Ethereum Wallet', provider: window.ethereum };
    }
    
    if (window.solana && window.solana.isPhantom) {
      wallets.solana = { name: 'Phantom', provider: window.solana };
    }
    
    return wallets;
  };

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
      
      const provider = new BrowserProvider(wallets.evm.provider);
      const accounts = await provider.send('eth_requestAccounts', []);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet and try again.');
      }

      const walletAddress = accounts[0];
      
      setStatus('Getting authentication message...');
      
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      const signer = await provider.getSigner();
      let signature;
      try {
        signature = await signer.signMessage(message);
      } catch (signError) {
        if (signError?.code === 'ACTION_REJECTED' || signError?.reason === 'rejected' || signError?.message?.includes('rejected')) {
          setError('Signature cancelled. Please try again and approve the signature in your wallet.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw signError;
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect EVM wallet');
      setStatus('');
      setLoading(false);
    }
  };

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
      
      setStatus('Getting authentication message...');
      
      const nonceRes = await fetch(`${TRADING_BRIDGE_URL}/auth/message/${walletAddress}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get authentication message: ${nonceRes.status} ${errorText}`);
      }

      const nonceData = await nonceRes.json();
      const message = nonceData.message;

      setStatus('Please sign the message in your wallet...');
      let signature;
      try {
        // Encode message to Uint8Array for Phantom
        const encodedMessage = new TextEncoder().encode(message);
        console.log('📝 Signing message:', message);
        console.log('📝 Message bytes length:', encodedMessage.length);
        
        // Phantom signMessage API: signMessage(message: Uint8Array, display?: 'utf8' | 'hex')
        const { signature: signatureBytes } = await window.solana.signMessage(encodedMessage, "utf8");
        console.log('✅ Signature (raw bytes):', signatureBytes);
        
        signature = bs58.encode(signatureBytes);
        console.log('✅ Signature (base58):', signature);
      } catch (signError) {
        if (signError.code === 4001) {
          setError('Signature cancelled. Please try again and approve the signature in Phantom.');
          setStatus('');
          setLoading(false);
          return;
        }
        throw new Error(`Failed to sign message: ${signError.message}`);
      }

      await verifyAndLogin(walletAddress, message, signature);

    } catch (e) {
      setError(e.message || 'Failed to connect Solana wallet');
      setStatus('');
      setLoading(false);
    }
  };

  const verifyAndLogin = async (walletAddress, message, signature) => {
    setStatus('Verifying signature...');
    
    const verifyPayload = {
      wallet_address: walletAddress,
      message: message,
      signature: signature
    };
    
    console.log('🔐 Verifying signature with payload:', {
      wallet_address: walletAddress,
      message: message,
      signature: signature.substring(0, 20) + '...',
      messageLength: message.length,
      signatureLength: signature.length
    });
    
    const res = await fetch(`${TRADING_BRIDGE_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyPayload)
    });

    if (!res.ok) {
      let errorMessage = 'Login failed';
      try {
        const errorData = await res.json();
        errorMessage = errorData.detail || errorData.message || 'Login failed';
      } catch (e) {
        const errorText = await res.text();
        errorMessage = `Login failed: ${res.status} ${errorText}`;
      }
      
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
    
    // Debug: Log backend response
    console.log('📥 Backend login response:', JSON.stringify(data, null, 2));
    console.log('🔑 Wallet address from login:', walletAddress);
    console.log('👤 User object from backend:', data.user);

    // Ensure wallet_address is passed to login function
    const userData = login({
      user: data.user,
      access_token: data.access_token,
      wallet_address: walletAddress // Pass the wallet address used for login
    });
    
    // Debug: Verify what was stored
    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log('💾 Stored user in localStorage:', storedUser);
    console.log('✅ Wallet address in stored user:', storedUser?.wallet_address);
    
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

      {/* TWO BUTTONS - EVM AND SOLANA */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
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
        >
          <span>⟠</span>
          <span>{loading && walletType === 'evm' ? 'Connecting...' : 'Connect EVM Wallet'}</span>
        </button>

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
        >
          <span>◎</span>
          <span>{loading && walletType === 'solana' ? 'Connecting...' : 'Connect Solana Wallet'}</span>
        </button>
      </div>

      {status && !error && (
        <p style={{ color: '#60a5fa', marginTop: 16, fontSize: 14 }}>{status}</p>
      )}

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

      <div style={{ marginTop: 40, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
        <p style={{ marginBottom: 8, fontWeight: 600 }}>Supported Wallets:</p>
        <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p><strong>EVM:</strong> MetaMask • Coinbase Wallet • Trust Wallet</p>
          <p><strong>Solana:</strong> Phantom</p>
        </div>
      </div>

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
        <p>1. Click "Connect EVM Wallet" or "Connect Solana Wallet"</p>
        <p>2. Approve the connection request</p>
        <p>3. Sign the authentication message (no gas fees)</p>
        <p style={{ marginTop: 8, fontWeight: 600 }}>Note: Your wallet address must be registered by an admin.</p>
      </div>
    </div>
  );
}
