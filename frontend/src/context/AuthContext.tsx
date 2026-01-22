import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface LoginPayload {
  method: 'password' | 'sms';
  email?: string;
  password?: string;
  phone?: string;
  code?: string;
}

interface RegisterPayload {
  name: string;
  email?: string;
  password?: string;
  phone?: string;
  code?: string;
}

interface AuthContextType {
  user: User | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Restore session from local storage if implemented, for now simple state
  useEffect(() => {
    const savedUser = localStorage.getItem('lumina_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const userData = await api.auth.login(payload);
      try {
        const profile = await api.user.getProfile(userData.id);
        setUser(profile);
        localStorage.setItem('lumina_user', JSON.stringify(profile));
      } catch {
        setUser(userData);
        localStorage.setItem('lumina_user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const userData = await api.auth.register(payload);
      try {
        const profile = await api.user.getProfile(userData.id);
        setUser(profile);
        localStorage.setItem('lumina_user', JSON.stringify(profile));
      } catch {
        setUser(userData);
        localStorage.setItem('lumina_user', JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lumina_user');
    api.auth.logout();
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
