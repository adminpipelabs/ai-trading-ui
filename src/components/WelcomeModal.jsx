import React from 'react';

export default function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            margin: '0 0 8px 0',
          }}>
            Welcome to Pipe Labs 👋
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            margin: 0,
          }}>
            We help your token maintain healthy trading activity. Here's how it works:
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 8px 0',
            }}>
              1. Connect your trading wallet
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.6',
            }}>
              You provide a dedicated wallet key that our bot uses to execute trades.
              Your key is encrypted and stored securely — we never see it in plain text.
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 8px 0',
            }}>
              2. Your bot trades automatically
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.6',
            }}>
              Our bot places buy and sell orders throughout the day to maintain
              consistent volume on your token's market. You set the daily target,
              trade sizes, and intervals.
            </p>
          </div>

          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#111827',
              margin: '0 0 8px 0',
            }}>
              3. You stay in control
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: 0,
              lineHeight: '1.6',
            }}>
              Start, stop, or adjust your bot anytime. Monitor performance,
              wallet balance, and trade history from this dashboard.
            </p>
          </div>
        </div>

        <div style={{
          padding: '12px 16px',
          backgroundColor: '#f0fdfa',
          borderRadius: '8px',
          marginBottom: '24px',
        }}>
          <p style={{
            fontSize: '14px',
            color: '#0d9488',
            margin: 0,
          }}>
            💡 <strong>Need help?</strong> Contact us at{' '}
            <a href="mailto:support@pipelabs.xyz" style={{ color: '#0d9488', textDecoration: 'underline' }}>
              support@pipelabs.xyz
            </a>
          </p>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#0d9488',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
