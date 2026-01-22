import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('pipelabs_user');
    const token = localStorage.getItem('pipelabs_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const userData = {
      id: authData.user?.id,
      email: authData.user?.email,
      wallet_address: authData.user?.wallet_address,
      role: authData.user?.role?.toLowerCase() || 'client',
      name: authData.user?.email || authData.user?.wallet_address?.slice(0, 8) + '...',
    };
    setUser(userData);
    localStorage.setItem('pipelabs_user', JSON.stringify(userData));
    localStorage.setItem('pipelabs_token', authData.access_token);
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
