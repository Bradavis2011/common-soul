import React, { useState, useEffect } from "react";
import { apiService } from '@/services/api';
import { spiritualAnalytics } from '@/services/analytics';
import { useAdvancedSearch, SearchFilters } from '@/hooks/useAdvancedSearch';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { HealerCard } from "@/components/HealerCard";
import { 
  Search, 
  MapPin, 
  Star, 
  Filter, 
  Calendar,
  MessageCircle, 
  Heart,
  DollarSign,
  Clock,
  Users,
  Award,
  Video,
  Home,
  Loader2,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";

// Extended mock data for healer search
const mockHealers = [
  {
    id: "sarah-moonwhisper",
    name: "Sarah Moonwhisper",
    specialty: "Crystal Healing & Meditation", 
    rating: 4.9,
    reviewCount: 127,
    location: "San Francisco, CA",
    coordinates: { lat: 37.7749, lng: -122.4194 },
    isVirtual: true,
    price: "$85/session",
    priceValue: 85,
    avatar: "",
    tags: ["Crystal Healing", "Meditation", "Chakra Balancing"],
    experience: "8 years",
    experienceYears: 8,
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English", "Spanish"],
    availability: "Weekdays",
    bio: "Certified crystal healer with deep knowledge of chakra alignment and meditation practices.",
    verified: true,
    responseTime: "Within 2 hours"
  },
  {
    id: "marcus-lightbringer",
    name: "Marcus Lightbringer", 
    specialty: "Reiki & Energy Healing",
    rating: 4.8,
    reviewCount: 89,
    location: "Boulder, CO",
    coordinates: { lat: 40.0150, lng: -105.2705 },
    isVirtual: true,
    price: "$75/session",
    priceValue: 75,
    avatar: "",
    tags: ["Reiki", "Energy Healing", "Spiritual Counseling"],
    experience: "12 years",
    experienceYears: 12,
    sessionTypes: ["Virtual", "In-Person"], 
    languages: ["English"],
    availability: "Evenings",
    bio: "Reiki Master with extensive experience in energy healing and spiritual guidance.",
    verified: true,
    responseTime: "Within 4 hours"
  },
  {
    id: "luna-starseeker",
    name: "Luna Starseeker",
    specialty: "Tarot & Astrology", 
    rating: 4.9,
    reviewCount: 156,
    location: "Austin, TX",
    coordinates: { lat: 30.2672, lng: -97.7431 },
    isVirtual: true,
    price: "$60/session",
    priceValue: 60,
    avatar: "",
    tags: ["Tarot", "Astrology", "Divination"],
    experience: "6 years",
    experienceYears: 6,
    sessionTypes: ["Virtual"],
    languages: ["English", "French"],
    availability: "Weekends",
    bio: "Intuitive tarot reader and astrologer helping clients navigate life's transitions.",
    verified: true,
    responseTime: "Within 1 hour"
  },
  {
    id: "river-sage",
    name: "River Sage",
    specialty: "Shamanic Healing", 
    rating: 4.7,
    reviewCount: 73,
    location: "Sedona, AZ", 
    coordinates: { lat: 34.8697, lng: -111.7610 },
    isVirtual: false,
    price: "$120/session",
    priceValue: 120,
    avatar: "",
    tags: ["Shamanic Journey", "Soul Retrieval", "Plant Medicine"],
    experience: "15 years",
    experienceYears: 15,
    sessionTypes: ["In-Person"],
    languages: ["English"],
    availability: "Weekdays",
    bio: "Traditional shamanic practitioner offering deep healing and soul work.",
    verified: true,
    responseTime: "Within 24 hours"
  },
  {
    id: "ocean-flow",
    name: "Ocean Flow",
    specialty: "Sound Healing", 
    rating: 4.6,
    reviewCount: 94,
    location: "Portland, OR",
    coordinates: { lat: 45.5152, lng: -122.6784 },
    isVirtual: true,
    price: "$70/session",
    priceValue: 70, 
    avatar: "",
    tags: ["Sound Bath", "Tibetan Bowls", "Meditation"],
    experience: "5 years",
    experienceYears: 5, 
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English"],
    availability: "Flexible",
    bio: "Sound healing practitioner creating transformative experiences through vibrational therapy.",
    verified: true,
    responseTime: "Within 6 hours"
  },
  {
    id: "mystic-rose",
    name: "Mystic Rose",
    specialty: "Spiritual Counseling",
    rating: 4.8,
    reviewCount: 112,
    location: "Nashville, TN",
    coordinates: { lat: 36.1627, lng: -86.7816 },
    isVirtual: true,
    price: "$90/session",
    priceValue: 90,
    avatar: "",
    tags: ["Life Coaching", "Spiritual Guidance", "Meditation"],
    experience: "10 years",
    experienceYears: 10,
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English"], 
    availability: "Weekdays",
    bio: "Compassionate spiritual counselor helping clients find clarity and purpose.",
    verified: true,
    responseTime: "Within 3 hours"
  }
];

const HealerSearch = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // Initialize filters from URL parameters
  const initialFilters: Partial<SearchFilters> = {
    search: searchParams.get('search') || '',
    location: searchParams.get('location') || '',
    sessionTypes: searchParams.get('sessionType') ? [searchParams.get('sessionType')!] : [],
    specialties: searchParams.get('specialties') ? searchParams.get('specialties')!.split(',') : []
  };
  
  const {
    filters,
    filteredHealers,
    loading,
    suggestions,
    activeFiltersCount,
    filterOptions,
    setHealers,
    setLoading,
    updateFilter,
    addToFilter,
    removeFromFilter,
    clearFilters,
    totalResults,
    hasActiveFilters
  } = useAdvancedSearch(initialFilters);
  
  const [showFilters, setShowFilters] = useState(false);

  // Fetch healers from API
  useEffect(() => {
    const fetchHealers = async () => {
      try {
        setLoading(true);
        
        // Track healer search analytics
        spiritualAnalytics.searchHealers({
          search_query: filters.search,
          location: filters.location,
          specialty: filters.specialties.join(','),
          session_type: filters.sessionTypes.join(','),
          rating_filter: filters.minRating.toString(),
          sort_by: filters.sortBy
        });

        const response = await apiService.getHealers({
          search: filters.search,
          location: filters.location,
          specialty: filters.specialties.join(','),
          sessionType: filters.sessionTypes.join(','),
          rating: filters.minRating.toString(),
          sortBy: filters.sortBy,
          page: 1,
          limit: 20
        });
        
        if (response.success) {
          setHealers(response.data.healers || mockHealers);
        } else {
          // Fall back to mock data if API fails
          setHealers(mockHealers);
        }
      } catch (error) {
        console.error('Failed to fetch healers:', error);
        // Fall back to mock data on error
        setHealers(mockHealers);
      } finally {
        setLoading(false);
      }
    };

    fetchHealers();
  }, [filters, setHealers, setLoading]); // Initial fetch

  // Search suggestions handler
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleBookSession = (healerName: string) => {
    toast({
      title: "Booking Session",
      description: `Redirecting to book with ${healerName}...`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-12 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Find Your Perfect Healer</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover authentic spiritual practitioners, healers, and guides who resonate with your journey
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 relative">
                <Label htmlFor="search">Search by name, specialty, or healing type</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={filters.search}
                    onChange={(e) => {
                      updateFilter('search', e.target.value);
                      setShowSuggestions(e.target.value.length > 1);
                    }}
                    onFocus={() => setShowSuggestions(filters.search.length > 1)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Crystal healing, Reiki, Tarot reading..."
                    className="pl-10 h-12"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-background border rounded-md mt-1 z-50 shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-b-0"
                          onClick={() => {
                            updateFilter('search', suggestion);
                            setShowSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-6"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="spiritual"
                  className="h-12 px-6"
                  onClick={() => toast({ title: "Searching...", description: "Finding healers that match your criteria" })}
                >
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Filters</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={filters.location}
                      onChange={(e) => updateFilter('location', e.target.value)}
                      placeholder="City, State or within 25 miles"
                      className="pl-10"
                    />
                  </div>
                  {filters.location && (
                    <div className="space-y-2">
                      <Label>Search Radius: {filters.radius} miles</Label>
                      <Slider
                        value={[filters.radius]}
                        onValueChange={(value) => updateFilter('radius', value[0])}
                        max={100}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>

                {/* Specialties - Multiple Selection */}
                <div className="space-y-2">
                  <Label>Specialties</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterOptions.specialties.map((specialty) => (
                      <div key={specialty} className="flex items-center space-x-2">
                        <Checkbox
                          id={`specialty-${specialty}`}
                          checked={filters.specialties.includes(specialty)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addToFilter('specialties', specialty);
                            } else {
                              removeFromFilter('specialties', specialty);
                            }
                          }}
                        />
                        <Label htmlFor={`specialty-${specialty}`} className="text-sm">
                          {specialty}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Session Types - Multiple Selection */}
                <div className="space-y-2">
                  <Label>Session Types</Label>
                  <div className="space-y-2">
                    {filterOptions.sessionTypes.map((sessionType) => (
                      <div key={sessionType} className="flex items-center space-x-2">
                        <Checkbox
                          id={`session-${sessionType}`}
                          checked={filters.sessionTypes.includes(sessionType)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addToFilter('sessionTypes', sessionType);
                            } else {
                              removeFromFilter('sessionTypes', sessionType);
                            }
                          }}
                        />
                        <Label htmlFor={`session-${sessionType}`} className="text-sm">
                          {sessionType}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range Slider */}
                <div className="space-y-2">
                  <Label>Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}</Label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                    max={200}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                </div>

                {/* Experience Range Slider */}
                <div className="space-y-2">
                  <Label>Experience: {filters.experience[0]} - {filters.experience[1]} years</Label>
                  <Slider
                    value={filters.experience}
                    onValueChange={(value) => updateFilter('experience', value as [number, number])}
                    max={20}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Rating Slider */}
                <div className="space-y-2">
                  <Label>Minimum Rating: {filters.minRating} stars</Label>
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={(value) => updateFilter('minRating', value[0])}
                    max={5}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Languages - Multiple Selection */}
                <div className="space-y-2">
                  <Label>Languages</Label>
                  <div className="space-y-2 max-h-24 overflow-y-auto">
                    {filterOptions.languages.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${language}`}
                          checked={filters.languages.includes(language)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              addToFilter('languages', language);
                            } else {
                              removeFromFilter('languages', language);
                            }
                          }}
                        />
                        <Label htmlFor={`language-${language}`} className="text-sm">
                          {language}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Active Filters ({activeFiltersCount}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {filters.search}
                      <button onClick={() => updateFilter('search', '')} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary" className="gap-1">
                      Location: {filters.location} ({filters.radius}mi)
                      <button onClick={() => updateFilter('location', '')} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="gap-1">
                      {specialty}
                      <button 
                        onClick={() => removeFromFilter('specialties', specialty)} 
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.sessionTypes.map(sessionType => (
                    <Badge key={sessionType} variant="secondary" className="gap-1">
                      {sessionType}
                      <button 
                        onClick={() => removeFromFilter('sessionTypes', sessionType)} 
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {filters.languages.map(language => (
                    <Badge key={language} variant="secondary" className="gap-1">
                      {language}
                      <button 
                        onClick={() => removeFromFilter('languages', language)} 
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < 200) && (
                    <Badge variant="secondary" className="gap-1">
                      Price: ${filters.priceRange[0]}-${filters.priceRange[1]}
                      <button onClick={() => updateFilter('priceRange', [0, 200])} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {(filters.experience[0] > 0 || filters.experience[1] < 20) && (
                    <Badge variant="secondary" className="gap-1">
                      Experience: {filters.experience[0]}-{filters.experience[1]} years
                      <button onClick={() => updateFilter('experience', [0, 20])} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.minRating > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      Rating: {filters.minRating}+ stars
                      <button onClick={() => updateFilter('minRating', 0)} className="ml-1 hover:text-destructive">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
                    Clear All
                  </Button>
                </div>
              </div>
            )}

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">
                  {totalResults} Healer{totalResults !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-muted-foreground">
                  {filters.search && `Showing results for "${filters.search}"`}
                  {!filters.search && hasActiveFilters && 'Filtered results'}
                  {!filters.search && !hasActiveFilters && 'All available healers'}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Label htmlFor="sort">Sort by:</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="experience">Most Experienced</SelectItem>
                    <SelectItem value="distance">Closest First</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Grid */}
            {loading ? (
              // Loading skeleton
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredHealers.length > 0 ? (
              <div className="grid gap-6">
                {filteredHealers.map((healer) => (
                  <Card key={healer.id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Healer Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={healer.avatar} />
                              <AvatarFallback className="text-lg">
                                {healer.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold mb-1">{healer.name}</h3>
                              <p className="text-muted-foreground mb-2">{healer.specialty}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4" style={{ fill: '#C44BC7', color: '#C44BC7' }} />
                                  <span>{healer.rating} ({healer.reviewCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{healer.location}</span>
                                  {healer.distance && (
                                    <span className="text-xs text-muted-foreground ml-1">
                                      ({healer.distance.toFixed(1)} mi)
                                    </span>
                                  )}
                                </div>
                                {healer.isVirtual && (
                                  <Badge variant="secondary">
                                    <Video className="w-3 h-3 mr-1" />
                                    Virtual
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-spiritual">{healer.price}</p>
                              <p className="text-sm text-muted-foreground">{healer.experience} experience</p>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-4">{healer.bio}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {healer.tags.map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{healer.availability}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{healer.languages.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="lg:w-48 flex flex-col gap-3">
                          <Button 
                            className="w-full"
                            onClick={() => handleBookSession(healer.name)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Session
                          </Button>
                          <Button variant="outline" className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Message
                          </Button>
                          <Link to={`/healer/${healer.id}`}>
                            <Button variant="ghost" className="w-full">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No healers found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealerSearch;