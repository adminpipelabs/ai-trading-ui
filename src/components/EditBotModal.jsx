import React, { useState, useEffect } from 'react';

const EditBotModal = ({ bot, isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        spread_percent: bot.config.spread_percent || 0.5,
        order_size_usd: bot.config.order_size_usd || 100,
        poll_interval_seconds: bot.config.poll_interval_seconds || 5,
        price_decimals: bot.config.price_decimals || 6,
        amount_decimals: bot.config.amount_decimals || 2,
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
          spread_percent: Number(config.spread_percent),
          order_size_usd: Number(config.order_size_usd),
          poll_interval_seconds: Number(config.poll_interval_seconds),
          price_decimals: Number(config.price_decimals),
          amount_decimals: Number(config.amount_decimals),
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
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Spread (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.spread_percent || ''}
                  onChange={(e) => handleChange('spread_percent', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: '#6b7280' }}>Half above + half below mid price</small>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Order Size (USD)</label>
                <input
                  type="number"
                  step="1"
                  value={config.order_size_usd || ''}
                  onChange={(e) => handleChange('order_size_usd', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Poll Interval (seconds)</label>
                <input
                  type="number"
                  value={config.poll_interval_seconds || ''}
                  onChange={(e) => handleChange('poll_interval_seconds', e.target.value)}
                  style={inputStyle}
                />
                <small style={{ color: '#6b7280' }}>How often to check for fills</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Price Decimals</label>
                  <input
                    type="number"
                    value={config.price_decimals || ''}
                    onChange={(e) => handleChange('price_decimals', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Amount Decimals</label>
                  <input
                    type="number"
                    value={config.amount_decimals || ''}
                    onChange={(e) => handleChange('amount_decimals', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </>
          )}

          {/* Slippage - volume bot only */}
          {isVolume && (
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
          )}

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
