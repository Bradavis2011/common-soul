import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schemaData?: object;
}

export const SEOHead = ({ 
  title = "Common Soul - Connect with Spiritual Healers",
  description = "Connect with verified spiritual healers, book sessions, and embark on your healing journey. Find the perfect healer for your spiritual growth and wellbeing.",
  keywords = "spiritual healing, healers, reiki, crystal healing, energy healing, spiritual guidance, meditation, chakra healing, spiritual wellness",
  image = "/og-image.png",
  url = "https://thecommonsoul.com",
  type = "website",
  schemaData
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    updateMetaTag('name', 'description', description);
    updateMetaTag('name', 'keywords', keywords);
    
    // Update Open Graph meta tags
    updateMetaTag('property', 'og:title', title);
    updateMetaTag('property', 'og:description', description);
    updateMetaTag('property', 'og:image', image);
    updateMetaTag('property', 'og:url', url);
    updateMetaTag('property', 'og:type', type);
    
    // Update Twitter meta tags
    updateMetaTag('name', 'twitter:title', title);
    updateMetaTag('name', 'twitter:description', description);
    updateMetaTag('name', 'twitter:image', image);
    
    // Add structured data if provided
    if (schemaData) {
      addStructuredData(schemaData);
    }
    
    // Cleanup function
    return () => {
      // Remove any dynamically added structured data
      const existingScript = document.getElementById('dynamic-schema');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, keywords, image, url, type, schemaData]);

  const updateMetaTag = (attribute: string, selector: string, content: string) => {
    let element = document.querySelector(`meta[${attribute}="${selector}"]`) as HTMLMetaElement;
    
    if (element) {
      element.content = content;
    } else {
      element = document.createElement('meta');
      element.setAttribute(attribute, selector);
      element.content = content;
      document.head.appendChild(element);
    }
  };

  const addStructuredData = (data: object) => {
    // Remove existing dynamic structured data
    const existingScript = document.getElementById('dynamic-schema');
    if (existingScript) {
      existingScript.remove();
    }
    
    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'dynamic-schema';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  };

  return null; // This component doesn't render anything
};

// Predefined SEO configurations for common pages
export const seoConfigs = {
  home: {
    title: "Common Soul - Connect with Spiritual Healers & Energy Workers",
    description: "Find verified spiritual healers, energy workers, and wellness practitioners. Book sessions for reiki, crystal healing, chakra alignment, and spiritual guidance. Start your healing journey today.",
    keywords: "spiritual healing, healers directory, reiki healing, crystal healing, energy healing, chakra balancing, spiritual guidance, wellness practitioners, holistic healing",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Common Soul - Spiritual Healing Platform",
      "description": "Connect with verified spiritual healers and book healing sessions",
      "url": "https://thecommonsoul.com"
    }
  },
  
  healers: {
    title: "Find Spiritual Healers & Energy Workers | Common Soul",
    description: "Browse our directory of verified spiritual healers, reiki masters, crystal healers, and energy workers. Read reviews, compare services, and book your healing session today.",
    keywords: "find healers, spiritual healers directory, reiki practitioners, crystal healers, energy workers, healing services, spiritual practitioners",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Spiritual Healers Directory",
      "description": "Find and book sessions with verified spiritual healers",
      "url": "https://thecommonsoul.com/healers"
    }
  },
  
  about: {
    title: "About Common Soul - Your Spiritual Healing Community",
    description: "Learn about Common Soul's mission to connect spiritual seekers with authentic healers. Discover our commitment to verified practitioners and safe healing experiences.",
    keywords: "about common soul, spiritual community, healing platform mission, authentic healers, spiritual wellness",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Common Soul",
      "description": "Learn about our spiritual healing platform and mission",
      "url": "https://thecommonsoul.com/about"
    }
  },
  
  contact: {
    title: "Contact Common Soul - Get Support & Share Your Practice",
    description: "Contact Common Soul for support, questions, or to join our healer network. We're here to help you on your spiritual healing journey.",
    keywords: "contact common soul, healer application, spiritual healing support, join healer network",
    schemaData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Common Soul",
      "description": "Get in touch with Common Soul for support or to join our network",
      "url": "https://thecommonsoul.com/contact"
    }
  },
  
  login: {
    title: "Login to Common Soul - Access Your Spiritual Healing Account",
    description: "Login to your Common Soul account to book healing sessions, message healers, and manage your spiritual wellness journey.",
    keywords: "login common soul, spiritual healing account, healer login, customer login"
  }
};