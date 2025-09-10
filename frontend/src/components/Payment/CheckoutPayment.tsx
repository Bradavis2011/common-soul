import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, CreditCard, Shield, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';

interface CheckoutPaymentProps {
  bookingId: string;
  totalAmount: number;
  platformFee?: number;
  healerAmount?: number;
  serviceTitle: string;
  healerName: string;
  sessionDuration: number;
  onPaymentSuccess?: () => void;
  onPaymentError?: (error: string) => void;
}

const CheckoutPayment: React.FC<CheckoutPaymentProps> = ({
  bookingId,
  totalAmount,
  platformFee = totalAmount * 0.1,
  healerAmount = totalAmount - (totalAmount * 0.1),
  serviceTitle,
  healerName,
  sessionDuration,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.createCheckoutSession(bookingId);
      
      if (response.success && response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error(response.message || 'Failed to create checkout session');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to initiate checkout';
      
      toast({
        title: "Checkout Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Session Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Session Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{serviceTitle}</p>
                <p className="text-sm text-muted-foreground">with {healerName}</p>
              </div>
              <Badge variant="secondary" className="ml-2">
                {sessionDuration} min
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Pricing Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Session Fee</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Platform Fee (10%)</span>
              <span>${platformFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Healer Receives</span>
              <span>${healerAmount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-medium text-base">
              <span>Total Amount</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-sm text-green-700">
            <Shield className="w-5 h-5" />
            <div>
              <p className="font-medium">Secure Payment</p>
              <p className="text-xs">Powered by Stripe • SSL Encrypted</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Button */}
      <Button
        onClick={handleCheckout}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Redirecting to Checkout...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Pay ${totalAmount.toFixed(2)}
            <ExternalLink className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {/* Additional Info */}
      <div className="text-xs text-center text-muted-foreground space-y-1">
        <p>You'll be redirected to our secure payment processor</p>
        <p>Your session will be confirmed after successful payment</p>
      </div>
    </div>
  );
};

export default CheckoutPayment;