import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'seeker' | 'healer';
  avatar?: string;
  profile?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: 'seeker' | 'healer') => Promise<void>;
  signup: (name: string, email: string, password: string, userType: 'seeker' | 'healer') => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  const login = async (email: string, password: string, userType: 'seeker' | 'healer') => {
    setLoading(true);
    
    try {
      const response = await apiService.login(email, password, userType);
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      const userData: User = {
        id: response.data.user.id,
        name: `${response.data.user.profile?.firstName || ''} ${response.data.user.profile?.lastName || ''}`.trim() || response.data.user.email,
        email: response.data.user.email,
        userType: response.data.user.userType.toLowerCase() as 'seeker' | 'healer',
        avatar: response.data.user.profile?.avatarUrl || '',
        profile: response.data.user.profile
      };
      
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, userType: 'seeker' | 'healer') => {
    setLoading(true);
    
    try {
      const response = await apiService.register(name, email, password, userType);
      
      if (!response.success) {
        throw new Error(response.message || 'Registration failed');
      }

      const userData: User = {
        id: response.data.user.id,
        name: `${response.data.user.profile?.firstName || ''} ${response.data.user.profile?.lastName || ''}`.trim() || name,
        email: response.data.user.email,
        userType: response.data.user.userType.toLowerCase() as 'seeker' | 'healer',
        avatar: response.data.user.profile?.avatarUrl || '',
        profile: response.data.user.profile
      };
      
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    }
    
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};