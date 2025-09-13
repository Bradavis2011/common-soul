import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  Pin, 
  Clock,
  ChevronLeft,
  Flag,
  Share,
  BookmarkPlus,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportButton } from "@/components/ReportButton";
import { useAuth } from "@/contexts/AuthContext";

interface ForumComment {
  id: string;
  author: {
    name: string;
    avatar?: string;
    userType: 'seeker' | 'healer';
    isVerified?: boolean;
  };
  content: string;
  timestamp: Date;
  likes: number;
  isLiked: boolean;
  replies?: ForumComment[];
}

interface ForumPostData {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    userType: 'seeker' | 'healer';
    isVerified?: boolean;
  };
  category: string;
  tags: string[];
  timestamp: Date;
  likes: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isPinned: boolean;
  isLocked: boolean;
  comments: ForumComment[];
}

const ForumPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<ForumPostData | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock forum post data
  const mockPost: ForumPostData = {
    id: postId || "1",
    title: "My First Reiki Session Experience - Incredible Energy Shifts!",
    content: `I just had my first Reiki session with Marcus Lightbringer yesterday and I'm still processing the incredible experience! 

As someone who was initially skeptical about energy healing, I went in with an open mind but honestly didn't expect much. Within the first 10 minutes, I started feeling this warm, tingling sensation moving through my body. 

Marcus was so professional and explained everything he was doing. He helped me understand how blocked energy was affecting my daily life and relationships. During the session, I actually felt emotional releases - I started crying without knowing why, but it felt so cleansing.

The most amazing part was afterwards. I felt this incredible lightness, like a weight had been lifted from my shoulders. My chronic shoulder tension that I've had for months was completely gone! Even today, I'm sleeping better and feeling more centered.

For anyone considering energy healing but feeling unsure - I'd say trust your intuition. Sometimes our souls know what we need even when our minds are skeptical. 

Has anyone else had similar experiences with their first energy healing session? I'd love to hear your stories! ✨`,
    author: {
      name: "EmmaJourney",
      userType: "seeker",
      isVerified: false
    },
    category: "Healing Experiences",
    tags: ["reiki", "energy-healing", "first-experience", "transformation"],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    likes: 24,
    commentCount: 8,
    viewCount: 156,
    isLiked: false,
    isPinned: false,
    isLocked: false,
    comments: [
      {
        id: "1",
        author: {
          name: "SoulSeeker92",
          userType: "seeker",
          isVerified: false
        },
        content: "Thank you for sharing this! I've been considering energy healing for months but was nervous. Your story gives me courage to book my first session.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
        likes: 12,
        isLiked: false
      },
      {
        id: "2",
        author: {
          name: "Marcus Lightbringer",
          userType: "healer",
          isVerified: true
        },
        content: "Emma, it was such a joy working with you! Your openness to the healing process made such a difference. Thank you for sharing your experience - it helps others understand what to expect. 🙏",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
        likes: 18,
        isLiked: false
      },
      {
        id: "3",
        author: {
          name: "CrystalMama",
          userType: "seeker",
          isVerified: false
        },
        content: "I had a very similar experience with my first session! The emotional release was unexpected but so healing. It's beautiful how our bodies know what they need.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        likes: 8,
        isLiked: false
      }
    ]
  };

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setPost(mockPost);
      setLoading(false);
    }, 500);
  }, [postId]);

  const handleLike = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }

    if (post) {
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      });
    }
  };

  const handleCommentLike = (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like comments.",
        variant: "destructive"
      });
      return;
    }

    if (post) {
      const updatedComments = post.comments.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      );
      setPost({ ...post, comments: updatedComments });
    }
  };

  const handleSubmitComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    const comment: ForumComment = {
      id: Date.now().toString(),
      author: {
        name: user?.name || "Anonymous",
        userType: user?.userType || "seeker",
        isVerified: false
      },
      content: newComment,
      timestamp: new Date(),
      likes: 0,
      isLiked: false
    };

    if (post) {
      setPost({
        ...post,
        comments: [...post.comments, comment],
        commentCount: post.commentCount + 1
      });
    }

    setNewComment("");
    toast({
      title: "Comment Posted",
      description: "Your comment has been added to the discussion."
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">The forum post you're looking for doesn't exist.</p>
            <Link to="/forum">
              <Button>Return to Forum</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/forum')}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Forum
            </Button>
            <Badge variant="outline">{post.category}</Badge>
            {post.isPinned && <Pin className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Main Post */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback>
                    {post.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{post.author.name}</span>
                    {post.author.isVerified && (
                      <Badge variant="default" className="text-xs">
                        {post.author.userType === 'healer' ? 'Verified Healer' : 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(post.timestamp)}
                    <span>•</span>
                    <span>{post.viewCount} views</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <BookmarkPlus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Share className="w-4 h-4" />
                </Button>
                <ReportButton 
                  targetType="MESSAGE" 
                  targetId={post.id} 
                  size="sm" 
                  variant="ghost" 
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
            <div className="prose prose-gray max-w-none mb-6">
              <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`gap-2 ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
              >
                <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                {post.likes}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Discussion ({post.commentCount})</h3>
          </CardHeader>
          <CardContent>
            {/* New Comment Form */}
            <div className="mb-6 space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isAuthenticated ? "Share your thoughts..." : "Please log in to join the discussion"}
                className="min-h-[100px]"
                disabled={!isAuthenticated}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || !isAuthenticated}
                >
                  Post Comment
                </Button>
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Comments */}
            <div className="space-y-6">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author.avatar} />
                    <AvatarFallback className="text-xs">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      {comment.author.isVerified && (
                        <Badge variant="default" className="text-xs">
                          {comment.author.userType === 'healer' ? 'Verified Healer' : 'Verified'}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed mb-3">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCommentLike(comment.id)}
                        className={`h-auto p-0 text-xs ${comment.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${comment.isLiked ? 'fill-current' : ''}`} />
                        {comment.likes}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <ReportButton 
                        targetType="MESSAGE" 
                        targetId={comment.id} 
                        size="sm" 
                        variant="ghost" 
                        className="h-auto p-0 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {post.comments.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No comments yet</p>
                <p className="text-sm">Be the first to share your thoughts!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForumPost;