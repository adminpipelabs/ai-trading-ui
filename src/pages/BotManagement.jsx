import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Plus } from 'lucide-react';

export default function BotManagement() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 100%)',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontSize: '2rem', margin: 0 }}>
              Bot Management
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0.5rem 0 0 0' }}>
              Create and manage your trading bots
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '4rem',
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)'
        }}>
          <Bot size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No bots yet</h3>
          <p>Create your first trading bot to get started</p>
        </div>
      </div>
    </div>
  );
}
