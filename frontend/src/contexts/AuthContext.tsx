import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'seeker' | 'healer' | 'admin';
  isAdmin?: boolean;
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
  checkHealerOnboardingStatus: () => Promise<void>;
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
  const navigate = useNavigate();

  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
      }
    }
  }, []);

  // Check if healer needs onboarding
  const checkHealerOnboardingStatus = async () => {
    if (!user || user.userType !== 'healer') return;
    
    try {
      const response = await apiService.getHealerVerificationStatus();
      if (response.success && response.data.status === 'INCOMPLETE') {
        navigate('/healer-onboarding');
      }
    } catch (error) {
      console.error('Failed to check healer status:', error);
    }
  };

  const login = async (email: string, password: string, userType: 'seeker' | 'healer') => {
    setLoading(true);
    
    try {
      const response = await apiService.login(email, password, userType);
      
      if (!response.success) {
        throw new Error(response.message || 'Login failed');
      }

      const actualUserType = response.data.user.userType.toLowerCase() as 'seeker' | 'healer' | 'admin';
      
      // Validate that the user's actual type matches the login type they selected
      if (actualUserType !== userType && actualUserType !== 'admin') {
        const expectedType = actualUserType === 'healer' ? 'Healer' : 'Seeker';
        const attemptedType = userType === 'healer' ? 'Healer' : 'Seeker';
        throw new Error(`This account is registered as a ${expectedType}. Please use the ${expectedType} login option instead of ${attemptedType}.`);
      }

      const userData: User = {
        id: response.data.user.id,
        name: `${response.data.user.profile?.firstName || ''} ${response.data.user.profile?.lastName || ''}`.trim() || response.data.user.email,
        email: response.data.user.email,
        userType: actualUserType,
        isAdmin: response.data.user.userType === 'ADMIN' || response.data.user.isAdmin,
        avatar: response.data.user.profile?.avatarUrl || '',
        profile: response.data.user.profile
      };
      
      setUser(userData);
      
      // Check healer onboarding status after login
      if (actualUserType === 'healer') {
        setTimeout(() => checkHealerOnboardingStatus(), 100);
      }
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
        userType: response.data.user.userType.toLowerCase() as 'seeker' | 'healer' | 'admin',
        isAdmin: response.data.user.userType === 'ADMIN' || response.data.user.isAdmin,
        avatar: response.data.user.profile?.avatarUrl || '',
        profile: response.data.user.profile
      };
      
      setUser(userData);
      
      // Check healer onboarding status after signup
      if (userData.userType === 'healer') {
        setTimeout(() => checkHealerOnboardingStatus(), 100);
      }
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
    loading,
    checkHealerOnboardingStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};