import React, { useState, useEffect } from "react";
import { apiService } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  Home
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
    isVirtual: true,
    price: "$85/session",
    priceRange: "80-100",
    avatar: "",
    tags: ["Crystal Healing", "Meditation", "Chakra Balancing"],
    experience: "8 years",
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English", "Spanish"],
    availability: "Weekdays",
    bio: "Certified crystal healer with deep knowledge of chakra alignment and meditation practices."
  },
  {
    id: "marcus-lightbringer",
    name: "Marcus Lightbringer", 
    specialty: "Reiki & Energy Healing",
    rating: 4.8,
    reviewCount: 89,
    location: "Boulder, CO",
    isVirtual: true,
    price: "$75/session",
    priceRange: "60-80",
    avatar: "",
    tags: ["Reiki", "Energy Healing", "Spiritual Counseling"],
    experience: "12 years",
    sessionTypes: ["Virtual", "In-Person"], 
    languages: ["English"],
    availability: "Evenings",
    bio: "Reiki Master with extensive experience in energy healing and spiritual guidance."
  },
  {
    id: "luna-starseeker",
    name: "Luna Starseeker",
    specialty: "Tarot & Astrology", 
    rating: 4.9,
    reviewCount: 156,
    location: "Austin, TX",
    isVirtual: true,
    price: "$60/session",
    priceRange: "40-60",
    avatar: "",
    tags: ["Tarot", "Astrology", "Divination"],
    experience: "6 years",
    sessionTypes: ["Virtual"],
    languages: ["English", "French"],
    availability: "Weekends",
    bio: "Intuitive tarot reader and astrologer helping clients navigate life's transitions."
  },
  {
    id: "river-sage",
    name: "River Sage",
    specialty: "Shamanic Healing", 
    rating: 4.7,
    reviewCount: 73,
    location: "Sedona, AZ", 
    isVirtual: false,
    price: "$120/session",
    priceRange: "100-150",
    avatar: "",
    tags: ["Shamanic Journey", "Soul Retrieval", "Plant Medicine"],
    experience: "15 years",
    sessionTypes: ["In-Person"],
    languages: ["English"],
    availability: "Weekdays",
    bio: "Traditional shamanic practitioner offering deep healing and soul work."
  },
  {
    id: "ocean-flow",
    name: "Ocean Flow",
    specialty: "Sound Healing", 
    rating: 4.6,
    reviewCount: 94,
    location: "Portland, OR",
    isVirtual: true,
    price: "$70/session",
    priceRange: "60-80", 
    avatar: "",
    tags: ["Sound Bath", "Tibetan Bowls", "Meditation"],
    experience: "5 years", 
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English"],
    availability: "Flexible",
    bio: "Sound healing practitioner creating transformative experiences through vibrational therapy."
  },
  {
    id: "mystic-rose",
    name: "Mystic Rose",
    specialty: "Spiritual Counseling",
    rating: 4.8,
    reviewCount: 112,
    location: "Nashville, TN",
    isVirtual: true,
    price: "$90/session",
    priceRange: "80-100",
    avatar: "",
    tags: ["Life Coaching", "Spiritual Guidance", "Meditation"],
    experience: "10 years",
    sessionTypes: ["Virtual", "In-Person"],
    languages: ["English"], 
    availability: "Weekdays",
    bio: "Compassionate spiritual counselor helping clients find clarity and purpose."
  }
];

