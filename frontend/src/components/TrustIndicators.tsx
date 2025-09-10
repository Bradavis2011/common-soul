import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Star, Shield, CheckCircle, Clock, MessageCircle, Calendar, Award, Users } from "lucide-react";

interface TrustIndicatorsProps {
  averageRating: number;
  totalReviews: number;
  responseRate?: number;
  completedSessions: number;
  memberSince: string;
  isVerified?: boolean;
  cancellationRate?: number;
  responseTime?: string;
  className?: string;
}

export const TrustIndicators = ({
  averageRating,
  totalReviews,
  responseRate = 0,
  completedSessions,
  memberSince,
  isVerified = false,
  cancellationRate = 0,
  responseTime = "Usually responds within 24 hours",
  className = ""
}: TrustIndicatorsProps) => {
  
  const getTrustLevel = () => {
    if (averageRating >= 4.7 && totalReviews >= 50 && responseRate >= 90) {
      return { level: 'Highly Trusted', color: 'bg-green-100 text-green-800 border-green-200', icon: Shield };
    } else if (averageRating >= 4.3 && totalReviews >= 20 && responseRate >= 80) {
      return { level: 'Trusted', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle };
    } else if (averageRating >= 3.8 && totalReviews >= 5) {
      return { level: 'Verified', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: CheckCircle };
    }
    return { level: 'New', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Users };
  };

  const trustInfo = getTrustLevel();
  const TrustIcon = trustInfo.icon;
  
  const formatMemberSince = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
      return `${Math.floor(diffDays / 365)} years`;
    } catch {
      return dateString;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? "fill-yellow-400 text-yellow-400" 
            : i < rating 
            ? "fill-yellow-400/50 text-yellow-400" 
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Trust Level Badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`${trustInfo.color} font-medium`}>
          <TrustIcon className="w-3 h-3 mr-1" />
          {trustInfo.level}
        </Badge>
        {isVerified && (
          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
      </div>

      {/* Rating Display */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {renderStars(averageRating)}
        </div>
        <span className="font-bold text-lg">{averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
      </div>

      {/* Trust Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">{responseRate}%</div>
                  <div className="text-xs text-muted-foreground">Response Rate</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Percentage of messages replied to within 48 hours</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Users className="w-4 h-4 text-green-500" />
                <div>
                  <div className="font-medium">{completedSessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total completed healing sessions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Calendar className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-medium">{formatMemberSince(memberSince)}</div>
                  <div className="text-xs text-muted-foreground">Member</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Time since joining the platform</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <div className="font-medium">{cancellationRate < 5 ? '<5%' : `${cancellationRate}%`}</div>
                  <div className="text-xs text-muted-foreground">Cancellation</div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Percentage of sessions cancelled by healer</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Response Time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>{responseTime}</span>
      </div>
    </div>
  );
};