import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const API = 'https://pipelabs-dashboard-production.up.railway.app';

export default function Login() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const connect = async () => {
    if (!window.ethereum) {
      setError('Install MetaMask');
      return;
    }
    try {
      setStatus('Connecting...');
      const [wallet] = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setStatus('Getting challenge...');
      const nonceRes = await fetch(`${API}/api/auth/nonce/${wallet}`);
      const { message } = await nonceRes.json();
      setStatus('Sign in MetaMask...');
      const signature = await window.ethereum.request({ method: 'personal_sign', params: [message, wallet] });
      setStatus('Verifying...');
      const res = await fetch(`${API}/api/auth/wallet-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet, message, signature })
      });
      if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
      const data = await res.json();
      login(data);
      navigate('/');
    } catch (e) { setError(e.message); setStatus(''); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f23', color: '#fff' }}>
      <h1>Pipe Labs</h1>
      <button onClick={connect} style={{ marginTop: 20, padding: '12px 32px', fontSize: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
        {status || '🦊 Connect MetaMask'}
      </button>
      {error && <p style={{ color: '#f66', marginTop: 10 }}>{error}</p>}
    </div>
  );
}
