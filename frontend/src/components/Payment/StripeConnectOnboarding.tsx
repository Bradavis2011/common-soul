import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  DollarSign,
  Shield,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

interface ConnectAccountStatus {
  accountId?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
  capabilities: {
    card_payments: string;
    transfers: string;
  };
}

interface StripeConnectOnboardingProps {
  onStatusChange?: (status: ConnectAccountStatus) => void;
  showEarnings?: boolean;
}

const StripeConnectOnboarding: React.FC<StripeConnectOnboardingProps> = ({ 
  onStatusChange, 
  showEarnings = true 
}) => {
  const [accountStatus, setAccountStatus] = useState<ConnectAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load account status on component mount
  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getStripeConnectStatus();
      setAccountStatus(response);
      onStatusChange?.(response);
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.error === 'No payment account found') {
        setAccountStatus(null);
      } else {
        setError('Failed to load payment account status');
        console.error('Error loading account status:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const createConnectAccount = async () => {
    try {
      setCreating(true);
      setError(null);
      
      const response = await apiService.createStripeConnectAccount();
      
      toast({
        title: "Payment Account Created",
        description: "Your payment account has been created. Complete the onboarding to start receiving payments.",
      });

      // Reload status after creation
      await loadAccountStatus();
      
      // Automatically start onboarding
      if (response.needsOnboarding) {
        startOnboarding();
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create payment account';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setOnboarding(true);
      setError(null);
      
      const response = await apiService.createStripeOnboardingLink();
      
      // Redirect to Stripe onboarding
      window.location.href = response.url;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to start onboarding';
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setOnboarding(false);
    }
  };

  const getStatusBadge = () => {
    if (!accountStatus) return null;
    
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    }
    
    if (accountStatus.details_submitted) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Setup Required</Badge>;
  };

  const getStatusMessage = () => {
    if (!accountStatus) return null;
    
    if (accountStatus.charges_enabled && accountStatus.payouts_enabled) {
      return {
        type: 'success' as const,
        message: 'Your payment account is fully activated! You can now receive payments from customers.'
      };
    }
    
    if (accountStatus.details_submitted) {
      return {
        type: 'warning' as const,
        message: 'Your account is under review. This typically takes 1-2 business days.'
      };
    }
    
    const requirementsCount = accountStatus.requirements.currently_due.length;
    return {
      type: 'error' as const,
      message: `Complete ${requirementsCount} requirement${requirementsCount !== 1 ? 's' : ''} to activate your payment account.`
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!accountStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <p className="text-muted-foreground">
              Set up your payment account to receive payments from customers securely and automatically.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Shield className="w-4 h-4 text-blue-600" />
                <div className="text-sm">
                  <div className="font-medium">Secure</div>
                  <div className="text-muted-foreground">Bank-level security</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Zap className="w-4 h-4 text-green-600" />
                <div className="text-sm">
                  <div className="font-medium">Automatic</div>
                  <div className="text-muted-foreground">Instant transfers</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <div className="text-sm">
                  <div className="font-medium">Fair Fees</div>
                  <div className="text-muted-foreground">10% platform fee</div>
                </div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={createConnectAccount} 
            disabled={creating} 
            size="lg"
            className="w-full"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating Account...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Set Up Payment Account
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Account
          </span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {statusInfo && (
          <Alert variant={statusInfo.type === 'success' ? 'default' : statusInfo.type === 'warning' ? 'default' : 'destructive'}>
            <AlertDescription>{statusInfo.message}</AlertDescription>
          </Alert>
        )}

        {showEarnings && accountStatus.charges_enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Payments Enabled</div>
              <div className="font-medium text-green-600">✓ Active</div>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">Payouts Enabled</div>
              <div className="font-medium text-green-600">
                {accountStatus.payouts_enabled ? '✓ Active' : '⏳ Pending'}
              </div>
            </div>
          </div>
        )}

        {accountStatus.requirements.currently_due.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Required Actions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {accountStatus.requirements.currently_due.map((requirement) => (
                <li key={requirement} className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  {requirement.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          {(!accountStatus.details_submitted || accountStatus.requirements.currently_due.length > 0) && (
            <Button 
              onClick={startOnboarding} 
              disabled={onboarding}
              className="flex-1"
            >
              {onboarding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {accountStatus.details_submitted ? 'Update Account' : 'Complete Setup'}
                </>
              )}
            </Button>
          )}
          
          <Button variant="outline" onClick={loadAccountStatus}>
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeConnectOnboarding;