import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check both localStorage keys (for compatibility)
    const stored = localStorage.getItem('user') || localStorage.getItem('pipelabs_user');
    const token = localStorage.getItem('access_token') || localStorage.getItem('pipelabs_token');
    if (stored && token) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    // Handle both response formats: {user: {...}} or direct user object
    const userObj = authData.user || authData;
    const token = authData.access_token || authData.token;
    
    // Ensure wallet_address is included - use from userObj or from authData if provided
    const walletAddress = userObj.wallet_address || authData.wallet_address || userObj.wallet;
    
    const userData = {
      id: userObj.id,
      email: userObj.email,
      wallet_address: walletAddress, // Always include wallet address
      role: (userObj.role || 'client').toLowerCase(), // Use actual role, don't default to client
      name: userObj.email || walletAddress?.slice(0, 8) + '...',
    };
    
    console.log('💾 Storing user data:', { ...userData, wallet_address: walletAddress ? `${walletAddress.substring(0, 8)}...` : 'MISSING' });
    
    setUser(userData);
    // Store in both formats for compatibility
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('access_token', token);
    localStorage.setItem('pipelabs_user', JSON.stringify(userData));
    localStorage.setItem('pipelabs_token', token);
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pipelabs_user');
    localStorage.removeItem('pipelabs_token');
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin, isClient }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { AuthContext };
