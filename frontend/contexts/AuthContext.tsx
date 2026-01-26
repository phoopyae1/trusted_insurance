'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, User } from '../lib/api/auth';
import { useRouter } from 'next/navigation';
import { loginAtenxionUser } from '../lib/api/atenxion';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored token and user
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Verify token is not expired (basic check)
        const user = JSON.parse(storedUser);
        setUser(user);
        
        // Optionally verify token is still valid by making a test request
        // For now, just set the user if token exists
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    } else {
      // No token or user, ensure clean state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);

    // Call Atenxion login if user is a CUSTOMER
    if (response.user.role === 'CUSTOMER') {
      try {
        await loginAtenxionUser({
          userId: response.user.id.toString(),
          customerId: response.user.id.toString(),
        });
      } catch (error) {
        console.error('Failed to login to Atenxion:', error);
        // Don't block the login if Atenxion fails
      }
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await authApi.register(email, password, name);
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (e) {
        // Ignore errors on logout
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    // Force full page reload to ensure clean state
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
