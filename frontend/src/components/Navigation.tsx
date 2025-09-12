import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Menu, Search, Sparkles, Settings, LogOut, User, Calendar, MessageCircle, Heart, Shield, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  isAuthenticated?: boolean;
  userType?: 'seeker' | 'healer';
}

export const Navigation = ({ isAuthenticated: propIsAuthenticated, userType: propUserType }: NavigationProps) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  // Use auth context values if available, otherwise fall back to props
  const actualIsAuthenticated = isAuthenticated ?? propIsAuthenticated ?? false;
  const actualUserType = user?.userType ?? propUserType ?? 'seeker';
  
  // Mock notifications data with diverse types
  const [notifications] = useState([
    {
      id: 1,
      type: "booking",
      title: "New session booking",
      message: "Emma Johnson has booked a Crystal Healing session for tomorrow at 2:00 PM",
      time: "5 min ago",
      read: false,
      link: "/dashboard?tab=sessions"
    },
    {
      id: 2,
      type: "payment",
      title: "Payment received", 
      message: "You received $85 for your session with Michael Chen",
      time: "1 hour ago",
      read: false,
      link: "/dashboard?tab=earnings"
    },
    {
      id: 3,
      type: "message",
      title: "New message",
      message: "Sarah Williams sent you a message about tomorrow's session",
      time: "2 hours ago",
      read: true,
      link: "/messages"
    },
    {
      id: 4,
      type: "review",
      title: "New review received",
      message: "Marcus Thompson left you a 5-star review: 'Amazing healing energy!'",
      time: "1 day ago",
      read: false,
      link: "/my-profile"
    },
    {
      id: 5,
      type: "cancellation",
      title: "Session cancelled",
      message: "Lisa Rodriguez cancelled her Reiki session scheduled for Friday",
      time: "2 days ago",
      read: true,
      link: "/dashboard?tab=sessions"
    },
    {
      id: 6,
      type: "reminder",
      title: "Update your availability",
      message: "Remember to set your availability for next week to receive more bookings",
      time: "3 days ago",
      read: true,
      link: "/healer-management?tab=availability"
    }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearch = () => {
    navigate('/healers');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
    // Scroll to top when navigating to messages
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleNotificationClick = (notification: any) => {
    navigate(notification.link);
    // Scroll to top when navigating
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };


  const navItems = [
    { label: "Discover", href: "/about" },
    { label: "Healers", href: "/healers" },
    { label: "Community", href: "/forum" },
    { label: "Sessions", href: "/dashboard" }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/assets/Logo.png" 
              alt="Common Soul Logo" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={handleSearch}>
              <Search className="w-4 h-4" />
            </Button>

            {actualIsAuthenticated ? (
              <>
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b">
                      <h4 className="font-semibold">Notifications</h4>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${!notification.read ? 'bg-muted/30' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">
                                  {notification.time}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-muted-foreground">
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Quick Actions */}
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleMessagesClick}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Link to="/settings">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt="User" />
                        <AvatarFallback>
                          {user?.name ? user.name.charAt(0).toUpperCase() : (actualUserType === 'healer' ? 'H' : 'S')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.name || (actualUserType === 'healer' ? 'Sarah Moonwhisper' : 'John Seeker')}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email || `${actualUserType === 'healer' ? 'Crystal Healer' : 'Spiritual Seeker'}`}
                        </p>
                        <Badge variant={actualUserType === 'healer' ? 'default' : 'secondary'} className="w-fit text-xs">
                          {actualUserType}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <Link to="/dashboard">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    <Link to="/settings">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {actualUserType === 'healer' && (
                      <>
                        <Link to="/healer-management">
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>Healer Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to="/healer-management?tab=profile">
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Edit Public Profile</span>
                          </DropdownMenuItem>
                        </Link>
                        <Link to={user?.id ? `/healer/${user.id}` : '/my-profile'}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View My Public Profile</span>
                          </DropdownMenuItem>
                        </Link>
                      </>
                    )}
                    
                    {actualUserType === 'seeker' && (
                      <Link to="/favorites">
                        <DropdownMenuItem>
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Favorite Healers</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <Link to="/sessions">
                      <DropdownMenuItem>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Sessions</span>
                      </DropdownMenuItem>
                    </Link>
                    
                    {/* Admin Links - only for admin users */}
                    {(user?.isAdmin || user?.userType === 'admin') && (
                      <Link to="/admin/reports">
                        <DropdownMenuItem>
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Reports</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="spiritual" size="sm">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};