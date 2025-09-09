import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, DollarSign, Star, Users, Clock, Heart, Settings, Video } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [userType] = useState<'seeker' | 'healer'>('healer'); // This would come from auth context

  const seekerStats = {
    sessionsBooked: 12,
    healersFollowed: 8,
    journeyDays: 127,
    favoriteHealers: 5
  };

  const healerStats = {
    totalSessions: 156,
    monthlyEarnings: 2840,
    rating: 4.8,
    followers: 89
  };

  const upcomingSessions = [
    {
      id: 1,
      clientName: "Emma Johnson",
      type: "Crystal Healing",
      date: "Today",
      time: "2:00 PM",
      duration: "60 min",
      amount: "$85",
      status: "confirmed"
    },
    {
      id: 2,
      clientName: "Michael Chen",
      type: "Reiki Session",
      date: "Tomorrow",
      time: "10:00 AM", 
      duration: "90 min",
      amount: "$120",
      status: "pending"
    },
    {
      id: 3,
      clientName: "Sarah Williams",
      type: "Spiritual Counseling",
      date: "Friday",
      time: "3:30 PM",
      duration: "45 min",
      amount: "$75",
      status: "confirmed"
    }
  ];

  const recentMessages = [
    {
      id: 1,
      from: "Emma Johnson",
      preview: "Thank you for the beautiful session yesterday...",
      time: "2 hours ago",
      unread: true
    },
    {
      id: 2,
      from: "Marcus Thompson",
      preview: "I'd like to book another session for next week...",
      time: "1 day ago",
      unread: false
    },
    {
      id: 3,
      from: "Lisa Rodriguez",
      preview: "The meditation techniques you shared...",
      time: "3 days ago",
      unread: false
    }
  ];

  const HealerDashboard = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{healerStats.totalSessions}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-spiritual rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Earnings</p>
                <p className="text-2xl font-bold">${healerStats.monthlyEarnings}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-nature rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{healerStats.rating}</p>
                  <Star className="w-5 h-5 fill-accent text-accent" />
                </div>
              </div>
              <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Followers</p>
                <p className="text-2xl font-bold">{healerStats.followers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-aurora rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{session.clientName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.clientName}</p>
                      <p className="text-sm text-muted-foreground">{session.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{session.date}, {session.time}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={session.status === 'confirmed' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                      <span className="text-sm font-medium text-accent">{session.amount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Recent Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.map((message) => (
                <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{message.from.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{message.from}</p>
                      <span className="text-xs text-muted-foreground">{message.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{message.preview}</p>
                    {message.unread && (
                      <div className="w-2 h-2 bg-accent rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const SeekerDashboard = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessions Booked</p>
                <p className="text-2xl font-bold">{seekerStats.sessionsBooked}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-spiritual rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healers Followed</p>
                <p className="text-2xl font-bold">{seekerStats.healersFollowed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-nature rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Journey Days</p>
                <p className="text-2xl font-bold">{seekerStats.journeyDays}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-sunset rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Favorite Healers</p>
                <p className="text-2xl font-bold">{seekerStats.favoriteHealers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-aurora rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/session/sarah-moonwhisper">
          <Button variant="spiritual" size="lg" className="h-16 w-full">
            <Video className="w-5 h-5 mr-2" />
            Start Demo Session
          </Button>
        </Link>
        <Button variant="nature" size="lg" className="h-16">
          <Calendar className="w-5 h-5 mr-2" />
          Book New Session
        </Button>
        <Button variant="sunset" size="lg" className="h-16">
          <Users className="w-5 h-5 mr-2" />
          Explore Healers
        </Button>
        <Button variant="sunset" size="lg" className="h-16">
          <Heart className="w-5 h-5 mr-2" />
          Join Community
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src="" />
                <AvatarFallback>US</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">
                  {userType === 'healer' ? 'Healer Dashboard' : 'Your Spiritual Journey'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="earnings">
              {userType === 'healer' ? 'Earnings' : 'Journey'}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            {userType === 'healer' ? <HealerDashboard /> : <SeekerDashboard />}
          </TabsContent>
          
          <TabsContent value="sessions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Session management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Messaging interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="earnings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{userType === 'healer' ? 'Earnings Analytics' : 'Journey Progress'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {userType === 'healer' 
                    ? 'Detailed earnings analytics coming soon...' 
                    : 'Journey tracking and insights coming soon...'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;