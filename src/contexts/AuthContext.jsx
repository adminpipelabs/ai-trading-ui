import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('pipelabs_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('pipelabs_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    // TODO: Replace with real API call
    const { email, role } = credentials;
    
    const userData = {
      email,
      role: role || 'client',
      name: role === 'admin' ? 'Admin User' : 'Client User',
    };
    
    setUser(userData);
    localStorage.setItem('pipelabs_user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pipelabs_user');
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
