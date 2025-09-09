import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Star, MapPin, Calendar, MessageCircle, Heart, Share, Video, Award, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HealerProfile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { toast } = useToast();

  const healer = {
    name: "Sarah Moonwhisper",
    title: "Master Crystal Healer & Meditation Guide",
    location: "San Francisco, CA",
    joinedDate: "March 2021",
    avatar: "",
    coverImage: "",
    rating: 4.9,
    totalReviews: 127,
    totalSessions: 450,
    responseTime: "Usually responds within 1 hour",
    languages: ["English", "Spanish"],
    specialties: ["Crystal Healing", "Chakra Balancing", "Meditation", "Energy Cleansing", "Spiritual Counseling"],
    certifications: [
      "Certified Crystal Healer (International Crystal Healing Guild)",
      "Reiki Master Level III",
      "Certified Meditation Instructor",
      "Chakra Balancing Specialist"
    ],
    bio: "Welcome, beautiful souls! I'm Sarah, and I've been guiding people on their spiritual journeys for over 10 years. My passion lies in helping others discover their inner light through the ancient wisdom of crystal healing and meditation.\n\nI believe that everyone has the power to heal themselves – sometimes we just need a gentle guide to show us the way. Through our sessions together, we'll explore your energy centers, work with healing crystals, and create personalized meditation practices that resonate with your unique soul.\n\nMy approach is compassionate, intuitive, and deeply rooted in both traditional practices and modern healing techniques. I create a safe, sacred space where you can explore, heal, and grow at your own pace.",
    pricing: {
      consultation: { duration: "30 min", price: 50, description: "Initial consultation & energy reading" },
      standard: { duration: "60 min", price: 85, description: "Full crystal healing & chakra balancing session" },
      extended: { duration: "90 min", price: 120, description: "Deep healing session with meditation guidance" }
    },
    availability: {
      timezone: "PST (UTC-8)",
      schedule: "Monday - Friday: 9 AM - 7 PM, Saturday: 10 AM - 4 PM"
    },
    stats: {
      totalClients: 280,
      monthsActive: 42,
      successRate: 98,
      repeatClients: 75
    }
  };

  const reviews = [
    {
      id: 1,
      clientName: "Emma J.",
      rating: 5,
      date: "2 weeks ago",
      content: "Sarah's session was absolutely transformative! Her intuitive approach and gentle guidance helped me release so much blocked energy. I left feeling lighter and more aligned than I have in years. The crystal recommendations she gave me have been incredibly powerful in my daily practice.",
      verified: true
    },
    {
      id: 2,
      clientName: "Michael R.",
      rating: 5,
      date: "1 month ago", 
      content: "I was skeptical about crystal healing, but Sarah's expertise and warm energy completely changed my perspective. She explained everything clearly and I could actually feel the energy shifts during our session. Highly recommend!",
      verified: true
    },
    {
      id: 3,
      clientName: "Lisa M.",
      rating: 4,
      date: "1 month ago",
      content: "Beautiful session with Sarah. She has a gift for creating a safe, sacred space. The meditation techniques she taught me have become an essential part of my daily routine. Looking forward to our next session!",
      verified: true
    }
  ];

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast({
      title: isFollowing ? "Unfollowed" : "Following",
      description: isFollowing 
        ? "You're no longer following Sarah" 
        : "You're now following Sarah and will get updates about her availability",
    });
  };

  const handleMessage = () => {
    toast({
      title: "Opening Messages",
      description: "Starting conversation with Sarah...",
    });
  };

  const handleShare = () => {
    toast({
      title: "Profile Shared",
      description: "Sarah's profile link has been copied to clipboard",
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? "fill-accent text-accent" 
            : i < rating 
            ? "fill-accent/50 text-accent" 
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-aurora relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background/20 via-transparent to-background/40"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="w-32 h-32 mx-auto md:mx-0 border-4 border-background shadow-lg">
                <AvatarImage src={healer.avatar} />
                <AvatarFallback className="text-2xl">
                  {healer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{healer.name}</h1>
                    <p className="text-lg text-muted-foreground mb-2">{healer.title}</p>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {healer.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Joined {healer.joinedDate}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" onClick={handleMessage}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <Button 
                      variant={isFollowing ? "default" : "outline"} 
                      size="sm"
                      onClick={handleFollow}
                    >
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShare}>
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {renderStars(healer.rating)}
                    </div>
                    <p className="font-bold">{healer.rating}</p>
                    <p className="text-xs text-muted-foreground">{healer.totalReviews} reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{healer.totalSessions}</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{healer.stats.successRate}%</p>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold">{healer.stats.repeatClients}%</p>
                    <p className="text-xs text-muted-foreground">Repeat Clients</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {healer.specialties.slice(0, 4).map((specialty) => (
                    <Badge key={specialty} variant="secondary">{specialty}</Badge>
                  ))}
                  {healer.specialties.length > 4 && (
                    <Badge variant="outline">+{healer.specialties.length - 4} more</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About Sarah</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="whitespace-pre-line text-muted-foreground">
                  {healer.bio}
                </div>
                
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Specialties</h4>
                    <div className="space-y-2">
                      {healer.specialties.map((specialty) => (
                        <div key={specialty} className="flex items-center gap-2">
                          <Badge variant="outline">{specialty}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Certifications</h4>
                    <div className="space-y-2">
                      {healer.certifications.map((cert) => (
                        <div key={cert} className="flex items-start gap-2">
                          <Award className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="grid gap-6">
              {Object.entries(healer.pricing).map(([key, session]) => (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="capitalize">{key} Session</CardTitle>
                        <CardDescription>{session.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${session.price}</p>
                        <p className="text-sm text-muted-foreground">{session.duration}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Video className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Virtual Available</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{session.duration}</span>
                        </div>
                      </div>
                      <Button variant="spiritual">Book Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Reviews</CardTitle>
                <CardDescription>
                  {healer.totalReviews} reviews • {healer.rating} average rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Rating Overview */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">{healer.rating}</div>
                    <div className="flex justify-center mb-2">
                      {renderStars(healer.rating)}
                    </div>
                    <p className="text-muted-foreground">Based on {healer.totalReviews} reviews</p>
                  </div>
                  
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-sm w-8">{stars}★</span>
                        <Progress value={stars === 5 ? 85 : stars === 4 ? 12 : 3} className="flex-1" />
                        <span className="text-sm text-muted-foreground w-8">
                          {stars === 5 ? "85%" : stars === 4 ? "12%" : "3%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Reviews */}
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {review.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{review.clientName}</p>
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{review.date}</p>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm">{review.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Availability & Response Time</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Schedule</h4>
                    <p className="text-muted-foreground mb-1">{healer.availability.schedule}</p>
                    <p className="text-sm text-muted-foreground">
                      Timezone: {healer.availability.timezone}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Response Time</h4>
                    <p className="text-muted-foreground">{healer.responseTime}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h4 className="font-semibold mb-2">Languages</h4>
                    <div className="flex gap-2">
                      {healer.languages.map((lang) => (
                        <Badge key={lang} variant="outline">{lang}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Session Types</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">Virtual</Badge>
                      <Badge variant="outline">In-Person</Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Button variant="spiritual" size="lg" className="w-full">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Available Times & Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HealerProfile;