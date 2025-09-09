import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Filter } from "lucide-react";
import { useState } from "react";

const specialties = [
  "Meditation", "Reiki", "Crystal Healing", "Tarot Reading", 
  "Chakra Balancing", "Energy Healing", "Astrology", "Sound Therapy"
];

const sessionTypes = ["Virtual", "In-Person", "Both"];

export const SearchFilters = () => {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedSessionType, setSelectedSessionType] = useState<string>("");
  const [location, setLocation] = useState("");

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Find Your Perfect Healer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search healers, practices, or keywords..."
            className="pl-10"
          />
        </div>

        {/* Location */}
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Enter location or zip code"
            className="pl-10"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Session Type */}
        <div>
          <h4 className="font-medium mb-3">Session Type</h4>
          <div className="flex gap-2">
            {sessionTypes.map((type) => (
              <Button
                key={type}
                variant={selectedSessionType === type ? "spiritual" : "outline"}
                size="sm"
                onClick={() => setSelectedSessionType(
                  selectedSessionType === type ? "" : type
                )}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <h4 className="font-medium mb-3">Specialties</h4>
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Badge
                key={specialty}
                variant={selectedSpecialties.includes(specialty) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleSpecialty(specialty)}
              >
                {specialty}
              </Badge>
            ))}
          </div>
        </div>

        <Button variant="aurora" className="w-full">
          Search Healers
        </Button>
      </CardContent>
    </Card>
  );
};