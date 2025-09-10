import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Search, HelpCircle, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const faqCategories = [
    {
      title: "Getting Started",
      faqs: [
        {
          id: "getting-started-1",
          question: "How do I create an account on Common Soul?",
          answer: "Creating an account is simple! Click 'Join Now' at the top of any page, choose whether you're seeking healing services or offering them as a healer, and fill out the registration form. You'll need to verify your email address to complete the process."
        },
        {
          id: "getting-started-2", 
          question: "What makes Common Soul different from other wellness platforms?",
          answer: "Common Soul focuses exclusively on verified spiritual healers and authentic practices. Every healer undergoes rigorous vetting including background checks, reference verification, and practice review. We prioritize safety, transparency, and authentic spiritual connections over volume."
        },
        {
          id: "getting-started-3",
          question: "Is Common Soul free to use?",
          answer: "Creating an account and browsing healers is completely free. We charge a small platform fee when you book sessions, which helps us maintain our high-quality vetting process and secure platform. All fees are transparent and shown upfront."
        }
      ]
    },
    {
      title: "Finding & Booking Healers",
      faqs: [
        {
          id: "booking-1",
          question: "How are healers vetted on Common Soul?",
          answer: "Our comprehensive vetting process includes: background checks, reference verification from previous clients, validation of certifications and training, review of practice authenticity, and ongoing community feedback monitoring. Only practitioners who meet our strict standards are accepted."
        },
        {
          id: "booking-2",
          question: "Can I book virtual sessions?",
          answer: "Yes! Many healers offer virtual sessions via video call. You can filter search results to show only virtual options, or look for the 'Virtual' badge on healer profiles. Virtual sessions work great for practices like Reiki, spiritual counseling, tarot readings, and energy healing."
        },
        {
          id: "booking-3",
          question: "How do I cancel or reschedule a session?",
          answer: "You can cancel or reschedule sessions up to 24 hours before the scheduled time through your dashboard. Late cancellations may be subject to fees as determined by the individual healer's policy, which is clearly stated during booking."
        },
        {
          id: "booking-4",
          question: "What if I'm not satisfied with a session?",
          answer: "We offer a satisfaction guarantee. If you're not happy with a session, contact our support team within 48 hours. We'll work with you to find a resolution, which may include connecting you with a different healer or processing a refund based on the circumstances."
        }
      ]
    },
    {
      title: "Payments & Pricing",
      faqs: [
        {
          id: "payment-1",
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, PayPal, and digital wallets like Apple Pay and Google Pay. All payments are processed securely through encrypted payment systems."
        },
        {
          id: "payment-2",
          question: "When am I charged for a session?",
          answer: "Payment is processed when you confirm your booking. For sessions scheduled more than 24 hours in advance, we place a hold on your payment method and charge it 24 hours before the session to account for any last-minute cancellations."
        },
        {
          id: "payment-3",
          question: "What are the platform fees?",
          answer: "We charge a small platform fee of 5-10% (depending on session price) to cover our vetting process, secure payment processing, and platform maintenance. This fee is clearly displayed during checkout before you complete your booking."
        },
        {
          id: "payment-4",
          question: "Can I get a refund?",
          answer: "Refunds are handled on a case-by-case basis. Full refunds are available for cancellations made 24+ hours in advance. For quality concerns, we work with both you and the healer to find a fair resolution, which may include partial or full refunds."
        }
      ]
    },
    {
      title: "Safety & Trust",
      faqs: [
        {
          id: "safety-1",
          question: "How do you ensure healer authenticity?",
          answer: "We verify each healer's identity, check their credentials and training, contact references from previous clients, review their practice methodology for authenticity, and continuously monitor community feedback. Healers who don't maintain our standards are removed."
        },
        {
          id: "safety-2",
          question: "What should I do if I feel uncomfortable during a session?",
          answer: "Your comfort and safety are our top priorities. You have the right to end any session at any time. If you experience inappropriate behavior, contact our support team immediately at hello@thecommonsoul.com or use the report feature on the healer's profile."
        },
        {
          id: "safety-3",
          question: "How do you protect my personal information?",
          answer: "We use bank-level encryption to protect your data, never sell personal information to third parties, store payment information securely through PCI-compliant systems, and give you full control over your privacy settings and data sharing preferences."
        },
        {
          id: "safety-4",
          question: "Can I report inappropriate behavior?",
          answer: "Absolutely. We have a comprehensive reporting system for any concerns about healer behavior, platform misuse, or safety issues. Reports are reviewed by our trust and safety team within 24 hours, and appropriate action is taken to protect our community."
        }
      ]
    },
    {
      title: "For Healers",
      faqs: [
        {
          id: "healer-1",
          question: "How do I become a healer on Common Soul?",
          answer: "Apply through our healer application process, which includes submitting your credentials, providing references, undergoing background verification, and completing our authenticity review. The process typically takes 1-2 weeks, and we maintain high standards to ensure community trust."
        },
        {
          id: "healer-2",
          question: "What percentage does Common Soul take from sessions?",
          answer: "We take a 15-20% commission from session fees, which covers payment processing, marketing, vetting costs, and platform maintenance. This is competitive with other platforms and much lower than traditional spa or wellness center commissions."
        },
        {
          id: "healer-3",
          question: "How do I set my availability and pricing?",
          answer: "Once approved, you'll have access to your healer dashboard where you can set your schedule, session types, pricing, and availability preferences. You have full control over your calendar and can update it anytime."
        },
        {
          id: "healer-4",
          question: "How are payments handled for healers?",
          answer: "We process payments automatically and transfer your earnings weekly (minus platform fees) directly to your bank account or PayPal. You'll receive detailed reports of all transactions and fees through your dashboard."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            Frequently Asked Questions
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Find Your Answers
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Get quick answers to common questions about Common Soul, booking sessions, and our platform.
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search FAQ..."
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          {filteredFAQs.length > 0 ? (
            <div className="space-y-8">
              {filteredFAQs.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <h2 className="text-2xl font-bold mb-6">{category.title}</h2>
                  <div className="space-y-4">
                    {category.faqs.map((faq) => (
                      <Card key={faq.id}>
                        <Collapsible 
                          open={openItems.includes(faq.id)}
                          onOpenChange={() => toggleItem(faq.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <CardHeader className="hover:bg-muted/50 cursor-pointer">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg text-left">{faq.question}</CardTitle>
                                <ChevronDown 
                                  className={`w-5 h-5 transition-transform ${
                                    openItems.includes(faq.id) ? 'rotate-180' : ''
                                  }`} 
                                />
                              </div>
                            </CardHeader>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <CardContent className="pt-0">
                              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            </CardContent>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or browse all categories above.
                </p>
                <Button onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-muted-foreground mb-8">
            Can't find the answer you're looking for? Our support team is here to help.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/contact">
              <Button variant="spiritual">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="outline">
                <HelpCircle className="w-4 h-4 mr-2" />
                Support Center
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;