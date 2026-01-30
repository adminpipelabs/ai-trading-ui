import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to console (or send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // TODO: Send to Sentry or similar error tracking service
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div style={{
          padding: 40,
          textAlign: 'center',
          backgroundColor: '#fef2f2',
          borderRadius: 12,
          margin: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ color: '#991b1b', marginBottom: 8 }}>
            {this.props.title || 'Something went wrong'}
          </h2>
          <p style={{ color: '#7f1d1d', marginBottom: 24 }}>
            {this.props.message || 'An error occurred while loading this section.'}
          </p>
          
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Refresh Page
            </button>
          </div>
          
          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: 24, textAlign: 'left', maxWidth: 800, margin: '24px auto' }}>
              <summary style={{ cursor: 'pointer', color: '#991b1b', fontWeight: 500 }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                backgroundColor: '#1f2937',
                color: '#f87171',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontSize: 12,
                marginTop: 8,
                textAlign: 'left',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
