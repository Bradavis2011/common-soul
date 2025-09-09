import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Heart, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });
  const { toast } = useToast();
  const { login, signup, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent, userType: 'seeker' | 'healer') => {
    e.preventDefault();
    
    try {
      await login(loginData.email, loginData.password, userType);
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${userType}`,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    }
  };

  const handleSignup = async (e: React.FormEvent, userType: 'seeker' | 'healer') => {
    e.preventDefault();
    
    try {
      await signup(signupData.name, signupData.email, signupData.password, userType);
      toast({
        title: "Account created!",
        description: `Welcome to Common Soul as a ${userType}`,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please check your information and try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-aurora flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-spiritual rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Common Soul</h1>
          <p className="text-muted-foreground mt-2">Your spiritual journey starts here</p>
        </div>

        <Card className="backdrop-blur-sm bg-card/80">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Choose your path to join our community</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="seeker" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="seeker" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Seeker
                </TabsTrigger>
                <TabsTrigger value="healer" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Healer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="seeker" className="space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold">Find Your Healing Path</h3>
                  <p className="text-sm text-muted-foreground">Connect with authentic spiritual guides</p>
                </div>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={(e) => handleLogin(e, 'seeker')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seeker-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="seeker-email" 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10" 
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seeker-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="seeker-password" 
                            type="password" 
                            placeholder="Enter your password" 
                            className="pl-10"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" variant="spiritual" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In as Seeker"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={(e) => handleSignup(e, 'seeker')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="seeker-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="seeker-name" 
                            placeholder="Enter your full name" 
                            className="pl-10"
                            value={signupData.name}
                            onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seeker-signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="seeker-signup-email" 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10"
                            value={signupData.email}
                            onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="seeker-signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="seeker-signup-password" 
                            type="password" 
                            placeholder="Create a password" 
                            className="pl-10"
                            value={signupData.password}
                            onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" variant="nature" disabled={loading}>
                        {loading ? "Creating account..." : "Join as Seeker"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="healer" className="space-y-6">
                <div className="text-center">
                  <h3 className="font-semibold">Share Your Gifts</h3>
                  <p className="text-sm text-muted-foreground">Help others on their spiritual journey</p>
                </div>
                
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login">
                    <form onSubmit={(e) => handleLogin(e, 'healer')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="healer-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="healer-email" 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10"
                            value={loginData.email}
                            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="healer-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="healer-password" 
                            type="password" 
                            placeholder="Enter your password" 
                            className="pl-10"
                            value={loginData.password}
                            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" variant="aurora" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In as Healer"}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="signup">
                    <form onSubmit={(e) => handleSignup(e, 'healer')} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="healer-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="healer-name" 
                            placeholder="Enter your full name" 
                            className="pl-10"
                            value={signupData.name}
                            onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="healer-signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="healer-signup-email" 
                            type="email" 
                            placeholder="Enter your email" 
                            className="pl-10"
                            value={signupData.email}
                            onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="healer-signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input 
                            id="healer-signup-password" 
                            type="password" 
                            placeholder="Create a password" 
                            className="pl-10"
                            value={signupData.password}
                            onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                            required 
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" variant="sunset" disabled={loading}>
                        {loading ? "Creating account..." : "Join as Healer"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>

            <Separator className="my-6" />
            
            <div className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;