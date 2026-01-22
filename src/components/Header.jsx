import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, 
  LogOut, 
  User, 
  Shield,
  ChevronDown
} from 'lucide-react';

export default function Header() {
  const { user, logout, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header className="h-16 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">P</span>
        </div>
        <span className="text-white font-semibold text-lg">Pipe Labs</span>
        {isAdmin && (
          <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
            <Shield size={12} />
            Admin
          </span>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* User menu */}
        <div className="relative">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-white text-sm font-medium">{user?.name}</div>
              <div className="text-dark-400 text-xs">{user?.email}</div>
            </div>
            <ChevronDown size={16} className="text-dark-400" />
          </button>

          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-xl border border-dark-700 py-1 z-20">
                <button className="w-full px-4 py-2 text-left text-sm text-dark-200 hover:bg-dark-700 flex items-center gap-2">
                  <Settings size={16} />
                  Settings
                </button>
                <hr className="border-dark-700 my-1" />
                <button 
                  onClick={logout}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-dark-700 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