const HealerSearch = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  // API data state
  const [healers, setHealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  // Initialize filters from URL parameters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || "");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [priceRangeFilter, setPriceRangeFilter] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState(searchParams.get('sessionType') || "");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredHealers, setFilteredHealers] = useState(mockHealers);
  const [sortBy, setSortBy] = useState("rating");

  // Handle specialties from URL params (comma-separated)
  const urlSpecialties = searchParams.get('specialties');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    urlSpecialties ? urlSpecialties.split(',') : []
  );

  // Fetch healers from API
  useEffect(() => {
    const fetchHealers = async () => {
      try {
        const response = await apiService.getHealers({
          search: searchQuery,
          location: locationFilter,
          specialty: specialtyFilter,
          sessionType: sessionTypeFilter,
          rating: ratingFilter,
          sortBy,
          page: 1,
          limit: 20
        });
        
        if (response.success) {
          setHealers(response.data.healers || []);
          setPagination(response.data.pagination);
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
  }, []); // Initial fetch

  // Filter healers (now works with both API and mock data)
  useEffect(() => {
    let filtered = healers.filter(healer => {
      const matchesSearch = !searchQuery || 
        healer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        healer.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        healer.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesLocation = !locationFilter || 
        healer.location.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesSpecialty = !specialtyFilter || 
        healer.tags.some(tag => tag.toLowerCase().includes(specialtyFilter.toLowerCase()));
      
      // Check if healer has any of the selected specialties from URL params
      const matchesSelectedSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.some(specialty => 
          healer.tags.some(tag => tag.toLowerCase().includes(specialty.toLowerCase()))
        );
      
      const matchesPriceRange = !priceRangeFilter || healer.priceRange === priceRangeFilter;
      
      const matchesSessionType = !sessionTypeFilter || 
        healer.sessionTypes.includes(sessionTypeFilter);
      
      const matchesAvailability = !availabilityFilter || 
        healer.availability.toLowerCase().includes(availabilityFilter.toLowerCase());
      
      const matchesRating = !ratingFilter || healer.rating >= parseFloat(ratingFilter);

      return matchesSearch && matchesLocation && matchesSpecialty && matchesSelectedSpecialties &&
             matchesPriceRange && matchesSessionType && matchesAvailability && matchesRating;
    });

    // Sort results
    if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_low") {
      filtered.sort((a, b) => parseInt(a.price.match(/\d+/)?.[0] || "0") - parseInt(b.price.match(/\d+/)?.[0] || "0"));
    } else if (sortBy === "price_high") {
      filtered.sort((a, b) => parseInt(b.price.match(/\d+/)?.[0] || "0") - parseInt(a.price.match(/\d+/)?.[0] || "0"));
    } else if (sortBy === "reviews") {
      filtered.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    setFilteredHealers(filtered);
  }, [healers, searchQuery, locationFilter, specialtyFilter, selectedSpecialties, priceRangeFilter, sessionTypeFilter, availabilityFilter, ratingFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setSpecialtyFilter("");
    setSelectedSpecialties([]);
    setPriceRangeFilter("");
    setSessionTypeFilter("");
    setAvailabilityFilter("");
    setRatingFilter("");
  };

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
              <div className="flex-1">
                <Label htmlFor="search">Search by name, specialty, or healing type</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Crystal healing, Reiki, Tarot reading..."
                    className="pl-10 h-12"
                  />
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
                </Button>
                <Button
                  variant="spiritual"
                  className="h-12 px-6"
                  onClick={() => toast({ title: "Searching...", description: "Finding healers that match your criteria" })}
                >
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
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      placeholder="City, State"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Session Type */}
                <div className="space-y-2">
                  <Label>Session Type</Label>
                  <Select value={sessionTypeFilter} onValueChange={setSessionTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="Virtual">Virtual</SelectItem>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <Label>Specialty</Label>
                  <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-specialty">Any specialty</SelectItem>
                      <SelectItem value="reiki">Reiki</SelectItem>
                      <SelectItem value="crystal">Crystal Healing</SelectItem>
                      <SelectItem value="tarot">Tarot Reading</SelectItem>
                      <SelectItem value="meditation">Meditation</SelectItem>
                      <SelectItem value="shamanic">Shamanic Healing</SelectItem>
                      <SelectItem value="sound">Sound Healing</SelectItem>
                      <SelectItem value="counseling">Spiritual Counseling</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-price">Any price</SelectItem>
                      <SelectItem value="40-60">$40 - $60</SelectItem>
                      <SelectItem value="60-80">$60 - $80</SelectItem>
                      <SelectItem value="80-100">$80 - $100</SelectItem>
                      <SelectItem value="100-150">$100 - $150</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <Label>Minimum Rating</Label>
                  <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-rating">Any rating</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      <SelectItem value="4.0">4.0+ Stars</SelectItem>
                      <SelectItem value="3.5">3.5+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-time">Any time</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                      <SelectItem value="evenings">Evenings</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Active Filters Display */}
            {(searchQuery || locationFilter || sessionTypeFilter || selectedSpecialties.length > 0) && (
              <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Active Filters:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Location: {locationFilter}
                      <button onClick={() => setLocationFilter("")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {sessionTypeFilter && (
                    <Badge variant="secondary" className="gap-1">
                      Session: {sessionTypeFilter}
                      <button onClick={() => setSessionTypeFilter("")} className="ml-1 hover:text-destructive">×</button>
                    </Badge>
                  )}
                  {selectedSpecialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="gap-1">
                      {specialty}
                      <button 
                        onClick={() => setSelectedSpecialties(prev => prev.filter(s => s !== specialty))} 
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
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
                  {filteredHealers.length} Healer{filteredHealers.length !== 1 ? 's' : ''} Found
                </h2>
                <p className="text-muted-foreground">
                  Showing results {searchQuery && `for "${searchQuery}"`}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <Label htmlFor="sort">Sort by:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
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
                                  <Star className="w-4 h-4 fill-accent text-accent" />
                                  <span>{healer.rating} ({healer.reviewCount} reviews)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{healer.location}</span>
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