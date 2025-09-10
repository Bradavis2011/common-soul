import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  DollarSign, 
  Clock, 
  User, 
  Award, 
  AlertCircle,
  Save,
  Eye,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AvailabilityManager from '@/components/Calendar/AvailabilityManager';
import apiService from '@/services/api';

const serviceCategories = [
  { value: 'REIKI_HEALING', label: 'Reiki Healing' },
  { value: 'ENERGY_HEALING', label: 'Energy Healing' },
  { value: 'SPIRITUAL_COUNSELING', label: 'Spiritual Counseling' },
  { value: 'CHAKRA_ALIGNMENT', label: 'Chakra Alignment' },
  { value: 'TAROT_READING', label: 'Tarot Reading' },
  { value: 'MEDITATION_GUIDANCE', label: 'Meditation Guidance' },
  { value: 'CRYSTAL_HEALING', label: 'Crystal Healing' },
  { value: 'AURA_CLEANSING', label: 'Aura Cleansing' },
  { value: 'SOUND_HEALING', label: 'Sound Healing' },
  { value: 'BREATHWORK', label: 'Breathwork' },
  { value: 'ASTROLOGY', label: 'Astrology' },
  { value: 'NUMEROLOGY', label: 'Numerology' }
];

interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
}

interface HealerProfile {
  title: string;
  bio: string;
  location: string;
  specialties: string[];
  hourlyRate: number;
  yearsExperience: number;
  certifications: string[];
  languages: string[];
  isActive: boolean;
  pricing: {
    consultation: { duration: number; price: number; description: string };
    standard: { duration: number; price: number; description: string };
    extended: { duration: number; price: number; description: string };
  };
  availability: {
    timezone: string;
    schedule: string;
  };
}

const HealerManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get the tab from URL params, default to 'profile' if specified, otherwise 'profile'
  const defaultTab = searchParams.get('tab') || 'profile';

  const [services, setServices] = useState<Service[]>([]);
  const [healerProfile, setHealerProfile] = useState<HealerProfile>({
    title: '',
    bio: '',
    location: '',
    specialties: [],
    hourlyRate: 0,
    yearsExperience: 0,
    certifications: [],
    languages: [],
    isActive: true,
    pricing: {
      consultation: { duration: 30, price: 50, description: 'Initial consultation & energy reading' },
      standard: { duration: 60, price: 85, description: 'Full healing session' },
      extended: { duration: 90, price: 120, description: 'Deep healing session with guidance' }
    },
    availability: {
      timezone: 'EST (UTC-5)',
      schedule: 'Monday - Friday: 9 AM - 7 PM'
    }
  });

  const [isEditingService, setIsEditingService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState(healerProfile);
  const [serviceForm, setServiceForm] = useState({
    title: '',
    description: '',
    duration: 60,
    price: 0,
    category: '',
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'healer') {
      navigate('/dashboard');
      return;
    }
    
    loadData();
  }, [isAuthenticated, user, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load services
      const servicesResponse = await apiService.getMyServices();
      if (servicesResponse.success) {
        setServices(servicesResponse.data.services || []);
      }

      // For now, we'll use mock healer profile data since the API might not return it
      // In a real implementation, you'd fetch this from the user's profile
      setHealerProfile({
        specialties: ['Crystal Healing', 'Meditation', 'Energy Cleansing'],
        hourlyRate: 85,
        yearsExperience: 5,
        certifications: ['Certified Crystal Healer', 'Reiki Master'],
        isActive: true
      });
      setProfileForm(prevForm => ({
        ...prevForm,
        specialties: ['Crystal Healing', 'Meditation', 'Energy Cleansing'],
        hourlyRate: 85,
        yearsExperience: 5,
        certifications: ['Certified Crystal Healer', 'Reiki Master'],
        languages: ['English'],
        isActive: true
      }));

    } catch (error: any) {
      setError(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.updateHealerProfile(profileForm);
      
      if (response.success) {
        setHealerProfile(profileForm);
        toast({
          title: "Profile Updated",
          description: "Your healer profile has been updated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.createService(serviceForm);
      
      if (response.success) {
        setServices([...services, response.data.service]);
        setServiceForm({
          title: '',
          description: '',
          duration: 60,
          price: 0,
          category: '',
          imageUrl: '',
          isActive: true
        });
        setIsEditingService(false);
        toast({
          title: "Service Created",
          description: "Your new service has been created successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to create service');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.updateService(editingService.id, serviceForm);
      
      if (response.success) {
        setServices(services.map(s => 
          s.id === editingService.id ? response.data.service : s
        ));
        setEditingService(null);
        setIsEditingService(false);
        toast({
          title: "Service Updated",
          description: "Your service has been updated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to update service');
      }
    } catch (error: any) {
      setError(error.message);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    setIsLoading(true);
    try {
      const response = await apiService.deleteService(serviceId);
      
      if (response.success) {
        setServices(services.filter(s => s.id !== serviceId));
        toast({
          title: "Service Deleted",
          description: "Your service has been deleted successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to delete service');
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      description: service.description,
      duration: service.duration,
      price: service.price,
      category: service.category,
      imageUrl: service.imageUrl || '',
      isActive: service.isActive
    });
    setIsEditingService(true);
  };

  const openNewService = () => {
    setEditingService(null);
    setServiceForm({
      title: '',
      description: '',
      duration: 60,
      price: 0,
      category: '',
      imageUrl: '',
      isActive: true
    });
    setIsEditingService(true);
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your healer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Healer Dashboard</h1>
          <p className="text-muted-foreground">Manage your profile, services, and bookings</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Profile Settings Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Public Healer Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div>
                    <Label htmlFor="title">Professional Title</Label>
                    <Input
                      id="title"
                      value={profileForm.title}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        title: e.target.value
                      })}
                      placeholder="Master Crystal Healer & Meditation Guide"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        location: e.target.value
                      })}
                      placeholder="San Francisco, CA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio & Description</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        bio: e.target.value
                      })}
                      placeholder="Share your story, approach, and what makes your healing practice unique..."
                      rows={4}
                    />
                  </div>
                </div>

                {/* Experience & Credentials */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Experience & Credentials</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="yearsExperience">Years of Experience</Label>
                      <Input
                        id="yearsExperience"
                        type="number"
                        value={profileForm.yearsExperience}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          yearsExperience: parseInt(e.target.value) || 0
                        })}
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="languages">Languages (comma-separated)</Label>
                      <Input
                        id="languages"
                        value={(profileForm.languages || []).join(', ')}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          languages: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                        })}
                        placeholder="English, Spanish, French"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialties">Specialties (comma-separated)</Label>
                    <Input
                      id="specialties"
                      value={(profileForm.specialties || []).join(', ')}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        specialties: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      placeholder="Crystal Healing, Meditation, Energy Cleansing"
                    />
                  </div>

                  <div>
                    <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                    <Input
                      id="certifications"
                      value={(profileForm.certifications || []).join(', ')}
                      onChange={(e) => setProfileForm({
                        ...profileForm,
                        certifications: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      })}
                      placeholder="Certified Crystal Healer, Reiki Master Level III"
                    />
                  </div>
                </div>

                {/* Pricing Tiers */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Session Pricing</h3>
                  
                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Consultation (30 min)</Label>
                        <Input
                          type="number"
                          value={profileForm.pricing.consultation.price}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              consultation: {
                                ...profileForm.pricing.consultation,
                                price: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          placeholder="50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={profileForm.pricing.consultation.description}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              consultation: {
                                ...profileForm.pricing.consultation,
                                description: e.target.value
                              }
                            }
                          })}
                          placeholder="Initial consultation & energy reading"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Standard (60 min)</Label>
                        <Input
                          type="number"
                          value={profileForm.pricing.standard.price}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              standard: {
                                ...profileForm.pricing.standard,
                                price: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          placeholder="85"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={profileForm.pricing.standard.description}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              standard: {
                                ...profileForm.pricing.standard,
                                description: e.target.value
                              }
                            }
                          })}
                          placeholder="Full healing session"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <div>
                        <Label>Extended (90 min)</Label>
                        <Input
                          type="number"
                          value={profileForm.pricing.extended.price}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              extended: {
                                ...profileForm.pricing.extended,
                                price: parseFloat(e.target.value) || 0
                              }
                            }
                          })}
                          placeholder="120"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Description</Label>
                        <Input
                          value={profileForm.pricing.extended.description}
                          onChange={(e) => setProfileForm({
                            ...profileForm,
                            pricing: {
                              ...profileForm.pricing,
                              extended: {
                                ...profileForm.pricing.extended,
                                description: e.target.value
                              }
                            }
                          })}
                          placeholder="Deep healing session with guidance"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Availability</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={profileForm.availability.timezone}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          availability: {
                            ...profileForm.availability,
                            timezone: e.target.value
                          }
                        })}
                        placeholder="PST (UTC-8)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="schedule">General Schedule</Label>
                      <Input
                        id="schedule"
                        value={profileForm.availability.schedule}
                        onChange={(e) => setProfileForm({
                          ...profileForm,
                          availability: {
                            ...profileForm.availability,
                            schedule: e.target.value
                          }
                        })}
                        placeholder="Monday - Friday: 9 AM - 7 PM"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={profileForm.isActive}
                    onCheckedChange={(checked) => setProfileForm({
                      ...profileForm,
                      isActive: checked
                    })}
                  />
                  <Label htmlFor="isActive">Profile is active and accepting bookings</Label>
                </div>

                <Button 
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Public Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">My Services</h2>
              <Button onClick={openNewService}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Service
              </Button>
            </div>

            <div className="grid gap-6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{service.title}</h3>
                          <Badge variant={service.isActive ? 'default' : 'secondary'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">{service.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {service.duration} minutes
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${service.price}
                          </div>
                          <Badge variant="outline">
                            {serviceCategories.find(c => c.value === service.category)?.label || service.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditService(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {services.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground mb-4">
                      <Settings className="w-12 h-12 mx-auto mb-2" />
                      <p>No services created yet</p>
                    </div>
                    <Button onClick={openNewService}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Service
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <AvailabilityManager healerId={user?.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics and insights for your healer profile will be available soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Dialog */}
        <Dialog open={isEditingService} onOpenChange={setIsEditingService}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Create New Service'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceTitle">Service Title</Label>
                <Input
                  id="serviceTitle"
                  value={serviceForm.title}
                  onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                  placeholder="Crystal Healing Session"
                />
              </div>

              <div>
                <Label htmlFor="serviceDescription">Description</Label>
                <Textarea
                  id="serviceDescription"
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Describe your service and what clients can expect..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="serviceDuration">Duration (minutes)</Label>
                  <Input
                    id="serviceDuration"
                    type="number"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 0 })}
                    placeholder="60"
                  />
                </div>

                <div>
                  <Label htmlFor="servicePrice">Price ($)</Label>
                  <Input
                    id="servicePrice"
                    type="number"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="85"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceCategory">Category</Label>
                  <Select
                    value={serviceForm.category}
                    onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="serviceImage">Image URL (optional)</Label>
                <Input
                  id="serviceImage"
                  value={serviceForm.imageUrl}
                  onChange={(e) => setServiceForm({ ...serviceForm, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="serviceActive"
                  checked={serviceForm.isActive}
                  onCheckedChange={(checked) => setServiceForm({ ...serviceForm, isActive: checked })}
                />
                <Label htmlFor="serviceActive">Service is active</Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={editingService ? handleUpdateService : handleCreateService}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingService(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default HealerManagement;