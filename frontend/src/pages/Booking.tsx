import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, MapPin, Video, Star, CreditCard, Calendar as CalendarIcon, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("virtual");
  const [duration, setDuration] = useState<string>("60");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const availableTimes = [
    "9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", 
    "3:00 PM", "4:30 PM", "6:00 PM", "7:30 PM"
  ];

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

    setIsLoading(true);
    
    // Simulate booking process
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Booking Confirmed!",
        description: `Your session with ${healer.name} is scheduled for ${selectedDate.toDateString()} at ${selectedTime}`,
      });
    }, 2000);
  };

  const calculateTotal = () => {
    return healer.pricing[duration as keyof typeof healer.pricing] || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
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
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Choose Date</Label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      className="rounded-md border"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Available Times</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimes.map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedTime(time)}
                          className="justify-start"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          {time}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
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
                    placeholder="Share your intentions, concerns, or areas you'd like to work on..."
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="experience">Have you had similar sessions before?</Label>
                  <Select>
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
                    <span>Platform fee</span>
                    <span>$5</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>${calculateTotal() + 5}</span>
                  </div>
                </div>

                <Button 
                  className="w-full mt-6" 
                  size="lg" 
                  variant="spiritual"
                  onClick={handleBooking}
                  disabled={isLoading || !selectedDate || !selectedTime}
                >
                  {isLoading ? "Processing..." : `Book Session - $${calculateTotal() + 5}`}
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