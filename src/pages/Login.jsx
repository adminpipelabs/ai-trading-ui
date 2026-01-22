import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WalletLogin from '../components/WalletLogin';

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  React.useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSuccess = (authData) => {
    login(authData);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a1a',
      color: 'white',
    }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Pipe Labs</h1>
      <p style={{ marginBottom: '2rem', color: '#6b7280' }}>AI-Powered Trading Platform</p>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Connect Wallet</h2>
        <WalletLogin onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
