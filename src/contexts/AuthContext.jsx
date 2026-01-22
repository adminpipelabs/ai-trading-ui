import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('pipelabs_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      const userData = {
        id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role, // 'admin' or 'client'
        clientId: data.client_id, // null for admin, client ID for clients
        token: data.access_token
      };

      localStorage.setItem('pipelabs_user', JSON.stringify(userData));
      localStorage.setItem('access_token', data.access_token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('pipelabs_user');
    localStorage.removeItem('access_token');
    setUser(null);
  };

  // Demo login for testing
  const demoLogin = (role) => {
    const demoUsers = {
      admin: {
        id: 'admin-1',
        email: 'admin@pipelabs.io',
        name: 'Admin User',
        role: 'admin',
        clientId: null,
        token: 'demo-token'
      },
      client: {
        id: 'client-1',
        email: 'client@acmecorp.com',
        name: 'Acme Corp',
        role: 'client',
        clientId: 'acme-corp-123',
        token: 'demo-token'
      }
    };

    const userData = demoUsers[role];
    localStorage.setItem('pipelabs_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      demoLogin,
      isAdmin,
      isClient,
      isAuthenticated: !!user
    }}>
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
