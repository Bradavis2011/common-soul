import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Calendar, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiService from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

interface PaymentStatusData {
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'NOT_STARTED';
  amount?: number;
  currency?: string;
  paymentDate?: string;
  booking?: {
    id: string;
    totalPrice: number;
    status: string;
  };
}

const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentData, setPaymentData] = useState<PaymentStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const paymentStatus = searchParams.get('payment');
  const bookingId = searchParams.get('booking');

  useEffect(() => {
    if (!bookingId) {
      setIsLoading(false);
      return;
    }

    const fetchPaymentStatus = async () => {
      try {
        const response = await apiService.getPaymentStatus(bookingId);
        
        if (response.success) {
          setPaymentData(response.data);
          
          // Show appropriate toast based on URL parameters
          if (paymentStatus === 'success' && response.data.status === 'COMPLETED') {
            toast({
              title: "Payment Successful!",
              description: "Your healing session has been booked and confirmed.",
            });
          } else if (paymentStatus === 'cancelled') {
            toast({
              title: "Payment Cancelled",
              description: "Your payment was cancelled. You can try again anytime.",
              variant: "destructive",
            });
          }
        } else {
          throw new Error(response.message || 'Failed to fetch payment status');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || 'Failed to load payment information',
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [bookingId, paymentStatus, toast]);

  const getStatusInfo = () => {
    if (!paymentData) {
      return {
        icon: <Clock className="w-8 h-8 text-yellow-500" />,
        title: "Loading Payment Status...",
        description: "Please wait while we check your payment information.",
        variant: "default" as const,
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      };
    }

    switch (paymentData.status) {
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: "Payment Successful!",
          description: "Your healing session has been booked and confirmed. You'll receive a confirmation email shortly.",
          variant: "default" as const,
          bgColor: "bg-green-50",
          borderColor: "border-green-200"
        };
      
      case 'PENDING':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: "Payment Processing",
          description: "Your payment is being processed. This usually takes a few minutes.",
          variant: "default" as const,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200"
        };
      
      case 'FAILED':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: "Payment Failed",
          description: "There was an issue processing your payment. Please try again or contact support.",
          variant: "destructive" as const,
          bgColor: "bg-red-50",
          borderColor: "border-red-200"
        };
      
      default:
        return {
          icon: <Clock className="w-8 h-8 text-gray-500" />,
          title: "Payment Not Started",
          description: "No payment has been initiated for this booking yet.",
          variant: "default" as const,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200"
        };
    }
  };

  const statusInfo = getStatusInfo();

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading payment status...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 space-y-6">
      <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle>{statusInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {statusInfo.description}
          </p>

          {paymentData && (
            <>
              {paymentData.amount && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid:</span>
                    <span className="font-medium">
                      ${paymentData.amount.toFixed(2)} {paymentData.currency?.toUpperCase()}
                    </span>
                  </div>
                  {paymentData.paymentDate && (
                    <div className="flex justify-between text-sm">
                      <span>Payment Date:</span>
                      <span>{new Date(paymentData.paymentDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Badge 
                  variant={paymentData.status === 'COMPLETED' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {paymentData.status}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        {paymentData?.status === 'COMPLETED' && (
          <Button 
            onClick={() => navigate('/sessions')} 
            className="w-full"
            size="lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            View My Sessions
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {paymentData?.status === 'FAILED' && bookingId && (
          <Button 
            onClick={() => navigate(`/booking/${bookingId}/payment`)} 
            className="w-full"
            size="lg"
          >
            Try Payment Again
          </Button>
        )}

        <Button 
          onClick={() => navigate('/healers')} 
          variant="outline"
          className="w-full"
        >
          Browse More Healers
        </Button>
      </div>

      {/* Support Information */}
      {paymentData?.status === 'FAILED' && (
        <Alert>
          <AlertDescription className="text-sm">
            If you continue to experience issues, please contact our support team at support@thecommonsoul.com
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default PaymentStatus;