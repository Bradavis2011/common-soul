import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  quality?: number;
  className?: string;
  fallback?: string;
  sizes?: string;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholder = 'empty',
  quality = 80,
  className,
  fallback,
  sizes,
  lazy = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy || priority);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, priority]);

  // Generate WebP version URL
  const getWebPSrc = (originalSrc: string): string => {
    if (originalSrc.startsWith('http')) {
      // External URL - assume CDN can convert
      return originalSrc;
    }
    // Local asset - check if WebP version exists
    const ext = originalSrc.split('.').pop();
    return originalSrc.replace(`.${ext}`, '.webp');
  };

  // Generate responsive srcSet
  const generateSrcSet = (baseSrc: string): string => {
    if (!width) return baseSrc;
    
    const widths = [width * 0.5, width, width * 1.5, width * 2];
    return widths
      .map(w => `${baseSrc}?w=${Math.round(w)}&q=${quality} ${Math.round(w)}w`)
      .join(', ');
  };

  const handleLoad = () => {
    setIsLoaded(true);
    setIsError(false);
  };

  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
  };

  // Don't render anything if not in view and lazy loading
  if (!isInView) {
    return (
      <div
        ref={imgRef}
        className={cn(
          'bg-muted animate-pulse',
          className
        )}
        style={{ width, height }}
      />
    );
  }

  const webpSrc = getWebPSrc(src);
  const fallbackSrc = isError && fallback ? fallback : src;

  return (
    <picture className={cn('block', className)}>
      {/* WebP source for modern browsers */}
      <source
        srcSet={generateSrcSet(webpSrc)}
        sizes={sizes}
        type="image/webp"
      />
      
      {/* Fallback for older browsers */}
      <img
        ref={imgRef}
        src={fallbackSrc}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          {
            'opacity-0': placeholder === 'blur' && !isLoaded,
            'opacity-100': isLoaded || placeholder === 'empty',
          },
          className
        )}
        {...props}
      />
      
      {/* Loading placeholder */}
      {placeholder === 'blur' && !isLoaded && !isError && (
        <div
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            className
          )}
          style={{ width, height }}
        />
      )}
      
      {/* Error fallback */}
      {isError && !fallback && (
        <div
          className={cn(
            'flex items-center justify-center bg-muted text-muted-foreground text-sm',
            className
          )}
          style={{ width, height }}
        >
          Failed to load image
        </div>
      )}
    </picture>
  );
};