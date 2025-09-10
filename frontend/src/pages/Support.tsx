import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Settings, 
  CreditCard, 
  Shield,
  Phone,
  Mail,
  Clock,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

const Support = () => {
  const supportCategories = [
    {
      icon: HelpCircle,
      title: "Getting Started",
      description: "Learn the basics of using Common Soul",
      articles: [
        "How to create your account",
        "Finding the right healer for you", 
        "Understanding our vetting process",
        "Setting up your profile"
      ],
      color: "text-spiritual"
    },
    {
      icon: Settings,
      title: "Account & Profile",
      description: "Manage your account settings",
      articles: [
        "Update your profile information",
        "Privacy and notification settings",
        "Deleting your account",
        "Verifying your email"
      ],
      color: "text-nature"
    },
    {
      icon: CreditCard,
      title: "Booking & Payments",
      description: "Session booking and payment help",
      articles: [
        "How to book a session",
        "Payment methods and billing",
        "Cancellation and refund policy",
        "Session preparation tips"
      ],
      color: "text-sunset"
    },
    {
      icon: Shield,
      title: "Safety & Trust",
      description: "Platform safety and security",
      articles: [
        "Our healer verification process",
        "Reporting inappropriate behavior",
        "Community guidelines",
        "Data privacy and security"
      ],
      color: "text-aurora"
    }
  ];

  const contactOptions = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      value: "hello@thecommonsoul.com",
      response: "Within 24 hours"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      value: "Available 9am-6pm PST",
      response: "Immediate response"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with a support specialist",
      value: "1-800-SOUL-HELP",
      response: "Mon-Fri 9am-6pm PST"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            Support Center
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How can we help you?
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions, get help with your account, or reach out to our support team.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <HelpCircle className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles..."
              className="pl-12 h-14 text-lg"
            />
            <Button className="absolute right-2 top-2 h-10" variant="spiritual">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Popular Help Topics</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-full bg-gradient-spiritual flex items-center justify-center mb-4 ${category.color}`}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{category.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <div key={articleIndex} className="flex items-center gap-2 text-sm hover:text-spiritual cursor-pointer">
                        <Book className="w-3 h-3" />
                        <span>{article}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground mb-8">
            Find quick answers to the most common questions about Common Soul.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How are healers vetted?</h3>
                <p className="text-sm text-muted-foreground">
                  Every healer undergoes background checks, reference verification, and practice review before joining our platform.
                </p>
              </CardContent>
            </Card>
            <Card className="text-left">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What if I'm not satisfied with a session?</h3>
                <p className="text-sm text-muted-foreground">
                  We offer a satisfaction guarantee and will work with you to find a better match or provide a refund.
                </p>
              </CardContent>
            </Card>
          </div>
          <Link to="/faq">
            <Button variant="outline" size="lg">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All FAQs
            </Button>
          </Link>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
            <p className="text-muted-foreground">
              Our support team is here to help you with any questions or issues.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-gradient-spiritual rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                    <p className="font-medium mb-2">{option.value}</p>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{option.response}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
            <Link to="/contact">
              <Button variant="spiritual" size="lg">
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Emergency Support */}
      <section className="py-16 px-6 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="max-w-4xl mx-auto">
          <Card className="border-amber-200">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Emergency or Safety Concerns?</h2>
              <p className="text-muted-foreground mb-6">
                If you're experiencing a safety concern or emergency situation, please contact local emergency services immediately. 
                For platform-related safety issues, contact our emergency support line.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="destructive" size="lg">
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency: Call 911
                </Button>
                <Button variant="outline" size="lg">
                  <Shield className="w-4 h-4 mr-2" />
                  Report Safety Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Support;