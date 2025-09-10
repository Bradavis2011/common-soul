import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchFilters } from "@/components/SearchFilters";
import { HealerCard } from "@/components/HealerCard";
import { SocialPost } from "@/components/SocialPost";
import { Search, Users, Calendar, Heart, Star, TrendingUp, MessageCircle, PlayCircle, Leaf, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { apiService } from '@/services/api';
import spiritualHero from "@/assets/spiritual-hero.jpg";

const mockHealers = [
  {
    name: "Sarah Moonwhisper",
    specialty: "Crystal Healing & Meditation",
    rating: 4.9,
    reviewCount: 127,
    location: "San Francisco, CA",
    isVirtual: true,
    price: "$85/session",
    avatar: "",
    tags: ["Crystal Healing", "Meditation", "Chakra Balancing"],
    isDemo: true
  },
  {
    name: "Marcus Lightbringer",
    specialty: "Reiki & Energy Healing",
    rating: 4.8,
    reviewCount: 89,
    location: "Boulder, CO",
    isVirtual: true,
    price: "$75/session",
    avatar: "",
    tags: ["Reiki", "Energy Healing", "Spiritual Counseling"],
    isDemo: true
  },
  {
    name: "Luna Starseeker",
    specialty: "Tarot & Astrology",
    rating: 4.9,
    reviewCount: 156,
    location: "Austin, TX",
    isVirtual: true,
    price: "$60/session",
    avatar: "",
    tags: ["Tarot", "Astrology", "Divination"],
    isDemo: true
  }
];

const mockPosts = [
  {
    author: "EmmaJourney",
    timeAgo: "2 hours ago",
    content: "Had the most incredible sound healing session today. The vibrations completely shifted my energy and I feel so aligned now. Grateful for this healing journey! 🔮✨",
    tags: ["soundhealing", "gratitude", "healing"],
    likes: 24,
    comments: 7
  },
  {
    author: "SoulSeeker92",
    timeAgo: "5 hours ago", 
    content: "Three months into my spiritual awakening journey and I'm amazed at how much has changed. Learning to trust my intuition has been life-changing. Would love to connect with others on similar paths!",
    tags: ["awakening", "intuition", "journey"],
    likes: 18,
    comments: 12
  },
  {
    author: "CrystalMama",
    timeAgo: "1 day ago",
    content: "Setting up my new sacred space with amethyst and rose quartz. The energy in this corner of my home feels so peaceful now. Creating sacred space is so important for our practice 💜",
    tags: ["crystals", "sacredspace", "energy"],
    likes: 31,
    comments: 9
  }
];

const Index = () => {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const userType = user?.userType;
  const [featuredHealers, setFeaturedHealers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch featured healers on component mount
  useEffect(() => {
    const fetchFeaturedHealers = async () => {
      try {
        const response = await apiService.getHealers({ limit: 3, sortBy: 'rating' });
        if (response.success) {
          setFeaturedHealers(response.data.healers || []);
        } else {
          // Fall back to mock data if API fails
          setFeaturedHealers(mockHealers);
        }
      } catch (error) {
        console.error('Failed to fetch healers:', error);
        // Fall back to mock data on error
        setFeaturedHealers(mockHealers);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedHealers();
  }, []);

  const handleBookSession = (healerName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to book a session.",
      });
      return;
    }
    
    toast({
      title: "Booking Session",
      description: `Redirecting to book with ${healerName}...`,
    });
  };

  const handleJoinCommunity = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to join our community.",
      });
      return;
    }
    
    toast({
      title: "Welcome to the Community!", 
      description: "Share your spiritual journey with fellow seekers.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative h-[70vh] flex items-center justify-center text-center bg-cover bg-center"
        style={{ backgroundImage: `url(${spiritualHero})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-background/60 to-background/40"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Find Your
            <span className="block bg-gradient-spiritual bg-clip-text text-transparent">
              Spiritual Guide
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with authentic spiritual healers, shamans, and guides. Book virtual or local sessions, ceremonies, and discover your path to healing.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to={isAuthenticated ? "/healers" : "/login"}>
              <Button variant="aurora" size="lg" className="px-8">
                <Search className="w-5 h-5 mr-2" />
                Find Healers
              </Button>
            </Link>
            <Link to={!isAuthenticated ? "/login" : userType === 'HEALER' ? "/healer-management" : "/dashboard"}>
              <Button variant="outline" size="lg" className="px-8">
                <Leaf className="w-5 h-5 mr-2" />
                Share Your Practice
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <Link to={isAuthenticated ? "/healers" : "/login"}>
              <Card className="text-center hover:shadow-spiritual transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-spiritual rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Discover Healers</h3>
                  <p className="text-sm text-muted-foreground">Find authentic spiritual practitioners near you or online</p>
                </CardContent>
              </Card>
            </Link>
            <Link to={isAuthenticated ? "/booking" : "/login"}>
              <Card className="text-center hover:shadow-nature transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-nature rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Book Sessions</h3>
                  <p className="text-sm text-muted-foreground">Schedule virtual or in-person healing sessions</p>
                </CardContent>
              </Card>
            </Link>
            <Link to={isAuthenticated ? "/forum" : "/login"}>
              <Card className="text-center hover:shadow-glow transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Join Community</h3>
                  <p className="text-sm text-muted-foreground">Connect with others on their spiritual journey</p>
                </CardContent>
              </Card>
            </Link>
            <Link to={!isAuthenticated ? "/login" : userType === 'HEALER' ? "/healer-management" : "/contact"}>
              <Card className="text-center hover:shadow-spiritual transition-all duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-aurora rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Share Experiences</h3>
                  <p className="text-sm text-muted-foreground">Document and share your healing journey</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Search & Filters */}
            <div className="lg:col-span-1">
              <SearchFilters />
            </div>

            {/* Healers Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-6">Featured Healers</h2>
              <div className="grid gap-6">
                {loading ? (
                  // Loading skeleton
                  <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : featuredHealers.length > 0 ? (
                  featuredHealers.map((healer, index) => (
                    <div key={healer.id || index} className="group">
                      <HealerCard {...healer} isDemo={false} />
                      <div className="mt-4 flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Link to={isAuthenticated ? `/healer/${healer.id}` : "/login"}>
                          <Button variant="outline" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Session
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleBookSession(healer.name)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Show mock healers if no real healers are available
                  mockHealers.map((healer, index) => (
                    <div key={index} className="group">
                      <HealerCard {...healer} isDemo={healer.isDemo} />
                      <div className="mt-4 flex gap-3 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Link to={isAuthenticated ? "/booking" : "/login"}>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4 mr-2" />
                          Book Session
                        </Button>
                      </Link>
                      <Link to={isAuthenticated ? "/messages" : "/login"}>
                        <Button variant="spiritual" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-center mt-8">
                <Link to={isAuthenticated ? "/healers" : "/login"}>
                  <Button variant="spiritual" size="lg">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    View All Healers
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Feed */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Sample Community Experiences</h2>
          <div className="space-y-6">
            {mockPosts.map((post, index) => (
              <SocialPost key={index} {...post} />
            ))}
          </div>
          <div className="text-center mt-8 space-y-4">
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to={!isAuthenticated ? "/login" : userType === 'HEALER' ? "/healer-management" : "/dashboard"}>
                <Button variant="nature" size="lg">
                  <Leaf className="w-5 h-5 mr-2" />
                  Share Your Practice
                </Button>
              </Link>
              <Link to={isAuthenticated ? "/forum" : "/login"}>
                <Button variant="outline" size="lg">
                  <Users className="w-5 h-5 mr-2" />
                  Join Community Chat
                </Button>
              </Link>
            </div>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                <span>Demo Platform Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Testimonials */}
      <section className="py-16 px-6 bg-gradient-to-r from-muted/20 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Sample Testimonials</h2>
            <p className="text-muted-foreground">Example experiences from our demo healing sessions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Jessica M.",
                role: "Spiritual Seeker",
                text: "The crystal healing session with Sarah completely shifted my energy. I feel more balanced and connected than ever before.",
                rating: 5
              },
              {
                name: "David K.",
                role: "Regular Client",
                text: "Marcus's Reiki sessions have been life-changing. The platform makes it so easy to book and connect with authentic healers.",
                rating: 5
              },
              {
                name: "Luna R.",
                role: "Community Member",
                text: "I love sharing my journey here and connecting with like-minded souls. This community is truly special.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="hover:shadow-spiritual transition-all duration-300 relative">
                <CardContent className="p-6">
                  <Badge variant="outline" className="absolute top-2 right-2 text-xs text-orange-600 border-orange-300">
                    DEMO
                  </Badge>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to={isAuthenticated ? "/healers" : "/login"}>
              <Button variant="aurora" size="lg">
                <Award className="w-5 h-5 mr-2" />
                Start Your Journey Today
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;