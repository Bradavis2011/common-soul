import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHealerOnboarding } from '@/hooks/useHealerOnboarding';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireHealerOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = false,
  requireHealerOnboarding = false 
}) => {
  const { isAuthenticated, user } = useAuth();
  const { redirectToOnboardingIfNeeded, loading } = useHealerOnboarding();
  const location = useLocation();

  useEffect(() => {
    // Check if healer needs onboarding redirect
    if (requireHealerOnboarding && isAuthenticated && user?.userType === 'healer') {
      redirectToOnboardingIfNeeded(location.pathname);
    }
  }, [isAuthenticated, user, location.pathname, requireHealerOnboarding, redirectToOnboardingIfNeeded]);

  // Show loading if checking healer status
  if (requireHealerOnboarding && user?.userType === 'healer' && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};