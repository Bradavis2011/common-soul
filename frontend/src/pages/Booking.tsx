import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Video, Star, CreditCard, Calendar as CalendarIcon, User, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import CheckoutPayment from "@/components/Payment/CheckoutPayment";
import PaymentStatus from "@/components/Payment/PaymentStatus";
import BookingCalendar from "@/components/Calendar/BookingCalendar";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("virtual");
  const [duration, setDuration] = useState<string>("60");
  const [intentions, setIntentions] = useState<string>("");
  const [experience, setExperience] = useState<string>("");
  
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check URL parameters for payment return
  const paymentParam = searchParams.get('payment');
  const bookingParam = searchParams.get('booking');

  // Temporarily disable auth redirect for testing
  // useEffect(() => {
  //   // Only redirect if we're sure the user is not authenticated
  //   // This prevents redirects while auth is still loading
  //   if (isAuthenticated === false) {
  //     navigate('/login');
  //     return;
  //   }
  // }, [isAuthenticated, navigate]);

  // Mock healer data
  const healer = {
    name: "Sarah Moonwhisper",
    specialty: "Crystal Healing & Meditation",
    rating: 4.9,
    reviewCount: 127,
    location: "San Francisco, CA",
    avatar: "",
    bio: "I'm a certified crystal healer with over 10 years of experience helping souls find their inner peace and balance. My sessions combine ancient wisdom with modern healing techniques.",
    pricing: {
      "45": 65,
      "60": 85,
      "90": 120
    }
  };


  const sessionTypes = [
    { value: "virtual", label: "Virtual Session", icon: Video, description: "Connect from anywhere via video call" },
    { value: "in-person", label: "In-Person", icon: MapPin, description: "Meet at healer's location" }
  ];

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !duration) {
      toast({
        title: "Missing Information",
        description: "Please select date, time, and duration",
        variant: "destructive"
      });
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a datetime string for the booking
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hour24, minutes || 0, 0, 0);

      // Create booking via API
      const bookingData = {
        healerId: 'mock-healer-id', // In real app, get from URL params
        serviceId: 'mock-service-id', // In real app, get from selected service
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(duration),
        totalPrice: calculateTotal(),
        notes: intentions || '',
        customerNotes: experience ? `Experience level: ${experience}` : ''
      };

      const response = await apiService.createBooking(bookingData);
      
      if (response.success) {
        setCurrentBooking(response.data);
        setShowPayment(true);
        toast({
          title: "Booking Created!",
          description: "Now proceeding to payment...",
        });
      } else {
        throw new Error(response.message || 'Failed to create booking');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create booking';
      setError(errorMessage);
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment success/failure
  const handlePaymentSuccess = () => {
    navigate('/sessions');
  };

  const handlePaymentError = (error: string) => {
    setError(error);
    setShowPayment(false);
  };

  const calculateTotal = () => {
    return healer.pricing[duration as keyof typeof healer.pricing] || 0;
  };

  // Show payment status if returning from Stripe
  if (paymentParam && bookingParam) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <PaymentStatus />
        </div>
      </div>
    );
  }

  // Show payment form if booking is created
  if (showPayment && currentBooking) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold mb-2">Complete Your Payment</h1>
              <p className="text-muted-foreground">Secure payment for your healing session</p>
            </div>
            
            <CheckoutPayment
              bookingId={currentBooking.id}
              totalAmount={calculateTotal()}
              serviceTitle={healer.specialty}
              healerName={healer.name}
              sessionDuration={parseInt(duration)}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/healers')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Healers
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Book a Session</h1>
              <p className="text-muted-foreground">Schedule your healing session</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Healer Info */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={healer.avatar} />
                    <AvatarFallback>{healer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg">{healer.name}</h3>
                    <p className="text-muted-foreground">{healer.specialty}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-medium">{healer.rating}</span>
                      <span className="text-muted-foreground">({healer.reviewCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{healer.location}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{healer.bio}</p>

                  <div className="space-y-2">
                    <h4 className="font-medium">Session Pricing</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>45 minutes</span>
                        <span className="font-medium">${healer.pricing["45"]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>60 minutes</span>
                        <span className="font-medium">${healer.pricing["60"]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>90 minutes</span>
                        <span className="font-medium">${healer.pricing["90"]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Session Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={sessionType} onValueChange={setSessionType}>
                  <div className="space-y-3">
                    {sessionTypes.map((type) => (
                      <div key={type.value} className="flex items-center space-x-3">
                        <RadioGroupItem value={type.value} id={type.value} />
                        <Label htmlFor={type.value} className="flex items-center gap-3 cursor-pointer flex-1">
                          <type.icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BookingCalendar
                  healerId="mock-healer-id"
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  selectedTime={selectedTime}
                  onTimeSelect={setSelectedTime}
                  duration={parseInt(duration)}
                />
              </CardContent>
            </Card>

            {/* Session Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Session Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minutes - ${healer.pricing["45"]}</SelectItem>
                    <SelectItem value="60">60 minutes - ${healer.pricing["60"]}</SelectItem>
                    <SelectItem value="90">90 minutes - ${healer.pricing["90"]}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="intentions">What would you like to focus on in this session?</Label>
                  <Textarea 
                    id="intentions"
                    value={intentions}
                    onChange={(e) => setIntentions(e.target.value)}
                    placeholder="Share your intentions, concerns, or areas you'd like to work on..."
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience">Have you had similar sessions before?</Label>
                  <Select value={experience} onValueChange={setExperience}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first-time">This is my first time</SelectItem>
                      <SelectItem value="some">I've had a few sessions</SelectItem>
                      <SelectItem value="experienced">I'm quite experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Session ({duration} minutes)</span>
                    <span>${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform fee (10%)</span>
                    <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Healer receives</span>
                    <span>${(calculateTotal() * 0.9).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${calculateTotal()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6" 
                  size="lg" 
                  variant="spiritual"
                  onClick={handleBooking}
                  disabled={isLoading || !selectedDate || !selectedTime}
                >
                  {isLoading ? "Processing..." : `Book Session - $${calculateTotal()}`}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  By booking, you agree to our Terms of Service and Cancellation Policy
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;