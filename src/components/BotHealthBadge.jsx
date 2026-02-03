import React, { useState } from 'react';

const healthConfig = {
  healthy:  { color: '#22c55e', bg: '#f0fdf4', label: 'Running',  icon: '🟢' },
  stale:    { color: '#eab308', bg: '#fefce8', label: 'Stale',    icon: '🟡' },
  stopped:  { color: '#ef4444', bg: '#fef2f2', label: 'Stopped',  icon: '🔴' },
  error:    { color: '#f97316', bg: '#fff7ed', label: 'Error',    icon: '⚠️' },
  unknown:  { color: '#6b7280', bg: '#f9fafb', label: 'Unknown',  icon: '⚪' },
};

export default function BotHealthBadge({ status, healthStatus, healthMessage, lastTradeTime, botId, onRefresh }) {
  const [checking, setChecking] = useState(false);
  const config = healthConfig[healthStatus] || healthConfig.unknown;

  const handleRefresh = async () => {
    setChecking(true);
    try {
      const { tradingBridge } = await import('../services/api');
      await tradingBridge.forceHealthCheck(botId);
      // Call parent callback if provided, otherwise reload
      if (onRefresh) {
        onRefresh();
      } else {
        // Small delay to let backend process
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error('Health check failed:', err);
      alert('Failed to refresh health status: ' + (err.message || 'Unknown error'));
    }
    setChecking(false);
  };

  // Format last trade time
  const formatLastTrade = (timeStr) => {
    if (!timeStr) return null;
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <span style={{
        padding: '4px 12px',
        borderRadius: '9999px',
        fontSize: '13px',
        fontWeight: 600,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}20`,
        whiteSpace: 'nowrap',
      }}>
        {config.icon} {config.label}
      </span>

      {healthMessage && (
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={healthMessage}
        >
          {healthMessage}
        </span>
      )}

      {lastTradeTime && (
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          Last trade: {formatLastTrade(lastTradeTime)}
        </span>
      )}

      <button
        onClick={handleRefresh}
        disabled={checking}
        style={{
          padding: '2px 8px',
          fontSize: '11px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
          background: '#fff',
          cursor: checking ? 'not-allowed' : 'pointer',
          opacity: checking ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}
        title="Refresh health status"
      >
        {checking ? '...' : '↻'}
      </button>
    </div>
  );
}
