/**
 * Runtime API Configuration
 * Detects backend URL automatically without requiring environment variables
 */

function getBackendURL() {
  // 1. Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // 2. Check environment variable (set at build time in Railway)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 3. Production fallback - Use trading-bridge (consolidated backend)
  return 'https://trading-bridge-production.up.railway.app';
}

export const API_URL = getBackendURL();

// Log for debugging (remove in production if needed)
console.log('🔗 API URL:', API_URL);
