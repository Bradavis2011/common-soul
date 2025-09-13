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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Use auth context values if available, otherwise fall back to props
  const actualIsAuthenticated = isAuthenticated ?? propIsAuthenticated ?? false;
  const actualUserType = user?.userType ?? propUserType ?? 'seeker';
  
  // Start with empty notifications for new users
  const [notifications] = useState([]);
  
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
    <nav className="sticky top-0 z-50 border-b border-violet-600/20" style={{ backgroundColor: '#2C1A4D' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/assets/Logo2.png" 
              alt="Common Soul Logo" 
              className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto max-w-none"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-white hover:text-[#C44BC7] transition-colors font-medium border-b-2 border-transparent hover:border-[#C44BC7] pb-1"
                style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:flex text-white hover:text-[#C44BC7] hover:bg-white/10" 
              onClick={handleSearch}
            >
              <Search className="w-4 h-4" />
            </Button>

            {actualIsAuthenticated ? (
              <>
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative text-white hover:text-[#C44BC7] hover:bg-white/10">
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
                  <Button variant="ghost" size="sm" className="text-white hover:text-[#C44BC7] hover:bg-white/10" onClick={handleMessagesClick}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Link to="/settings">
                    <Button variant="ghost" size="sm" className="text-white hover:text-[#C44BC7] hover:bg-white/10">
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
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-white border-[#2C1A4D] text-[#2C1A4D] hover:bg-[#2C1A4D] hover:text-white font-medium rounded-lg"
                    style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/login">
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-[#2C1A4D] to-[#C44BC7] text-white hover:shadow-lg hover:shadow-[#C44BC7]/30 font-bold rounded-lg transition-all"
                    style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                  >
                    Join Now
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden text-white hover:text-[#C44BC7] hover:bg-white/10"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-brand-primary">
                <SheetHeader className="border-b border-white/20 pb-4">
                  <SheetTitle className="text-white font-bold text-xl" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
                    Common Soul
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Navigation Links */}
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center px-4 py-3 text-white hover:text-[#C44BC7] hover:bg-white/10 rounded-lg transition-colors"
                      style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                    >
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Authentication Actions */}
                  {!actualIsAuthenticated ? (
                    <div className="space-y-3 pt-4 border-t border-white/20">
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant="outline" 
                          className="w-full bg-white border-white text-[#2C1A4D] hover:bg-[#C44BC7] hover:text-white font-medium"
                          style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                        >
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          className="w-full bg-gradient-to-r from-[#C44BC7] to-[#6D3FB2] text-white font-bold"
                          style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                        >
                          Join Now
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-4 border-t border-white/20">
                      <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-white hover:text-[#C44BC7] hover:bg-white/10"
                          style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                        >
                          <User className="w-4 h-4 mr-3" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-white hover:text-[#C44BC7] hover:bg-white/10"
                          style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-white hover:text-[#C44BC7] hover:bg-white/10"
                        style={{ fontFamily: 'Poppins, Arial, sans-serif' }}
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Log Out
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};