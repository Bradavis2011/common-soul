import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share, User } from "lucide-react";
import { useState } from "react";

interface SocialPostProps {
  author: string;
  timeAgo: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
}

export const SocialPost = ({
  author,
  timeAgo,
  content,
  tags,
  likes,
  comments,
}: SocialPostProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <Card className="hover:shadow-nature transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-nature flex items-center justify-center">
            <User className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">{author}</h4>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-foreground mb-4 leading-relaxed">{content}</p>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-sm text-accent bg-secondary px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`gap-2 ${isLiked ? 'text-accent' : 'text-muted-foreground'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            {comments}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <Share className="w-4 h-4" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};