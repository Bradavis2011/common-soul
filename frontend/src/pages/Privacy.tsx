import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Shield, FileText, Mail, Lock } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            Privacy Policy
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your Privacy Matters
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Last updated: January 2025
          </p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 prose max-w-none">
              <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li>• Account information (name, email, profile details)</li>
                <li>• Booking and payment information</li>
                <li>• Communication data between users and healers</li>
                <li>• Usage data and platform interactions</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li>• Facilitate connections between seekers and healers</li>
                <li>• Process payments and bookings</li>
                <li>• Provide customer support</li>
                <li>• Improve our platform and services</li>
                <li>• Ensure platform safety and security</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Our Commitment</h3>
                </div>
                <p className="text-green-800 text-sm">
                  We never sell your personal information to third parties. Your data is only shared with 
                  healers you choose to book with, and only the information necessary to provide services.
                </p>
              </div>

              <h2 className="text-2xl font-bold mb-4">Data Security</h2>
              <p className="text-muted-foreground mb-6">
                We use industry-standard encryption and security measures to protect your information. 
                All payment data is processed through PCI-compliant systems.
              </p>

              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li>• Access your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Delete your account and data</li>
                <li>• Control privacy settings</li>
                <li>• Opt-out of marketing communications</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-6">
                We use cookies to improve your experience and analyze platform usage. 
                You can control cookie settings in your browser.
              </p>

              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-6">
                For privacy-related questions or to exercise your rights, contact us at privacy@thecommonsoul.com
              </p>

              <Separator className="my-8" />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  For questions about compliance or legal matters, contact our legal team at:
                </p>
                <div className="flex items-center justify-center gap-2 font-medium">
                  <Mail className="w-4 h-4" />
                  <span>legal@thecommonsoul.com</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link to="/">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Privacy;