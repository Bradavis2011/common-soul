import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { FileText, Shield, Mail } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2">
            Legal
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Terms of Service
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
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground mb-6">
                By accessing and using Common Soul ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services.
              </p>

              <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
              <p className="text-muted-foreground mb-6">
                Common Soul is a platform that connects spiritual seekers with verified healers and practitioners. 
                We facilitate connections and bookings but do not directly provide healing services.
              </p>

              <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <ul className="text-muted-foreground mb-6 space-y-2">
                <li>• Provide accurate information during registration</li>
                <li>• Respect other users and maintain appropriate behavior</li>
                <li>• Comply with all applicable laws and regulations</li>
                <li>• Report any safety concerns immediately</li>
              </ul>

              <h2 className="text-2xl font-bold mb-4">4. Platform Fees and Payments</h2>
              <p className="text-muted-foreground mb-6">
                We charge platform fees for completed bookings. All fees are disclosed upfront. 
                Payments are processed securely through third-party payment processors.
              </p>

              <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-800">Important Disclaimer</h3>
                </div>
                <p className="text-amber-800 text-sm">
                  <strong>IMPORTANT:</strong> This platform facilitates professional service connections and does not constitute 
                  legal, financial, or professional advice. Users should consult appropriate professionals for specific guidance. 
                  All services are subject to our Terms of Service and Privacy Policy.
                </p>
              </div>
              <p className="text-muted-foreground mb-6">
                Common Soul is not liable for the actions, services, or conduct of healers or users on the platform. 
                We are not responsible for the outcomes of healing sessions or disputes between users and healers.
              </p>

              <h2 className="text-2xl font-bold mb-4">6. Prohibited Activities</h2>
              <p className="text-muted-foreground mb-6">
                Users may not engage in fraudulent behavior, harassment, spam, or any activity that violates 
                our community guidelines or applicable laws.
              </p>

              <h2 className="text-2xl font-bold mb-4">7. Termination</h2>
              <p className="text-muted-foreground mb-6">
                We reserve the right to terminate accounts that violate these terms or engage in harmful behavior.
              </p>

              <h2 className="text-2xl font-bold mb-4">8. Changes to Terms</h2>
              <p className="text-muted-foreground mb-6">
                We may update these terms periodically. Users will be notified of significant changes.
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

export default Terms;