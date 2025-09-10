import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Plus, 
  Heart, 
  Reply, 
  Pin, 
  Clock,
  Users,
  TrendingUp,
  Star,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Forum = () => {
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const { toast } = useToast();

  // Mock forum data
  const categories = [
    {
      id: "healing-experiences",
      name: "Healing Experiences", 
      description: "Share your transformative healing journeys",
      postCount: 156,
      latestPost: "2 hours ago",
      color: "text-spiritual"
    },
    {
      id: "spiritual-growth",
      name: "Spiritual Growth",
      description: "Discuss spiritual development and awakening", 
      postCount: 203,
      latestPost: "45 minutes ago",
      color: "text-nature"
    },
    {
      id: "questions-answers",
      name: "Questions & Answers",
      description: "Ask questions and get help from the community",
      postCount: 89,
      latestPost: "1 hour ago", 
      color: "text-sunset"
    },
    {
      id: "healer-recommendations",
      name: "Healer Recommendations",
      description: "Share and find trusted healers",
      postCount: 67,
      latestPost: "3 hours ago",
      color: "text-aurora"
    }
  ];

  const mockPosts = [
    {
      id: 1,
      title: "My incredible Reiki healing experience",
      content: "I just had my first Reiki session and I'm still processing the profound shift I felt. The energy was so powerful and I feel like something deep inside me has healed...",
      author: "SoulSeeker92",
      category: "Healing Experiences", 
      replies: 12,
      likes: 28,
      timeAgo: "2 hours ago",
      isPinned: true
    },
    {
      id: 2,
      title: "How do I know if a healer is right for me?",
      content: "I'm new to spiritual healing and feeling overwhelmed by all the options. What questions should I ask potential healers? How do I trust my intuition in choosing?",
      author: "NewToHealing",
      category: "Questions & Answers",
      replies: 8,
      likes: 15,
      timeAgo: "4 hours ago",
      isPinned: false
    },
    {
      id: 3,
      title: "Crystal healing meditation - life changing results",
      content: "After 3 months of working with Sarah Moonwhisper, my anxiety has completely transformed. Her crystal healing sessions combined with meditation practices have...",
      author: "CrystalMama",
      category: "Healing Experiences",
      replies: 15,
      likes: 42,
      timeAgo: "1 day ago",
      isPinned: false
    },
    {
      id: 4,
      title: "Spiritual awakening - need guidance", 
      content: "I'm going through what I think is a spiritual awakening and feeling lost. Has anyone else experienced intense dreams, synchronicities, and emotional shifts?",
      author: "AwakeningNow",
      category: "Spiritual Growth",
      replies: 23,
      likes: 31,
      timeAgo: "2 days ago", 
      isPinned: false
    }
  ];

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a title and content for your post",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Post Created!",
      description: "Your post has been submitted and will appear shortly"
    });

    setNewPostTitle("");
    setNewPostContent("");
    setShowNewPostForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-muted/30 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 px-4 py-2">
              Community Forum
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Connect & Share</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Join our supportive community to share experiences, ask questions, and connect with fellow spiritual seekers
            </p>
          </div>

          {/* Search and Actions */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search discussions..."
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <Button
                onClick={() => setShowNewPostForm(!showNewPostForm)}
                className="h-12 px-6"
                variant="spiritual"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="discussions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="popular">Popular</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="mt-6">
            {/* New Post Form */}
            {showNewPostForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New Post</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    placeholder="Post title..."
                    className="font-medium"
                  />
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share your thoughts, experience, or question..."
                    className="min-h-[120px]"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowNewPostForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePost}>
                      Create Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts List */}
            <div className="space-y-4">
              {mockPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>
                          {post.author.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {post.isPinned && (
                            <Pin className="w-4 h-4 text-spiritual" />
                          )}
                          <h3 className="font-semibold text-lg hover:text-spiritual cursor-pointer">
                            {post.title}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {post.category}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{post.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{post.timeAgo}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{post.replies} replies</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            <span>{post.likes} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {categories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-spiritual flex items-center justify-center ${category.color}`}>
                        <MessageCircle className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                        <p className="text-muted-foreground text-sm mb-4">{category.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{category.postCount} posts</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Latest: {category.latestPost}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="popular" className="mt-6">
            <p className="text-center text-muted-foreground py-8">
              Popular posts coming soon...
            </p>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <p className="text-center text-muted-foreground py-8">
              Recent activity coming soon...
            </p>
          </TabsContent>
        </Tabs>
      </div>

      {/* Community Guidelines */}
      <section className="py-16 px-6 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Community Guidelines</h2>
          <p className="text-muted-foreground mb-8">
            Help us maintain a safe, supportive, and respectful environment for everyone
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 mx-auto mb-3 text-spiritual" />
                <h3 className="font-semibold mb-2">Be Respectful</h3>
                <p className="text-sm text-muted-foreground">
                  Treat all community members with kindness and respect
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-3 text-nature" />
                <h3 className="font-semibold mb-2">Share Authentically</h3>
                <p className="text-sm text-muted-foreground">
                  Share genuine experiences and honest perspectives
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-sunset" />
                <h3 className="font-semibold mb-2">Support Others</h3>
                <p className="text-sm text-muted-foreground">
                  Offer encouragement and helpful insights to fellow seekers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Forum;