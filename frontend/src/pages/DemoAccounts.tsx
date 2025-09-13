import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Heart, Star, Video, Calendar, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const DemoAccounts = () => {
  const demoHealers = [
    {
      name: "Sarah Moonwhisper",
      specialty: "Crystal Healing & Meditation",
      rating: 4.9,
      reviewCount: 127,
      location: "San Francisco, CA",
      avatar: "",
      tags: ["Crystal Healing", "Meditation", "Chakra Balancing"],
      description: "A certified crystal healer with over 10 years of experience helping souls find their inner peace and balance."
    },
    {
      name: "Marcus Lightbringer",
      specialty: "Reiki & Energy Healing",
      rating: 4.8,
      reviewCount: 89,
      location: "Boulder, CO",
      avatar: "",
      tags: ["Reiki", "Energy Healing", "Spiritual Counseling"],
      description: "A master Reiki practitioner specializing in energy healing and spiritual guidance."
    },
    {
      name: "Luna Starseeker",
      specialty: "Tarot & Astrology",
      rating: 4.9,
      reviewCount: 156,
      location: "Austin, TX",
      avatar: "",
      tags: ["Tarot", "Astrology", "Divination"],
      description: "An intuitive tarot reader and astrologer helping people connect with their spiritual path."
    }
  ];

  const demoTestimonials = [
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
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Demo Content Information</h1>
              <p className="text-muted-foreground">Learn about the demo healers and testimonials on our platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                DEMO
              </Badge>
              Platform Demo Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Common Soul is currently in development and testing phase. To demonstrate the platform's functionality
              and user experience, we've created fictional healer profiles, testimonials, and community content.
            </p>
            <p className="text-muted-foreground">
              All content marked with the <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 mx-1">DEMO</Badge> 
              badge represents placeholder content created for demonstration purposes only. These are not real healers, 
              testimonials, or community statistics.
            </p>
          </CardContent>
        </Card>

        {/* Demo Healers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Demo Healer Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The following healer profiles are fictional and created to showcase the platform's functionality:
            </p>
            <div className="space-y-4">
              {demoHealers.map((healer, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{healer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{healer.name}</h3>
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          DEMO
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{healer.specialty}</p>
                      <p className="text-sm text-muted-foreground mb-3">{healer.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4" style={{ fill: '#C44BC7', color: '#C44BC7' }} />
                          <span>{healer.rating} ({healer.reviewCount} reviews)</span>
                        </div>
                        <span>{healer.location}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {healer.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Demo Testimonials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Demo Testimonials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              The testimonials displayed on our homepage are fictional examples created to demonstrate 
              the types of experiences we aim to facilitate:
            </p>
            <div className="space-y-4">
              {demoTestimonials.map((testimonial, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4" style={{ fill: '#C44BC7', color: '#C44BC7' }} />
                      ))}
                    </div>
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                      DEMO
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Functional Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Functional Demo Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              While the content is demo, several platform features are fully functional for testing:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">User authentication and registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Session booking system</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Video calling interface</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Payment processing (test mode)</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Dashboard and user profiles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Calendar and scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Search and filtering</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm">Responsive design</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              How to Test Demo Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">1. Try Demo Session</h4>
                <p className="text-sm text-muted-foreground">
                  Visit the dashboard and click "Start Demo Session" to experience our video calling interface 
                  with Sarah Moonwhisper's crystal healing session.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">2. Explore Booking Process</h4>
                <p className="text-sm text-muted-foreground">
                  Navigate through the healer profiles and booking flow to experience the complete 
                  session scheduling process (payment processing is in test mode).
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-1">3. Browse Platform Features</h4>
                <p className="text-sm text-muted-foreground">
                  Explore the dashboard, calendar, and various platform features to understand 
                  the full user experience for both seekers and healers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Future Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              As we transition from demo to production, we will:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground ml-4">
              <li>• Replace demo content with real healer profiles and authentic testimonials</li>
              <li>• Implement comprehensive healer verification and onboarding</li>
              <li>• Add live payment processing and platform fee collection</li>
              <li>• Build community features with real user-generated content</li>
              <li>• Develop advanced matching algorithms between seekers and healers</li>
              <li>• Implement review and rating systems for completed sessions</li>
            </ul>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Transparency Commitment:</strong> We believe in honest communication with our users. 
                All demo content will be clearly labeled until replaced with authentic user-generated content 
                and verified healer profiles.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoAccounts;