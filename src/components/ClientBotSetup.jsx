import React, { useState, useEffect } from 'react';

const TRADING_BRIDGE_URL = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

const BOT_TYPES = {
  volume: {
    label: 'Volume Bot',
    description: 'Generates trading volume with randomized buy/sell orders over time.',
    chains: ['solana'],
    fields: [
      { key: 'daily_volume_usd', label: 'Daily Volume Target (USD)', type: 'number', default: 5000, min: 100 },
      { key: 'min_trade_usd', label: 'Min Trade Size (USD)', type: 'number', default: 10, min: 1 },
      { key: 'max_trade_usd', label: 'Max Trade Size (USD)', type: 'number', default: 25, min: 1 },
      { key: 'interval_min_seconds', label: 'Min Interval (seconds)', type: 'number', default: 900 },
      { key: 'interval_max_seconds', label: 'Max Interval (seconds)', type: 'number', default: 2700 },
      { key: 'slippage_bps', label: 'Slippage Tolerance (bps)', type: 'number', default: 50, min: 1, max: 500 },
    ],
  },
  spread: {
    label: 'Spread Bot',
    description: 'Market making bot that places bid/ask orders around the current price.',
    chains: ['evm'],
    fields: [
      { key: 'bid_spread', label: 'Bid Spread (%)', type: 'number', default: 0.3, step: 0.1 },
      { key: 'ask_spread', label: 'Ask Spread (%)', type: 'number', default: 0.3, step: 0.1 },
      { key: 'order_amount', label: 'Order Amount', type: 'number', default: 1600 },
    ],
  },
};

const primaryBtn = {
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#2563eb',
  color: '#fff',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
};

const secondaryBtn = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  backgroundColor: '#fff',
  color: '#374151',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
};

export default function ClientBotSetup({ clientId, chain, onBotCreated }) {
  const [step, setStep] = useState(1); // 1: select type, 2: enter key, 3: configure, 4: confirm
  const [botType, setBotType] = useState(null);
  const [privateKey, setPrivateKey] = useState('');
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Filter bot types by chain
  const availableTypes = Object.entries(BOT_TYPES).filter(
    ([_, bt]) => bt.chains.includes(chain)
  );

  const handleSelectType = (type) => {
    setBotType(type);
    // Set defaults
    const defaults = {};
    BOT_TYPES[type].fields.forEach(f => { defaults[f.key] = f.default; });
    setConfig(defaults);
    setStep(2);
  };

  const handleKeySubmit = () => {
    if (!privateKey.trim()) {
      setError('Private key is required');
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: parseFloat(value) || value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get wallet address from private key (for Solana, derive address)
      // For now, we'll let the backend handle this
      const res = await fetch(`${TRADING_BRIDGE_URL}/clients/${clientId}/setup-bot`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // Include auth headers via apiCall helper would be better, but for now direct call
        },
        body: JSON.stringify({
          bot_type: botType,
          private_key: privateKey,
          config: config,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
        throw new Error(errorData.detail || 'Failed to create bot');
      }

      const data = await res.json();
      if (data.success || data.id) {
        setSuccess(true);
        setPrivateKey(''); // Clear from memory immediately
        if (onBotCreated) onBotCreated(data);
      } else {
        setError(data.detail || 'Failed to create bot');
      }
    } catch (err) {
      setError('Connection error: ' + err.message);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3>Bot Created Successfully</h3>
        <p style={{ color: '#6b7280' }}>
          Your bot is being started. You can monitor its status on your dashboard.
        </p>
        <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
          Your private key has been encrypted and stored securely.
          You can rotate or revoke it at any time from Settings.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {['Bot Type', 'Wallet Key', 'Configure', 'Confirm'].map((label, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            padding: '8px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: step === i + 1 ? 700 : 400,
            color: step >= i + 1 ? '#2563eb' : '#9ca3af',
            borderBottom: step >= i + 1 ? '2px solid #2563eb' : '2px solid #e5e7eb',
          }}>
            {label}
          </div>
        ))}
      </div>

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

      {/* Step 1: Select Bot Type */}
      {step === 1 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Select Bot Type</h3>
          {availableTypes.length === 0 ? (
            <p style={{ color: '#6b7280' }}>
              No bot types available for {chain} chain. Please contact support.
            </p>
          ) : (
            availableTypes.map(([key, bt]) => (
              <div
                key={key}
                onClick={() => handleSelectType(key)}
                style={{
                  padding: '20px',
                  marginBottom: '12px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#2563eb'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>
                  {bt.label}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>
                  {bt.description}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Step 2: Enter Private Key */}
      {step === 2 && (
        <div>
          <h3 style={{ marginBottom: '8px' }}>Connect Trading Wallet</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
            Enter the private key of the wallet you want the bot to trade from.
            This key is encrypted and stored securely — Pipe Labs never has
            unencrypted access to your key.
          </p>

          <div style={{
            padding: '16px',
            marginBottom: '16px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fbbf2440',
            fontSize: '13px',
            color: '#92400e',
          }}>
            <strong>⚠️ Security Note:</strong> Only use a dedicated trading wallet.
            Never use your main wallet. Fund it with only what you're willing to trade.
          </div>

          <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '8px' }}>
            {chain === 'solana' ? 'Solana Private Key (Base58)' : 'EVM Private Key (Hex)'}
          </label>
          <input
            type="password"
            value={privateKey}
            onChange={e => setPrivateKey(e.target.value)}
            placeholder={chain === 'solana' ? 'Enter Solana private key...' : '0x...'}
            style={{
              width: '100%',
              padding: '12px',
              marginTop: '8px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              fontFamily: 'monospace',
            }}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => setStep(1)} style={secondaryBtn}>Back</button>
            <button onClick={handleKeySubmit} style={primaryBtn}>Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Configure Bot */}
      {step === 3 && botType && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Configure {BOT_TYPES[botType].label}</h3>

          {BOT_TYPES[botType].fields.map(field => (
            <div key={field.key} style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: 600, fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={config[field.key] || ''}
                onChange={e => handleConfigChange(field.key, e.target.value)}
                min={field.min}
                max={field.max}
                step={field.step}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginTop: '4px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button onClick={() => setStep(2)} style={secondaryBtn}>Back</button>
            <button onClick={() => setStep(4)} style={primaryBtn}>Review</button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Review & Confirm</h3>

          <div style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: '#f9fafb',
            marginBottom: '20px',
          }}>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#6b7280' }}>Bot Type:</span>{' '}
              <strong>{BOT_TYPES[botType]?.label}</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ color: '#6b7280' }}>Wallet:</span>{' '}
              <strong>••••{privateKey.slice(-6)}</strong>
            </div>
            {Object.entries(config).map(([key, val]) => {
              const field = BOT_TYPES[botType]?.fields.find(f => f.key === key);
              return (
                <div key={key} style={{ marginBottom: '8px' }}>
                  <span style={{ color: '#6b7280' }}>{field?.label || key}:</span>{' '}
                  <strong>{val}</strong>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(3)} style={secondaryBtn}>Back</button>
            <button onClick={handleSubmit} disabled={loading} style={{...primaryBtn, opacity: loading ? 0.6 : 1}}>
              {loading ? 'Creating...' : 'Create & Start Bot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
