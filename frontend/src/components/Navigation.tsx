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
import { Bell, Menu, Search, Sparkles, Settings, LogOut, User, Calendar, MessageCircle, Heart } from "lucide-react";
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
  const [notifications] = useState(3);

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  const navItems = [
    { label: "Discover", href: "/" },
    { label: "Healers", href: "/healers" },
    { label: "Community", href: "/community" },
    { label: "Sessions", href: "/sessions" }
  ];

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-spiritual rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Common Soul</span>
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
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Search className="w-4 h-4" />
            </Button>

            {actualIsAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <Button variant="ghost" size="sm">
                    <Bell className="w-4 h-4" />
                  </Button>
                  {notifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 text-xs p-0 flex items-center justify-center"
                    >
                      {notifications}
                    </Badge>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="hidden md:flex items-center gap-2">
                  <Link to="/messages">
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/calendar">
                    <Button variant="ghost" size="sm">
                      <Calendar className="w-4 h-4" />
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
                          {actualUserType === 'healer' ? 'H' : 'S'}
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
                    
                    <Link to="/profile">
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Profile Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    
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