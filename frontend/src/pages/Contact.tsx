import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, Send, Heart, MessageCircle, Leaf } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    message: "",
    shareStory: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call - replace with actual backend implementation
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent Successfully!",
        description: formData.category === "journey" 
          ? "Thank you for your interest in joining our healer network! We'll review your application and contact you within 2-3 business days."
          : "We've received your message and will get back to you within 24 hours."
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        category: "",
        message: "",
        shareStory: false
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "General inquiries",
      value: "hello@thecommonsoul.com",
      color: "text-spiritual"
    },
    {
      icon: Mail,
      title: "Legal Matters",
      description: "Compliance & legal questions",
      value: "legal@thecommonsoul.com",
      color: "text-nature"
    },
    {
      icon: Clock,
      title: "Response Time",
      description: "Typical response",
      value: "Within 24 hours",
      color: "text-sunset"
    },
    {
      icon: MapPin,
      title: "Based In",
      description: "We're a remote team",
      value: "United States",
      color: "text-aurora"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            Contact Us
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Whether you have questions, want to share your healing journey, or need support, we're here to help connect you with the right resources.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">How to Reach Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-full bg-gradient-spiritual flex items-center justify-center mx-auto mb-4 ${method.color}`}>
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{method.description}</p>
                    <p className="font-medium">{method.value}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Send us a Message</CardTitle>
              <p className="text-muted-foreground">
                We'd love to hear from you. Choose a category below to help us route your message appropriately.
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Message Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="journey">Share Your Practice</SelectItem>
                      <SelectItem value="support">Technical Support</SelectItem>
                      <SelectItem value="healer">Become a Healer</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="legal">Legal/Compliance</SelectItem>
                      <SelectItem value="feedback">Platform Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.category === "journey" && (
                    <div className="mt-4 p-4 bg-spiritual/10 border border-spiritual/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf className="w-5 h-5 text-spiritual" />
                        <p className="font-medium text-spiritual">Share Your Practice</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Join our verified healer network! Tell us about your practice, credentials, and experience to help others on their healing journey. All applications are reviewed for authenticity.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Brief subject line"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder={formData.category === "journey" 
                      ? "Share your healing journey, transformation, or experience with spiritual practices..."
                      : "Please provide as much detail as possible..."
                    }
                    className="min-h-[120px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.message.length}/1000 characters
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="text-sm text-muted-foreground">
                    <p>We typically respond within 24 hours.</p>
                    <p>For urgent matters, please specify in your subject line.</p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !formData.name || !formData.email || !formData.message}
                    className="px-8"
                    variant="spiritual"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Teaser */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Looking for Quick Answers?</h2>
          <p className="text-muted-foreground mb-8">
            Check our frequently asked questions for instant help with common queries.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="outline" asChild>
              <a href="/faq">
                <MessageCircle className="w-4 h-4 mr-2" />
                Visit FAQ
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/support">
                <Heart className="w-4 h-4 mr-2" />
                Get Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;