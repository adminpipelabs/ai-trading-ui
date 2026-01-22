import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Shield, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { theme, isDark } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login({ email, password });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    try {
      await login({ 
        email: role === 'admin' ? 'admin@pipelabs.io' : 'client@example.com',
        role 
      });
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-300"
      style={{ 
        background: isDark ? '#0a0f1a' : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Background Pattern */}
      {!isDark && (
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }}
        />
      )}
      {isDark && (
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 20%, rgba(94, 234, 212, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(45, 212, 191, 0.08) 0%, transparent 50%)
            `
          }}
        />
      )}
      
      <div 
        className="relative w-full max-w-md p-10 mx-4 rounded-2xl transition-all duration-300"
        style={{ 
          background: isDark ? 'rgba(17, 24, 39, 0.9)' : '#ffffff',
          border: `1px solid ${theme.border}`,
          boxShadow: isDark ? '0 25px 50px rgba(0,0,0,0.4)' : '0 25px 50px rgba(0,0,0,0.1)'
        }}
      >
        {/* Logo */}
        <div className="text-center mb-9">
          <div className="flex justify-center mb-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center font-bold text-white text-2xl"
              style={{ background: theme.logoBg, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            >
              P
            </div>
          </div>
          <h1 
            className="text-2xl font-bold mb-1"
            style={{ color: theme.textPrimary, letterSpacing: '-0.02em' }}
          >
            Pipe Labs
          </h1>
          <p className="text-sm" style={{ color: theme.textMuted }}>
            AI-Powered Trading Platform
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div 
            className="mb-5 p-3 rounded-xl text-sm text-center"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-3.5 pl-11 pr-4 rounded-xl text-sm outline-none transition-all"
                style={{ 
                  background: theme.bgInput, 
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: theme.textMuted }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3.5 pl-11 pr-11 rounded-xl text-sm outline-none transition-all"
                style={{ 
                  background: theme.bgInput, 
                  border: `1px solid ${theme.border}`,
                  color: theme.textPrimary
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                style={{ color: theme.textMuted }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-50"
            style={{ 
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              boxShadow: '0 4px 16px rgba(13, 148, 136, 0.3)'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-7">
          <div className="flex-1 h-px" style={{ background: theme.border }} />
          <span className="px-4 text-xs" style={{ color: theme.textMuted }}>or try demo</span>
          <div className="flex-1 h-px" style={{ background: theme.border }} />
        </div>

        {/* Demo Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => handleDemoLogin('admin')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ 
              color: '#d97706', 
              border: '1px solid rgba(217, 119, 6, 0.3)',
              background: isDark ? 'rgba(217, 119, 6, 0.1)' : 'rgba(251, 191, 36, 0.08)'
            }}
          >
            <Shield size={16} />
            Admin Demo
          </button>
          <button 
            onClick={() => handleDemoLogin('client')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{ 
              color: '#0d9488', 
              border: '1px solid rgba(13, 148, 136, 0.3)',
              background: isDark ? 'rgba(13, 148, 136, 0.1)' : 'rgba(13, 148, 136, 0.08)'
            }}
          >
            <User size={16} />
            Client Demo
          </button>
        </div>

        <p className="text-center text-xs mt-7" style={{ color: theme.textMuted }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
