import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Users, Heart, Award, Clock, Star, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const features = [
    {
      icon: Shield,
      title: "Rigorous Vetting",
      description: "Every Reiki master, energy healer, spiritual counselor, and ceremony leader on our platform undergoes a comprehensive review process, including background checks, reference verification, and an authentic practice review.",
      color: "text-spiritual"
    },
    {
      icon: TrendingUp,
      title: "Transparent Pricing",
      description: "No hidden fees, no pressure to buy expensive packages. You see session rates upfront and book directly with practitioners. We facilitate the introduction and booking process with a simple, clear platform fee.",
      color: "text-nature"
    },
    {
      icon: Heart,
      title: "A Safe, Supportive Space",
      description: "Every healer is verified and bound by our community's ethical standards. We provide secure communication channels and support for your journey.",
      color: "text-sunset"
    },
    {
      icon: Users,
      title: "Seeker-Controlled Experience",
      description: "You maintain complete control over your information, your choices, and your path. We provide the connection to authentic practitioners, then empower you to lead your own journey.",
      color: "text-aurora"
    }
  ];

  const timeline = [
    {
      period: "Week 1",
      description: "Instead of spending months navigating an uncertain landscape, you are connected with vetted healers who resonate with your needs."
    },
    {
      period: "Month 1", 
      description: "You are working with authentic practitioners, you've experienced genuine healing sessions, and you feel a deep sense of trust in your support network."
    },
    {
      period: "Month 6",
      description: "You are focusing entirely on your growth instead of worrying about a practitioner's legitimacy. Your progress accelerates because your energy is spent on healing, not skepticism."
    },
    {
      period: "Year 1",
      description: "You have built a sustainable spiritual practice with trusted guides, consistent ceremony attendance, and the peace of mind that comes from being part of a safe and authentic community."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            About Common Soul
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            You're Seeking a 
            <span className="block bg-gradient-spiritual bg-clip-text text-transparent">
              Deeper Connection
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            You feel a pull towards something more—be it healing, guidance, or a stronger sense of purpose. But in a crowded and confusing wellness space, a crucial question arises: <strong>Who can I trust?</strong>
          </p>
        </div>
      </section>

      {/* The Search for Clarity */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Search for Clarity</h2>
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Right now, you're likely spending hours trying to find answers: How do I find a legitimate Reiki master? Where can I find spiritual guidance that feels safe? Are there healers who will respect my boundaries during vulnerable moments? How do I know if someone is truly gifted or just has good marketing?
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                You're navigating a sea of conflicting advice from online forums, social media, and targeted ads—most of it unverified. Meanwhile, every day you delay finding the support you need is another day of carrying burdens that could be lifted.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Why Common Soul Exists */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Why Common Soul Exists</h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            We created Common Soul because the path to healing should feel clear and safe. We believe that finding a trusted guide shouldn't be a matter of luck or endless, anxious searching.
          </p>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Unlike open marketplaces with no quality control, we aren't here to sell you crystals or quick fixes. We are here to build a bridge of trust for you—connecting you with practitioners whose integrity and skill have been thoughtfully verified. We are your advocates for a safer, more transparent spiritual journey.
          </p>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How We're Different</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-spiritual flex items-center justify-center ${feature.color}`}>
                        <Icon className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Changes With Common Soul */}
      <section className="py-16 px-6 bg-gradient-to-br from-muted/20 to-background">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Changes With Common Soul</h2>
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <Badge variant="default" className="bg-gradient-spiritual text-primary-foreground px-4 py-2">
                        {item.period}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground leading-relaxed flex-1">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Our Promise to You</h2>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-8">
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Our success is measured by one thing: connecting you with authentic spiritual practitioners who genuinely support your healing journey. You've been cautious about seeking help for good reason. With Common Soul, that discernment is honored.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We built the platform we wished we had when we began our own journeys.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-spiritual/10 to-aurora/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to find your guide with confidence?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            <strong>Common Soul: Your Bridge to Trusted Healing</strong>
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/healers">
              <Button variant="spiritual" size="lg" className="px-8">
                <Star className="w-5 h-5 mr-2" />
                Find Healers
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="px-8">
                <Award className="w-5 h-5 mr-2" />
                Start Your Journey
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;