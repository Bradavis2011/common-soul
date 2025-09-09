import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Video, User } from "lucide-react";

interface HealerCardProps {
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  location: string;
  isVirtual: boolean;
  price: string;
  avatar: string;
  tags: string[];
}

export const HealerCard = ({
  name,
  specialty,
  rating,
  reviewCount,
  location,
  isVirtual,
  price,
  avatar,
  tags,
}: HealerCardProps) => {
  return (
    <Card className="hover:shadow-spiritual transition-all duration-300 border-border/50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-spiritual flex items-center justify-center">
            <User className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{name}</h3>
            <p className="text-muted-foreground">{specialty}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-accent text-accent" />
                <span className="text-sm font-medium">{rating}</span>
                <span className="text-sm text-muted-foreground">({reviewCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{location}</span>
              {isVirtual && (
                <>
                  <Video className="w-4 h-4 text-accent" />
                  <span className="text-sm text-accent">Virtual Available</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0 flex justify-between items-center">
        <div className="text-lg font-semibold text-accent">{price}</div>
        <Button variant="spiritual" size="sm">
          Book Session
        </Button>
      </CardFooter>
    </Card>
  );
};