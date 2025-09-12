import { Link } from "react-router-dom";
import { ScrollLink } from "@/components/ScrollLink";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-spiritual rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Common Soul</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Connecting spiritual seekers with verified healers and authentic practices. 
              Your journey to healing starts here.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@thecommonsoul.com</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4">Platform</h3>
            <div className="space-y-2 text-sm">
              <ScrollLink to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">
                About Us
              </ScrollLink>
              <ScrollLink to="/healers" className="block text-muted-foreground hover:text-foreground transition-colors">
                Find Healers
              </ScrollLink>
              <ScrollLink to="/forum" className="block text-muted-foreground hover:text-foreground transition-colors">
                Community Forum
              </ScrollLink>
              <ScrollLink to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                Share Your Practice
              </ScrollLink>
            </div>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4">Support</h3>
            <div className="space-y-2 text-sm">
              <ScrollLink to="/support" className="block text-muted-foreground hover:text-foreground transition-colors">
                Help Center
              </ScrollLink>
              <ScrollLink to="/faq" className="block text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </ScrollLink>
              <ScrollLink to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                Contact Support
              </ScrollLink>
              <ScrollLink to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">
                Report Safety Issue
              </ScrollLink>
            </div>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="font-semibold mb-4">Legal</h3>
            <div className="space-y-2 text-sm">
              <ScrollLink to="/terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </ScrollLink>
              <ScrollLink to="/privacy" className="block text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </ScrollLink>
              <a 
                href="mailto:legal@thecommonsoul.com" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Legal Inquiries
              </a>
              <ScrollLink to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">
                Cookie Settings
              </ScrollLink>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2025 Common Soul. All rights reserved.
          </div>
          
          <div className="text-xs text-muted-foreground text-center md:text-right max-w-md">
            <p className="mb-1">
              <strong>IMPORTANT:</strong> This platform facilitates professional service connections and does not constitute 
              legal, financial, or professional advice.
            </p>
            <p>
              Users should consult appropriate professionals for specific guidance. 
              All services are subject to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Legal Contact */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            For compliance or legal matters, contact our legal team at: 
            <a 
              href="mailto:legal@thecommonsoul.com" 
              className="ml-1 text-foreground hover:underline"
            >
              legal@thecommonsoul.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};