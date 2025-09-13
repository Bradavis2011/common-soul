import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from './useDebounce';

export interface SearchFilters {
  search: string;
  location: string;
  specialties: string[];
  priceRange: [number, number];
  sessionTypes: string[];
  availability: string[];
  minRating: number;
  languages: string[];
  experience: [number, number];
  sortBy: string;
  radius: number; // in miles for location-based search
}

export interface Healer {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  location: string;
  coordinates?: { lat: number; lng: number };
  isVirtual: boolean;
  price: string;
  priceValue: number; // numeric value for filtering
  avatar: string;
  tags: string[];
  experience: string;
  experienceYears: number;
  sessionTypes: string[];
  languages: string[];
  availability: string;
  bio: string;
  verified: boolean;
  responseTime: string;
  distance?: number; // calculated distance from user location
}

const DEFAULT_FILTERS: SearchFilters = {
  search: '',
  location: '',
  specialties: [],
  priceRange: [0, 200],
  sessionTypes: [],
  availability: [],
  minRating: 0,
  languages: [],
  experience: [0, 20],
  sortBy: 'rating',
  radius: 25,
};

export const useAdvancedSearch = (initialFilters: Partial<SearchFilters> = {}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  
  const [healers, setHealers] = useState<Healer[]>([]);
  const [filteredHealers, setFilteredHealers] = useState<Healer[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedLocation = useDebounce(filters.location, 500);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Could not get user location:', error);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    }
  }, []);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Enhanced filtering function
  const applyFilters = useCallback((healersList: Healer[]): Healer[] => {
    let filtered = healersList.filter(healer => {
      // Text search across multiple fields
      const searchMatch = !debouncedSearch || [
        healer.name,
        healer.specialty,
        healer.bio,
        ...healer.tags,
        ...healer.languages,
      ].some(field => 
        field.toLowerCase().includes(debouncedSearch.toLowerCase())
      );

      // Location filter with radius support
      let locationMatch = true;
      if (debouncedLocation && userLocation && healer.coordinates) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          healer.coordinates.lat,
          healer.coordinates.lng
        );
        healer.distance = distance; // Store for sorting
        locationMatch = distance <= filters.radius;
      } else if (debouncedLocation) {
        // Fallback to text-based location matching
        locationMatch = healer.location
          .toLowerCase()
          .includes(debouncedLocation.toLowerCase());
      }

      // Specialty filter (multiple selection)
      const specialtyMatch = filters.specialties.length === 0 || 
        filters.specialties.some(specialty =>
          healer.tags.some(tag => 
            tag.toLowerCase().includes(specialty.toLowerCase())
          )
        );

      // Price range filter
      const priceMatch = healer.priceValue >= filters.priceRange[0] && 
        healer.priceValue <= filters.priceRange[1];

      // Session type filter
      const sessionTypeMatch = filters.sessionTypes.length === 0 ||
        filters.sessionTypes.some(type => healer.sessionTypes.includes(type));

      // Rating filter
      const ratingMatch = healer.rating >= filters.minRating;

      // Language filter
      const languageMatch = filters.languages.length === 0 ||
        filters.languages.some(lang => healer.languages.includes(lang));

      // Experience filter
      const experienceMatch = healer.experienceYears >= filters.experience[0] &&
        healer.experienceYears <= filters.experience[1];

      return searchMatch && locationMatch && specialtyMatch && priceMatch &&
             sessionTypeMatch && ratingMatch && languageMatch && experienceMatch;
    });

    // Apply sorting
    switch (filters.sortBy) {
      case 'distance':
        filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filtered.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.priceValue - b.priceValue);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.priceValue - a.priceValue);
        break;
      case 'experience':
        filtered.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [
    debouncedSearch,
    debouncedLocation,
    filters.specialties,
    filters.priceRange,
    filters.sessionTypes,
    filters.minRating,
    filters.languages,
    filters.experience,
    filters.sortBy,
    filters.radius,
    userLocation,
    calculateDistance,
  ]);

  // Generate search suggestions based on current healers
  const generateSuggestions = useCallback((query: string): string[] => {
    if (!query || query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();
    
    healers.forEach(healer => {
      // Add matching specialties
      healer.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          suggestions.add(tag);
        }
      });
      
      // Add matching names
      if (healer.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(healer.name);
      }
      
      // Add matching locations
      if (healer.location.toLowerCase().includes(lowerQuery)) {
        suggestions.add(healer.location);
      }
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [healers]);

  // Update suggestions when search changes
  useEffect(() => {
    setSuggestions(generateSuggestions(filters.search));
  }, [filters.search, generateSuggestions]);

  // Apply filters whenever relevant filters change
  useEffect(() => {
    const filtered = applyFilters(healers);
    setFilteredHealers(filtered);
  }, [healers, applyFilters]);

  // Filter update functions
  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const addToFilter = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K] extends Array<infer T> ? T : never
  ) => {
    setFilters(prev => {
      const currentValue = prev[key];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [key]: currentValue.includes(value) 
            ? currentValue 
            : [...currentValue, value]
        };
      }
      return prev;
    });
  }, []);

  const removeFromFilter = useCallback(<K extends keyof SearchFilters>(
    key: K, 
    value: SearchFilters[K] extends Array<infer T> ? T : never
  ) => {
    setFilters(prev => {
      const currentValue = prev[key];
      if (Array.isArray(currentValue)) {
        return {
          ...prev,
          [key]: currentValue.filter(item => item !== value)
        };
      }
      return prev;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearFilter = useCallback(<K extends keyof SearchFilters>(key: K) => {
    setFilters(prev => ({
      ...prev,
      [key]: DEFAULT_FILTERS[key],
    }));
  }, []);

  // Active filters count for UI
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.location) count++;
    if (filters.specialties.length > 0) count++;
    if (filters.sessionTypes.length > 0) count++;
    if (filters.languages.length > 0) count++;
    if (filters.minRating > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200) count++;
    if (filters.experience[0] > 0 || filters.experience[1] < 20) count++;
    return count;
  }, [filters]);

  // Get unique filter options from healers
  const filterOptions = useMemo(() => {
    const specialties = new Set<string>();
    const sessionTypes = new Set<string>();
    const languages = new Set<string>();
    const locations = new Set<string>();
    
    healers.forEach(healer => {
      healer.tags.forEach(tag => specialties.add(tag));
      healer.sessionTypes.forEach(type => sessionTypes.add(type));
      healer.languages.forEach(lang => languages.add(lang));
      locations.add(healer.location);
    });
    
    return {
      specialties: Array.from(specialties).sort(),
      sessionTypes: Array.from(sessionTypes).sort(),
      languages: Array.from(languages).sort(),
      locations: Array.from(locations).sort(),
    };
  }, [healers]);

  return {
    // State
    filters,
    healers,
    filteredHealers,
    loading,
    userLocation,
    suggestions,
    activeFiltersCount,
    filterOptions,
    
    // Actions
    setHealers,
    setLoading,
    updateFilter,
    addToFilter,
    removeFromFilter,
    clearFilters,
    clearFilter,
    
    // Computed
    totalResults: filteredHealers.length,
    hasActiveFilters: activeFiltersCount > 0,
  };
};