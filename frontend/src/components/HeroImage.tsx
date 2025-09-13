import React from 'react';

interface HeroImageProps {
  children: React.ReactNode;
  className?: string;
}

export const HeroImage: React.FC<HeroImageProps> = ({ children, className = "" }) => {
  return (
    <section 
      className={`relative h-[70vh] flex items-center justify-center text-center ${className}`}
      style={{ 
        background: `
          linear-gradient(to bottom right, 
            rgba(44, 26, 77, 0.6),
            rgba(109, 63, 178, 0.5),
            rgba(196, 75, 199, 0.4)
          ),
          url('/optimized/spiritual-hero-sm.webp')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Picture element for responsive images */}
      <picture className="absolute inset-0 -z-10">
        {/* WebP sources for different screen sizes */}
        <source
          media="(min-width: 1200px)"
          srcSet="/optimized/spiritual-hero-xl.webp"
          type="image/webp"
        />
        <source
          media="(min-width: 768px)"
          srcSet="/optimized/spiritual-hero-lg.webp"
          type="image/webp"
        />
        <source
          media="(min-width: 480px)"
          srcSet="/optimized/spiritual-hero-md.webp"
          type="image/webp"
        />
        <source
          srcSet="/optimized/spiritual-hero-sm.webp"
          type="image/webp"
        />
        
        {/* JPEG fallbacks */}
        <source
          media="(min-width: 1200px)"
          srcSet="/optimized/spiritual-hero-xl.jpeg"
          type="image/jpeg"
        />
        <source
          media="(min-width: 768px)"
          srcSet="/optimized/spiritual-hero-lg.jpeg"
          type="image/jpeg"
        />
        <source
          media="(min-width: 480px)"
          srcSet="/optimized/spiritual-hero-md.jpeg"
          type="image/jpeg"
        />
        
        {/* Final fallback */}
        <img
          src="/optimized/spiritual-hero-lg.jpeg"
          alt="Spiritual healing background with serene mountain landscape"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="async"
        />
      </picture>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2C1A4D]/60 via-[#6D3FB2]/50 to-[#C44BC7]/40"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
        {children}
      </div>
    </section>
  );
};