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
    
    // CRITICAL SECURITY: Role MUST default to 'client' if missing or invalid
    // ONLY 'admin' role explicitly set to 'admin' should be admin
    // This prevents clients from seeing admin dashboard even if backend is wrong
    const roleFromBackend = (userObj.role || '').toLowerCase();
    const role = roleFromBackend === 'admin' ? 'admin' : 'client';  // EXPLICIT check, default to client
    
    const userData = {
      id: userObj.id,
      email: userObj.email,
      wallet_address: walletAddress, // Always include wallet address
      role: role, // CRITICAL: Only 'admin' if explicitly 'admin', otherwise 'client'
      name: userObj.name || userObj.email || walletAddress?.slice(0, 8) + '...',
      account_identifier: userObj.account_identifier,
    };
    
    // Security audit logging
    console.log('🔒 SECURITY: Storing user data:', { 
      id: userData.id,
      name: userData.name,
      wallet_address: walletAddress ? `${walletAddress.substring(0, 8)}...` : 'MISSING',
      role_from_backend: roleFromBackend,
      role_assigned: role,
      '⚠️ SECURITY CHECK': role === 'admin' ? '⚠️ ADMIN USER ⚠️' : '✅ CLIENT USER',
      account_identifier: userObj.account_identifier
    });
    
    // Additional security check - log warning if role seems wrong
    if (role === 'admin' && userObj.account_identifier !== 'admin') {
      console.error('🚨 SECURITY WARNING: Non-admin account assigned admin role!', {
        account_identifier: userObj.account_identifier,
        role_from_backend: roleFromBackend
      });
    }
    
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
