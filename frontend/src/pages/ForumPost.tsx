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
import { ShareButton } from "@/components/ShareButton";
import { useAuth } from "@/contexts/AuthContext";
import forumService, { ForumPost as ForumPostType, ForumComment } from "@/services/forumService";


const ForumPost = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<ForumPostType | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!postId) return;
    
    const fetchPost = async () => {
      try {
        setLoading(true);
        const postData = await forumService.getPost(postId);
        setPost(postData);
      } catch (error) {
        console.error('Error fetching forum post:', error);
        toast({
          title: "Error",
          description: "Failed to load forum post.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [postId, toast]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like posts.",
        variant: "destructive"
      });
      return;
    }

    if (!post) return;

    try {
      const result = await forumService.togglePostLike(post.id);
      setPost({
        ...post,
        isLiked: result.isLiked,
        likesCount: result.likesCount
      });
    } catch (error) {
      console.error('Error toggling post like:', error);
      toast({
        title: "Error",
        description: "Failed to update like status.",
        variant: "destructive"
      });
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to like comments.",
        variant: "destructive"
      });
      return;
    }

    if (!post || !post.comments) return;

    try {
      const result = await forumService.toggleCommentLike(commentId);
      const updatedComments = post.comments.map(comment => 
        comment.id === commentId 
          ? {
              ...comment,
              isLiked: result.isLiked,
              likesCount: result.likesCount
            }
          : comment
      );
      setPost({ ...post, comments: updatedComments });
    } catch (error) {
      console.error('Error toggling comment like:', error);
      toast({
        title: "Error",
        description: "Failed to update comment like status.",
        variant: "destructive"
      });
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim() || !post) return;

    try {
      const comment = await forumService.addComment(post.id, {
        content: newComment.trim()
      });

      setPost({
        ...post,
        comments: [...(post.comments || []), comment],
        commentsCount: post.commentsCount + 1
      });

      setNewComment("");
      toast({
        title: "Comment Posted",
        description: "Your comment has been added to the discussion."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment.",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
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
                  <AvatarImage src={post.author.avatarUrl} />
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
                    {formatTimeAgo(post.createdAt)}
                    <span>•</span>
                    <span>{post.viewsCount} views</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <BookmarkPlus className="w-4 h-4" />
                </Button>
                <ShareButton
                  title={post.title}
                  text={`Check out this forum post: ${post.title}`}
                  url={`/forum/post/${post.id}`}
                  variant="ghost"
                  size="sm"
                />
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
                {post.likesCount}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                {post.commentsCount} {post.commentsCount === 1 ? 'Comment' : 'Comments'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Discussion ({post.commentsCount})</h3>
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
              {(post.comments || []).map((comment) => (
                <div key={comment.id} id={`comment-${comment.id}`} className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.author.avatarUrl} />
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
                        {formatTimeAgo(comment.createdAt)}
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
                        {comment.likesCount}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground">
                        <Reply className="w-3 h-3 mr-1" />
                        Reply
                      </Button>
                      <ShareButton
                        title={`Comment by ${comment.author.name}`}
                        text={`Check out this comment: ${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}`}
                        url={`/forum/post/${post.id}#comment-${comment.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                      />
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

            {(!post.comments || post.comments.length === 0) && (
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