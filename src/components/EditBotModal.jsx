import React, { useState, useEffect } from 'react';

const EditBotModal = ({ bot, isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiKeys, setApiKeys] = useState({ api_key: '', api_secret: '', passphrase: '' });
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Pre-populate form with current config
  useEffect(() => {
    if (bot && bot.config) {
      setConfig({
        name: bot.name || '',
        daily_volume_usd: bot.config.daily_volume_usd || 5000,
        min_trade_usd: bot.config.min_trade_usd || 10,
        max_trade_usd: bot.config.max_trade_usd || 25,
        interval_min_seconds: bot.config.interval_min_seconds || 900,
        interval_max_seconds: bot.config.interval_max_seconds || 2700,
        slippage_bps: bot.config.slippage_bps || 50,
        // Spread bot fields
        spread_bps: bot.config.spread_bps || 50,
        order_size_usd: bot.config.order_size_usd || 500,
        refresh_seconds: bot.config.refresh_seconds || 30,
        expire_seconds: bot.config.expire_seconds || 3600,
      });
    }
  }, [bot]);

  const handleChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Validation
      if (bot.bot_type === 'volume') {
        if (config.min_trade_usd >= config.max_trade_usd) {
          throw new Error('Min trade must be less than max trade');
        }
        if (config.interval_min_seconds >= config.interval_max_seconds) {
          throw new Error('Min interval must be less than max interval');
        }
      }

      // If API keys are provided for CEX bots, save them first
      const isCEX = bot.connector && !['jupiter', 'solana'].includes(bot.connector.toLowerCase());
      if (isCEX && showApiKeys && apiKeys.api_key && apiKeys.api_secret) {
        try {
          const API_BASE = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';
          const walletAddress = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).wallet_address : null;
          const headers = {
            'Content-Type': 'application/json',
            ...(walletAddress && { 'X-Wallet-Address': walletAddress }),
          };
          
          const params = new URLSearchParams({
            api_key: apiKeys.api_key.trim(),
            api_secret: apiKeys.api_secret.trim(),
          });
          if (apiKeys.passphrase) {
            params.append('passphrase', apiKeys.passphrase.trim());
          }
          
          const credRes = await fetch(`${API_BASE}/bots/${bot.id}/add-exchange-credentials?${params}`, {
            method: 'POST',
            headers,
          });
          
          if (!credRes.ok) {
            const credErr = await credRes.json();
            throw new Error(credErr.detail || 'Failed to save API credentials');
          }
        } catch (credErr) {
          throw new Error(`Failed to save API keys: ${credErr.message}`);
        }
      }

      // Build payload based on bot type
      const payload = {
        name: config.name,
        config: bot.bot_type === 'volume' ? {
          base_mint: bot.config.base_mint,
          quote_mint: bot.config.quote_mint,
          daily_volume_usd: Number(config.daily_volume_usd),
          min_trade_usd: Number(config.min_trade_usd),
          max_trade_usd: Number(config.max_trade_usd),
          interval_min_seconds: Number(config.interval_min_seconds),
          interval_max_seconds: Number(config.interval_max_seconds),
          slippage_bps: Number(config.slippage_bps),
        } : {
          base_mint: bot.config.base_mint,
          quote_mint: bot.config.quote_mint,
          spread_bps: Number(config.spread_bps),
          order_size_usd: Number(config.order_size_usd),
          refresh_seconds: Number(config.refresh_seconds),
          expire_seconds: Number(config.expire_seconds),
          slippage_bps: Number(config.slippage_bps),
        }
      };

      await onSave(bot.id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !bot) return null;

  const isVolume = bot.bot_type === 'volume';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Edit Bot: {bot.name}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>

        {/* Warning if running */}
        {bot.status === 'running' && (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            ⚠️ Bot is running. Stop it before editing for changes to take effect.
          </div>
        )}

        {/* Show API keys section for CEX bots */}
        {bot.connector && !['jupiter', 'solana'].includes(bot.connector.toLowerCase()) && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: showApiKeys ? '#f0fdfa' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 500,
              }}
            >
              {showApiKeys ? '▼' : '▶'} {showApiKeys ? 'Hide' : 'Add'} API Keys
            </button>
            {showApiKeys && (
              <div style={{ marginTop: 12, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                <p style={{ marginTop: 0, marginBottom: 12, fontSize: 14, color: '#6b7280' }}>
                  Add or update your exchange API credentials. Leave blank to keep existing keys.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>API Key</label>
                    <input
                      type="text"
                      value={apiKeys.api_key}
                      onChange={(e) => setApiKeys({ ...apiKeys, api_key: e.target.value })}
                      placeholder="Enter API key"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>API Secret</label>
                    <input
                      type="password"
                      value={apiKeys.api_secret}
                      onChange={(e) => setApiKeys({ ...apiKeys, api_secret: e.target.value })}
                      placeholder="Enter API secret"
                      style={inputStyle}
                    />
                  </div>
                  {(bot.connector.toLowerCase() === 'bitmart' || bot.connector.toLowerCase() === 'coinstore') && (
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 14 }}>Passphrase / Memo</label>
                      <input
                        type="password"
                        value={apiKeys.passphrase}
                        onChange={(e) => setApiKeys({ ...apiKeys, passphrase: e.target.value })}
                        placeholder="Enter passphrase (if required)"
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            ❌ {error}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Bot Name */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Bot Name</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Volume Bot Fields */}
          {isVolume && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Daily Volume Target (USD)</label>
                <input
                  type="number"
                  value={config.daily_volume_usd || ''}
                  onChange={(e) => handleChange('daily_volume_usd', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Min Trade (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.min_trade_usd || ''}
                    onChange={(e) => handleChange('min_trade_usd', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Max Trade (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.max_trade_usd || ''}
                    onChange={(e) => handleChange('max_trade_usd', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Min Interval (seconds)</label>
                  <input
                    type="number"
                    value={config.interval_min_seconds || ''}
                    onChange={(e) => handleChange('interval_min_seconds', e.target.value)}
                    style={inputStyle}
                  />
                  <small style={{ color: '#6b7280' }}>{Math.round((config.interval_min_seconds || 0) / 60)} min</small>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Max Interval (seconds)</label>
                  <input
                    type="number"
                    value={config.interval_max_seconds || ''}
                    onChange={(e) => handleChange('interval_max_seconds', e.target.value)}
                    style={inputStyle}
                  />
                  <small style={{ color: '#6b7280' }}>{Math.round((config.interval_max_seconds || 0) / 60)} min</small>
                </div>
              </div>
            </>
          )}

          {/* Spread Bot Fields */}
          {!isVolume && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Spread (basis points)</label>
                <input
                  type="number"
                  value={config.spread_bps || ''}
                  onChange={(e) => handleChange('spread_bps', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: '#6b7280' }}>{(config.spread_bps || 0) / 100}%</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Order Size (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.order_size_usd || ''}
                  onChange={(e) => handleChange('order_size_usd', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Refresh Interval (seconds)</label>
                <input
                  type="number"
                  value={config.refresh_seconds || ''}
                  onChange={(e) => handleChange('refresh_seconds', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Order Expiry (seconds)</label>
                <input
                  type="number"
                  value={config.expire_seconds || ''}
                  onChange={(e) => handleChange('expire_seconds', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: '#6b7280' }}>{Math.round((config.expire_seconds || 0) / 3600)} hours</small>
              </div>
            </>
          )}

          {/* Slippage - both bot types */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Slippage Tolerance (basis points)</label>
            <input
              type="number"
              value={config.slippage_bps || ''}
              onChange={(e) => handleChange('slippage_bps', e.target.value)}
              style={inputStyle}
            />
            <small style={{ color: '#6b7280' }}>{(config.slippage_bps || 0) / 100}%</small>
          </div>

          {/* Read-only info */}
          <div style={{ backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              <strong>Token:</strong> {bot.config?.base_mint?.slice(0, 8)}...{bot.config?.base_mint?.slice(-4)}<br />
              <strong>Quote:</strong> {bot.config?.quote_mint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'USDC'}<br />
              <strong>Status:</strong> {bot.status}<br />
              <strong>Type:</strong> {bot.bot_type || 'N/A'}
            </p>
          </div>

        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #d1d5db',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#10b981',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #d1d5db',
  fontSize: 14,
};

export default EditBotModal;
