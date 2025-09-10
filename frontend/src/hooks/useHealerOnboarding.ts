import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface HealerVerificationStatus {
  status: 'INCOMPLETE' | 'PENDING_VERIFICATION' | 'VERIFIED';
  isVerified: boolean;
  isActive: boolean;
  isProfileComplete: boolean;
  profileCompletionScore: number;
  canAcceptBookings: boolean;
}

export const useHealerOnboarding = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<HealerVerificationStatus | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if healer needs onboarding
  const checkHealerStatus = async () => {
    if (!isAuthenticated || !user || user.userType !== 'healer') {
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.getHealerVerificationStatus();
      if (response.success) {
        setVerificationStatus(response.data);
      }
    } catch (error) {
      console.error('Failed to check healer status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Redirect to onboarding if profile is incomplete
  const redirectToOnboardingIfNeeded = (currentPath: string = '') => {
    if (!verificationStatus || loading) return false;

    // Don't redirect if already on onboarding page
    if (currentPath.includes('/healer-onboarding')) return false;

    // Redirect if profile is incomplete
    if (verificationStatus.status === 'INCOMPLETE') {
      navigate('/healer-onboarding');
      return true;
    }

    return false;
  };

  // Check healer status when authentication changes
  useEffect(() => {
    checkHealerStatus();
  }, [isAuthenticated, user?.id]);

  return {
    verificationStatus,
    loading,
    checkHealerStatus,
    redirectToOnboardingIfNeeded,
    needsOnboarding: verificationStatus?.status === 'INCOMPLETE',
    isVerified: verificationStatus?.isVerified || false,
    canAcceptBookings: verificationStatus?.canAcceptBookings || false
  };
};