import React, { createContext, useContext, useState, useEffect } from 'react';
import { syncManager } from '../storage/syncManager';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('3dcalc_auth_token') : null;
  });

  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('3dcalc_auth_user');
    return stored ? JSON.parse(stored) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitora status online/offline do navegador
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleAuthChange = () => {
      const currentToken = localStorage.getItem('3dcalc_auth_token');
      const currentUser = localStorage.getItem('3dcalc_auth_user');
      setToken(currentToken);
      setUser(currentUser ? JSON.parse(currentUser) : null);
    };

    window.addEventListener('3dcalc_auth_changed', handleAuthChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('3dcalc_auth_changed', handleAuthChange);
    };
  }, []);

  // Login
  const login = async (email, password) => {
    if (!navigator.onLine) {
      throw new Error('Você está offline. É necessária uma conexão com a internet para fazer login.');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao realizar login.');
    }

    localStorage.setItem('3dcalc_auth_token', data.token);
    localStorage.setItem('3dcalc_auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);

    // Dispara sincronização após autenticação bem-sucedida
    setTimeout(() => {
      syncManager.sync();
    }, 300);

    return data.user;
  };

  // Registro de nova conta
  const register = async (name, email, password) => {
    if (!navigator.onLine) {
      throw new Error('Você está offline. É necessária uma conexão com a internet para criar uma conta.');
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao criar conta.');
    }

    localStorage.setItem('3dcalc_auth_token', data.token);
    localStorage.setItem('3dcalc_auth_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);

    // Sincroniza dados locais com a nova conta no PostgreSQL
    setTimeout(() => {
      syncManager.sync();
    }, 300);

    return data.user;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('3dcalc_auth_token');
    localStorage.removeItem('3dcalc_auth_user');
    localStorage.removeItem('3dcalc_last_synced_at');
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event('3dcalc_auth_changed'));
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        isOnline,
        isAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
