import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EXCHANGES, getAllDEXExchanges, getAllCEXExchanges } from '../constants/exchanges';

const API_BASE = process.env.REACT_APP_TRADING_BRIDGE_URL || 'https://trading-bridge-production.up.railway.app';

const BOT_TYPES = {
  volume: { id: 'volume', name: 'Volume Bot', description: 'Generates trading volume with alternating buy/sell orders', icon: '📈' },
  spread: { id: 'spread', name: 'Spread Bot', description: 'Market making with bid/ask orders around current price', icon: '📊' },
};

export default function BotSetupWizard({ onComplete, onCancel, clientId }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default configs for each bot type (defined before state)
  const VOLUME_BOT_DEFAULTS = {
    baseToken: '',
    quoteToken: 'USDT',
    tokenMint: '',
    dailyVolumeUsd: 5000,
    minTradeUsd: 10,
    maxTradeUsd: 25,
    intervalMinMinutes: 15,
    intervalMaxMinutes: 45,
    slippageBps: 50,
  };

  const SPREAD_BOT_DEFAULTS = {
    baseToken: '',
    quoteToken: 'USDT',
    tokenMint: '',
    spreadBps: 50,              // 0.5% spread
    orderSizeUsd: 100,          // $100 per order
    levels: 3,                  // 3 orders each side
    refreshSeconds: 30,         // Update every 30 seconds
    maxPositionUsd: 1000,       // Max $1000 inventory imbalance
  };

  // Form state
  const [botType, setBotType] = useState(null);
  const [exchange, setExchange] = useState(null);
  const [credentials, setCredentials] = useState({
    privateKey: '',
    apiKey: '',
    apiSecret: '',
    memo: '',
    passphrase: '',
  });
  const [config, setConfig] = useState({ ...VOLUME_BOT_DEFAULTS });

  // Update config defaults when bot type changes
  const handleBotTypeSelect = (type) => {
    setBotType(type);
    // Preserve trading pair info (baseToken/quoteToken/tokenMint) when switching bot types
    const currentPair = {
      baseToken: config.baseToken,
      quoteToken: config.quoteToken,
      tokenMint: config.tokenMint,
    };
    const defaults = type === 'volume' ? { ...VOLUME_BOT_DEFAULTS } : { ...SPREAD_BOT_DEFAULTS };
    setConfig({ ...defaults, ...currentPair });
  };

  const selectedExchange = exchange ? EXCHANGES[exchange] : null;
  const isCEX = selectedExchange?.type === 'cex';
  const isDEX = selectedExchange?.type === 'dex';

  // ─────────────────────────────────────────────────────────
  // Step 1: Bot Type Selection
  // ─────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div>
      <h2 style={styles.stepTitle}>Select Bot Type</h2>
      <p style={styles.stepDesc}>Choose what kind of trading bot you want to run.</p>

      <div style={styles.optionGrid}>
        {Object.values(BOT_TYPES).map(type => (
          <div
            key={type.id}
            onClick={() => handleBotTypeSelect(type.id)}
            style={{
              ...styles.optionCard,
              ...(botType === type.id ? styles.optionCardSelected : {}),
            }}
          >
            <span style={styles.optionIcon}>{type.icon}</span>
            <h3 style={styles.optionName}>{type.name}</h3>
            <p style={styles.optionDesc}>{type.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // Step 2: Exchange Selection
  // ─────────────────────────────────────────────────────────
  const renderStep2 = () => {
    const dexExchanges = getAllDEXExchanges();
    const cexExchanges = getAllCEXExchanges();

    return (
      <div>
        <h2 style={styles.stepTitle}>Select Exchange</h2>
        <p style={styles.stepDesc}>Where do you want your bot to trade?</p>

        <h4 style={styles.sectionLabel}>Decentralized Exchanges (DEX)</h4>
        <p style={styles.sectionHint}>Requires your wallet private key</p>
        <div style={styles.optionGrid}>
          {dexExchanges.map(ex => (
            <div
              key={ex.id}
              onClick={() => setExchange(ex.id)}
              style={{
                ...styles.optionCardSmall,
                ...(exchange === ex.id ? styles.optionCardSelected : {}),
              }}
            >
              <span style={styles.optionIcon}>{ex.icon}</span>
              <h3 style={styles.optionName}>{ex.name}</h3>
              <p style={styles.optionHint}>{ex.chain === 'solana' ? 'Solana' : 'Ethereum / Base'}</p>
            </div>
          ))}
        </div>

        <h4 style={{ ...styles.sectionLabel, marginTop: '24px' }}>Centralized Exchanges (CEX)</h4>
        <p style={styles.sectionHint}>Requires your exchange API keys</p>
        <div style={{
          ...styles.optionGrid,
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: '8px',
        }}>
          {cexExchanges.map(ex => (
            <div
              key={ex.id}
              onClick={() => setExchange(ex.id)}
              style={{
                ...styles.optionCardSmall,
                ...(exchange === ex.id ? styles.optionCardSelected : {}),
              }}
            >
              <span style={styles.optionIcon}>{ex.icon}</span>
              <h3 style={styles.optionName}>{ex.name}</h3>
              <p style={styles.optionHint}>API Keys</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────
  // Step 3: Credentials Input (DYNAMIC)
  // ─────────────────────────────────────────────────────────
  const renderStep3 = () => {
    if (isDEX) {
      return (
        <div>
          <h2 style={styles.stepTitle}>Connect Your Wallet</h2>
          <p style={styles.stepDesc}>
            Enter your {selectedExchange.chain === 'solana' ? 'Solana' : 'EVM'} wallet private key.
          </p>

          <div style={styles.field}>
            <label style={styles.label}>Private Key</label>
            <input
              type="password"
              value={credentials.privateKey}
              onChange={e => setCredentials({ ...credentials, privateKey: e.target.value })}
              placeholder="Enter your private key"
              style={styles.input}
            />
          </div>

          <div style={styles.infoBox}>
            <strong>🔒 Security</strong>
            <ul style={styles.infoList}>
              <li>Your key is encrypted with AES-256 before storage</li>
              <li>We never see or store your key in plain text</li>
              <li>Your bot can only trade — it cannot transfer funds out</li>
              <li>You can revoke access anytime from Settings</li>
            </ul>
          </div>

          <div style={styles.tipBox}>
            <strong>💡 Tip</strong>
            <p>We recommend creating a dedicated wallet just for trading. Don't use your main wallet.</p>
          </div>
        </div>
      );
    }

    // CEX
    return (
      <div>
        <h2 style={styles.stepTitle}>Connect {selectedExchange.name}</h2>
        <p style={styles.stepDesc}>Enter your {selectedExchange.name} API credentials.</p>

        <div style={styles.field}>
          <label style={styles.label}>API Key</label>
          <input
            type="text"
            value={credentials.apiKey}
            onChange={e => setCredentials({ ...credentials, apiKey: e.target.value })}
            placeholder="Enter your API key"
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>API Secret</label>
          <input
            type="password"
            value={credentials.apiSecret}
            onChange={e => setCredentials({ ...credentials, apiSecret: e.target.value })}
            placeholder="Enter your API secret"
            style={styles.input}
          />
        </div>

        {selectedExchange.requiresMemo && (
          <div style={styles.field}>
            <label style={styles.label}>Memo / UID <span style={styles.required}>*</span></label>
            <input
              type="text"
              value={credentials.memo}
              onChange={e => setCredentials({ ...credentials, memo: e.target.value })}
              placeholder="Enter your API memo"
              style={styles.input}
            />
            <p style={styles.fieldHint}>Found in your {selectedExchange.name} API settings</p>
          </div>
        )}

        {selectedExchange.requiresPassphrase && (
          <div style={styles.field}>
            <label style={styles.label}>Passphrase <span style={styles.required}>*</span></label>
            <input
              type="password"
              value={credentials.passphrase}
              onChange={e => setCredentials({ ...credentials, passphrase: e.target.value })}
              placeholder="Enter your API passphrase"
              style={styles.input}
            />
          </div>
        )}

        <div style={styles.infoBox}>
          <strong>🔒 Security</strong>
          <ul style={styles.infoList}>
            <li>Your credentials are encrypted with AES-256 before storage</li>
            <li>Create API keys with <strong>TRADE permission only</strong></li>
            <li>Never enable WITHDRAW permission</li>
            <li>Enable IP whitelisting on {selectedExchange.name} for extra security</li>
          </ul>
        </div>

        <div style={styles.tipBox}>
          <strong>📍 IP Whitelist</strong>
          <p>Add this IP to your {selectedExchange.name} API whitelist:</p>
          <code style={styles.code}>3.222.129.4</code>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────
  // Step 4: Bot Configuration
  // ─────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <div>
      <h2 style={styles.stepTitle}>Configure Your Bot</h2>
      <p style={styles.stepDesc}>Set your trading parameters.</p>

      {/* Trading Pair - same for both bot types */}
      {isCEX ? (
        <div style={styles.fieldRow}>
          <div style={styles.field}>
            <label style={styles.label}>Base Token</label>
            <input
              type="text"
              value={config.baseToken}
              onChange={e => setConfig({ ...config, baseToken: e.target.value.toUpperCase() })}
              placeholder="e.g., SHARP"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Quote Token</label>
            <select
              value={config.quoteToken}
              onChange={e => setConfig({ ...config, quoteToken: e.target.value })}
              style={styles.input}
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
          </div>
        </div>
      ) : (
        <div style={styles.field}>
          <label style={styles.label}>
            {selectedExchange?.chain === 'solana' ? 'Token Mint Address' : 'Token Contract Address'}
          </label>
          <input
            type="text"
            value={config.tokenMint}
            onChange={e => setConfig({ ...config, tokenMint: e.target.value })}
            placeholder={selectedExchange?.chain === 'solana' 
              ? 'e.g., EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' 
              : 'e.g., 0x...'}
            style={styles.input}
          />
        </div>
      )}

      {/* VOLUME BOT CONFIG */}
      {botType === 'volume' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Daily Volume Target (USD)</label>
            <input
              type="number"
              value={config.dailyVolumeUsd || 0}
              onChange={e => setConfig({ ...config, dailyVolumeUsd: parseInt(e.target.value) || 0 })}
              style={styles.input}
            />
            <p style={styles.fieldHint}>Total volume to generate per day</p>
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Min Trade Size (USD)</label>
              <input
                type="number"
                value={config.minTradeUsd || 0}
                onChange={e => setConfig({ ...config, minTradeUsd: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Trade Size (USD)</label>
              <input
                type="number"
                value={config.maxTradeUsd || 0}
                onChange={e => setConfig({ ...config, maxTradeUsd: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Min Interval (minutes)</label>
              <input
                type="number"
                value={config.intervalMinMinutes || 0}
                onChange={e => setConfig({ ...config, intervalMinMinutes: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Max Interval (minutes)</label>
              <input
                type="number"
                value={config.intervalMaxMinutes || 0}
                onChange={e => setConfig({ ...config, intervalMaxMinutes: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
            </div>
          </div>

          {isDEX && (
            <div style={styles.field}>
              <label style={styles.label}>Slippage Tolerance (basis points)</label>
              <input
                type="number"
                value={config.slippageBps || 0}
                onChange={e => setConfig({ ...config, slippageBps: parseInt(e.target.value) || 0 })}
                style={styles.input}
              />
              <p style={styles.fieldHint}>50 bps = 0.5%. Recommended: 30-100 bps</p>
            </div>
          )}
        </>
      )}

      {/* SPREAD BOT CONFIG */}
      {botType === 'spread' && (
        <>
          <div style={styles.field}>
            <label style={styles.label}>Spread Width (basis points)</label>
            <input
              type="number"
              value={config.spreadBps || 0}
              onChange={e => setConfig({ ...config, spreadBps: parseInt(e.target.value) || 0 })}
              style={styles.input}
            />
            <p style={styles.fieldHint}>Distance from mid price. 50 bps = 0.5% spread</p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Order Size (USD)</label>
            <input
              type="number"
              value={config.orderSizeUsd || 0}
              onChange={e => setConfig({ ...config, orderSizeUsd: parseInt(e.target.value) || 0 })}
              style={styles.input}
            />
            <p style={styles.fieldHint}>Size of each limit order</p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Number of Levels</label>
            <input
              type="number"
              value={config.levels || 0}
              onChange={e => setConfig({ ...config, levels: parseInt(e.target.value) || 0 })}
              style={styles.input}
              min="1"
              max="5"
            />
            <p style={styles.fieldHint}>How many orders on each side of the book (1-5)</p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Refresh Interval (seconds)</label>
            <input
              type="number"
              value={config.refreshSeconds || 0}
              onChange={e => setConfig({ ...config, refreshSeconds: parseInt(e.target.value) || 0 })}
              style={styles.input}
            />
            <p style={styles.fieldHint}>How often to cancel and replace orders</p>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Max Position (USD)</label>
            <input
              type="number"
              value={config.maxPositionUsd || 0}
              onChange={e => setConfig({ ...config, maxPositionUsd: parseInt(e.target.value) || 0 })}
              style={styles.input}
            />
            <p style={styles.fieldHint}>Maximum inventory imbalance allowed</p>
          </div>
        </>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────
  // Step 5: Review & Confirm
  // ─────────────────────────────────────────────────────────
  const renderStep5 = () => {
    const pair = isCEX 
      ? `${config.baseToken}/${config.quoteToken}`
      : config.tokenMint?.slice(0, 8) + '...' + config.tokenMint?.slice(-4);

    return (
      <div>
        <h2 style={styles.stepTitle}>Review & Confirm</h2>
        <p style={styles.stepDesc}>Please review your bot configuration.</p>

        <div style={styles.reviewBox}>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Bot Type</span>
            <span style={styles.reviewValue}>{BOT_TYPES[botType]?.name}</span>
          </div>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Exchange</span>
            <span style={styles.reviewValue}>{selectedExchange?.name} ({isCEX ? 'CEX' : 'DEX'})</span>
          </div>
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Trading Pair</span>
            <span style={styles.reviewValue}>{pair}</span>
          </div>
          
          {/* Volume Bot Review Fields */}
          {botType === 'volume' && (
            <>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Daily Target</span>
                <span style={styles.reviewValue}>${(config.dailyVolumeUsd || 0).toLocaleString()}</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Trade Size</span>
                <span style={styles.reviewValue}>${config.minTradeUsd || 0} - ${config.maxTradeUsd || 0}</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Interval</span>
                <span style={styles.reviewValue}>{config.intervalMinMinutes || 0} - {config.intervalMaxMinutes || 0} min</span>
              </div>
              {isDEX && config.slippageBps && (
                <div style={styles.reviewRow}>
                  <span style={styles.reviewLabel}>Slippage</span>
                  <span style={styles.reviewValue}>{config.slippageBps} bps</span>
                </div>
              )}
            </>
          )}

          {/* Spread Bot Review Fields */}
          {botType === 'spread' && (
            <>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Spread Width</span>
                <span style={styles.reviewValue}>{config.spreadBps || 0} bps ({(config.spreadBps || 0) / 100}%)</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Order Size</span>
                <span style={styles.reviewValue}>${(config.orderSizeUsd || 0).toLocaleString()}</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Levels</span>
                <span style={styles.reviewValue}>{config.levels || 0} per side</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Refresh</span>
                <span style={styles.reviewValue}>Every {config.refreshSeconds || 0}s</span>
              </div>
              <div style={styles.reviewRow}>
                <span style={styles.reviewLabel}>Max Position</span>
                <span style={styles.reviewValue}>${(config.maxPositionUsd || 0).toLocaleString()}</span>
              </div>
            </>
          )}
          <div style={styles.reviewRow}>
            <span style={styles.reviewLabel}>Credentials</span>
            <span style={styles.reviewValue}>✓ {isCEX ? 'API Keys' : 'Private Key'} will be encrypted</span>
          </div>
        </div>

        <div style={styles.warningBox}>
          <strong>⚠️ Authorization</strong>
          <p>
            By clicking "Create & Start Bot" you authorize Pipe Labs to execute trades on your 
            behalf using the credentials you provided. You can stop or revoke access at any time.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────
  // Form Submission
  // ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token');
      const walletAddress = user?.wallet_address || user?.wallet;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(walletAddress && { 'X-Wallet-Address': walletAddress }),
      };

      // 1. Save credentials
      if (isCEX) {
        const credPayload = {
          exchange: exchange,
          api_key: credentials.apiKey.trim(),
          api_secret: credentials.apiSecret.trim(),
          ...(credentials.memo && { memo: credentials.memo.trim() }),
          ...(credentials.passphrase && { passphrase: credentials.passphrase.trim() }),
        };

        const credRes = await fetch(`${API_BASE}/exchanges/credentials`, {
          method: 'POST',
          headers,
          body: JSON.stringify(credPayload),
        });

        if (!credRes.ok) {
          const credErr = await credRes.json();
          throw new Error(credErr.detail || 'Failed to save API credentials');
        }
      } else {
        // DEX - save private key
        const clientIdToUse = clientId || user?.id || user?.client_id;
        const keyRes = await fetch(`${API_BASE}/clients/${clientIdToUse}/trading-key`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            private_key: credentials.privateKey.trim(),
            chain: selectedExchange.chain,
          }),
        });

        if (!keyRes.ok) {
          const keyErr = await keyRes.json();
          throw new Error(keyErr.detail || 'Failed to save private key');
        }
      }

      // 2. Create bot with bot-type-specific config
      let botConfig = {};
      
      if (botType === 'volume') {
        botConfig = {
          daily_volume_usd: config.dailyVolumeUsd || 5000,
          min_trade_usd: config.minTradeUsd || 10,
          max_trade_usd: config.maxTradeUsd || 25,
          interval_min_seconds: (config.intervalMinMinutes || 15) * 60,
          interval_max_seconds: (config.intervalMaxMinutes || 45) * 60,
          ...(config.slippageBps && { slippage_bps: config.slippageBps }),
        };
      } else if (botType === 'spread') {
        botConfig = {
          spread_bps: config.spreadBps || 50,
          order_size_usd: config.orderSizeUsd || 100,
          levels: config.levels || 3,
          refresh_seconds: config.refreshSeconds || 30,
          max_position_usd: config.maxPositionUsd || 1000,
        };
      }

      const botPayload = {
        name: `${config.baseToken || 'My'} ${BOT_TYPES[botType].name}`,
        bot_type: botType,
        exchange: isCEX ? exchange : null,
        connector: exchange,
        chain: selectedExchange.chain || null,
        pair: isCEX ? `${config.baseToken}/${config.quoteToken}` : null,
        base_asset: config.baseToken || null,
        quote_asset: config.quoteToken || null,
        base_mint: config.tokenMint || null,
        private_key: isCEX ? null : credentials.privateKey.trim(), // Only for DEX
        config: botConfig,
      };

      // Use clientId prop if provided, otherwise fallback to user.id
      const clientIdToUse = clientId || user?.id || user?.client_id;
      
      if (!clientIdToUse) {
        throw new Error('Client ID not found. Please refresh and try again.');
      }

      const botRes = await fetch(`${API_BASE}/clients/${clientIdToUse}/setup-bot`, {
        method: 'POST',
        headers,
        body: JSON.stringify(botPayload),
      });

      if (!botRes.ok) {
        const botErr = await botRes.json();
        throw new Error(botErr.detail || 'Failed to create bot');
      }

      const bot = await botRes.json();

      // Done!
      onComplete?.(bot);
    } catch (err) {
      console.error('Bot setup error:', err);
      setError(err.message || 'Failed to create bot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────
  const canProceed = () => {
    switch (step) {
      case 1: return !!botType;
      case 2: return !!exchange;
      case 3:
        if (isDEX) return credentials.privateKey.trim().length > 0;
        if (isCEX) {
          const hasBasic = credentials.apiKey.trim() && credentials.apiSecret.trim();
          const hasMemo = !selectedExchange.requiresMemo || credentials.memo.trim();
          const hasPass = !selectedExchange.requiresPassphrase || credentials.passphrase.trim();
          return hasBasic && hasMemo && hasPass;
        }
        return false;
      case 4:
        if (isCEX) {
          if (!config.baseToken || !config.quoteToken) return false;
        } else {
          if (!config.tokenMint) return false;
        }
        // Validate bot-type-specific required fields
        if (botType === 'volume') {
          return config.dailyVolumeUsd > 0 && config.minTradeUsd > 0 && config.maxTradeUsd > 0;
        } else if (botType === 'spread') {
          return config.spreadBps > 0 && config.orderSizeUsd > 0 && config.levels > 0;
        }
        return false;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 5) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div style={styles.wizard}>
      {/* Progress Steps */}
      <div style={styles.progress}>
        {['Bot Type', 'Exchange', 'Credentials', 'Configure', 'Confirm'].map((label, i) => (
          <div
            key={label}
            style={{
              ...styles.progressStep,
              ...(step > i + 1 ? styles.progressStepDone : {}),
              ...(step === i + 1 ? styles.progressStepActive : {}),
            }}
          >
            <span style={styles.progressNumber}>{i + 1}</span>
            <span style={styles.progressLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={styles.content}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>

      {/* Navigation */}
      <div style={styles.nav}>
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} style={styles.backBtn} disabled={loading}>
            ← Back
          </button>
        ) : (
          <button onClick={onCancel} style={styles.backBtn}>
            Cancel
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed() || loading}
          style={{
            ...styles.nextBtn,
            opacity: canProceed() && !loading ? 1 : 0.5,
            cursor: canProceed() && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Creating...' : step === 5 ? 'Create & Start Bot' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = {
  wizard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '640px',
    margin: '0 auto',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  progress: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '32px',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '16px',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    opacity: 0.4,
    flex: 1,
  },
  progressStepActive: {
    opacity: 1,
  },
  progressStepDone: {
    opacity: 0.7,
  },
  progressNumber: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 600,
    color: '#6b7280',
  },
  progressLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6b7280',
  },
  content: {
    minHeight: '400px',
  },
  stepTitle: {
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '8px',
    color: '#0f172a',
  },
  stepDesc: {
    color: '#6b7280',
    marginBottom: '24px',
    fontSize: '14px',
  },
  sectionLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '4px',
    marginTop: '16px',
  },
  sectionHint: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '12px',
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
  },
  optionCard: {
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  optionCardSmall: {
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  optionCardSelected: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa',
  },
  optionIcon: {
    fontSize: '32px',
    marginBottom: '8px',
    display: 'block',
  },
  optionName: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '4px',
    color: '#0f172a',
  },
  optionDesc: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
  },
  optionHint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: 0,
  },
  field: {
    marginBottom: '20px',
  },
  fieldRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#374151',
  },
  required: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  fieldHint: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  infoBox: {
    padding: '16px',
    backgroundColor: '#f0fdfa',
    borderRadius: '8px',
    marginTop: '20px',
    fontSize: '14px',
    color: '#374151',
  },
  infoList: {
    marginTop: '8px',
    marginBottom: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#374151',
  },
  tipBox: {
    padding: '16px',
    backgroundColor: '#fffbeb',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '14px',
    color: '#374151',
  },
  code: {
    display: 'block',
    marginTop: '8px',
    padding: '8px 12px',
    backgroundColor: '#1f2937',
    color: '#f9fafb',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  reviewBox: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
  },
  reviewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  reviewLabel: {
    color: '#6b7280',
    fontSize: '14px',
  },
  reviewValue: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#0f172a',
  },
  warningBox: {
    padding: '16px',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#92400e',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '14px',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },
  backBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  nextBtn: {
    padding: '12px 32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#0d9488',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
};
