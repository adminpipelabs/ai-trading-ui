import React, { useState } from 'react';

const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

const primaryBtnSm = {
  padding: '8px 16px', 
  borderRadius: '6px', 
  border: 'none',
  color: '#fff', 
  fontWeight: 600, 
  fontSize: '13px', 
  cursor: 'pointer',
};

const secondaryBtnSm = {
  padding: '8px 16px', 
  borderRadius: '6px', 
  border: '1px solid #d1d5db',
  backgroundColor: '#fff', 
  color: '#374151', 
  fontWeight: 600, 
  fontSize: '13px', 
  cursor: 'pointer',
};

export default function KeyManagement({ clientId, hasKey, chain = 'solana', onKeyRotated }) {
  const [showRotate, setShowRotate] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRotate = async () => {
    if (!newKey.trim()) {
      setError('Private key is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${TRADING_BRIDGE_URL}/clients/${clientId}/rotate-key`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          // Include auth headers - would be better via apiCall helper
        },
        body: JSON.stringify({ private_key: newKey }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(errorData.detail || 'Failed to rotate key');
      }

      setNewKey('');
      setShowRotate(false);
      alert('Key rotated successfully. Bot will use the new key.');
      if (onKeyRotated) {
        onKeyRotated();
      }
    } catch (err) {
      setError(err.message || 'Failed to rotate key');
    }
    setLoading(false);
  };

  const handleRevoke = async () => {
    if (!confirm('This will stop your bot and remove your trading key. Continue?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${TRADING_BRIDGE_URL}/clients/${clientId}/revoke-key`, { 
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(errorData.detail || 'Failed to revoke key');
      }

      window.location.reload();
    } catch (err) {
      setError(err.message || 'Failed to revoke key');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
      <h4 style={{ marginBottom: '12px' }}>Trading Wallet</h4>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: '#fef2f2',
          color: '#ef4444',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {hasKey ? (
        <div>
          <p style={{ color: '#22c55e', fontSize: '14px', marginBottom: '16px' }}>
            ✅ Trading key connected (encrypted)
          </p>

          {showRotate ? (
            <div>
              <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                New {chain === 'solana' ? 'Solana' : 'EVM'} Private Key
              </label>
              <input
                type="password"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder={`Enter new ${chain === 'solana' ? 'Solana' : 'EVM'} private key...`}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontFamily: 'monospace',
                  marginBottom: '12px',
                  fontSize: '14px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleRotate} disabled={loading}
                  style={{ ...primaryBtnSm, backgroundColor: '#2563eb', opacity: loading ? 0.6 : 1 }}>
                  {loading ? 'Saving...' : 'Save New Key'}
                </button>
                <button onClick={() => { setShowRotate(false); setNewKey(''); setError(null); }} style={secondaryBtnSm}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowRotate(true)} style={secondaryBtnSm}>
                Rotate Key
              </button>
              <button onClick={handleRevoke} style={{ ...secondaryBtnSm, color: '#ef4444', borderColor: '#ef4444' }}>
                Revoke Key
              </button>
            </div>
          )}
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          No trading key connected. Set up a bot to connect your wallet.
        </p>
      )}
    </div>
  );
}
