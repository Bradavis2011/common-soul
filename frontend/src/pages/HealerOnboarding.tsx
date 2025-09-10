import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Star,
  Heart,
  Award,
  User,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  Camera,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/services/api';

const STEPS = [
  { id: 1, title: 'Basic Info', icon: User, description: 'Tell us about yourself' },
  { id: 2, title: 'Specialties', icon: Heart, description: 'Your healing practices' },
  { id: 3, title: 'Experience', icon: Award, description: 'Background & credentials' },
  { id: 4, title: 'Services', icon: Star, description: 'What you offer' },
  { id: 5, title: 'Availability', icon: Clock, description: 'When you\'re available' },
  { id: 6, title: 'Profile', icon: Camera, description: 'Complete your profile' }
];

const SPECIALTIES = [
  'Reiki', 'Crystal Healing', 'Meditation', 'Chakra Balancing', 'Energy Healing',
  'Tarot Reading', 'Astrology', 'Sound Healing', 'Breathwork', 'Spiritual Counseling',
  'Shamanic Journey', 'Aura Cleansing', 'Numerology', 'Angel Communication'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin', 'Japanese'
];

const SESSION_TYPES = [
  'Virtual', 'In-Person', 'Phone', 'Group Sessions', 'Workshops', 'Retreats'
];

interface OnboardingData {
  // Basic Info
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  
  // Specialties
  specialties: string[];
  languages: string[];
  sessionTypes: string[];
  
  // Experience
  yearsExperience: number;
  certifications: string[];
  education: string;
  
  // Services
  hourlyRate: number;
  consultationFee: number;
  sessionDurations: string[];
  
  // Availability
  availability: any[];
  
  // Profile
  avatarUrl: string;
  profileBanner: string;
  socialLinks: any[];
}

const HealerOnboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [data, setData] = useState<OnboardingData>({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    specialties: [],
    languages: ['English'],
    sessionTypes: [],
    yearsExperience: 0,
    certifications: [],
    education: '',
    hourlyRate: 0,
    consultationFee: 0,
    sessionDurations: [],
    availability: [],
    avatarUrl: '',
    profileBanner: '',
    socialLinks: []
  });

  useEffect(() => {
    // Check if user is healer type
    if (user?.userType !== 'HEALER') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const calculateProgress = () => {
    const totalSteps = STEPS.length;
    return Math.round((currentStep / totalSteps) * 100);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!data.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!data.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!data.bio.trim()) newErrors.bio = 'Bio is required';
        if (!data.location.trim()) newErrors.location = 'Location is required';
        break;
      case 2:
        if (data.specialties.length === 0) newErrors.specialties = 'Select at least one specialty';
        if (data.sessionTypes.length === 0) newErrors.sessionTypes = 'Select at least one session type';
        break;
      case 3:
        if (data.yearsExperience < 0) newErrors.yearsExperience = 'Years of experience is required';
        break;
      case 4:
        if (data.hourlyRate <= 0) newErrors.hourlyRate = 'Hourly rate must be greater than 0';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Submit basic profile
      await apiService.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio,
        location: data.location,
        phone: data.phone,
        website: data.website,
        avatarUrl: data.avatarUrl
      });

      // Submit healer-specific data
      await apiService.updateHealerProfile({
        specialties: data.specialties,
        hourlyRate: data.hourlyRate,
        yearsExperience: data.yearsExperience,
        certifications: data.certifications,
        education: data.education,
        languages: data.languages,
        sessionTypes: data.sessionTypes,
        consultationFee: data.consultationFee,
        sessionDurations: data.sessionDurations,
        socialLinks: data.socialLinks,
        profileBanner: data.profileBanner,
        isActive: true
      });

      // Submit for verification
      const verificationResponse = await fetch('/api/healer/submit-for-verification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!verificationResponse.ok) {
        throw new Error('Failed to submit for verification');
      }

      toast({
        title: "Profile Submitted for Review!",
        description: "Your healer profile has been submitted for verification. You'll receive an email within 24-48 hours once reviewed.",
      });

      navigate('/healer-management?status=pending');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    const currentArray = data[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateData(field, newArray);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Tell us about yourself</h2>
              <p className="text-muted-foreground">Let's start with the basics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  className={errors.firstName ? 'border-destructive' : ''}
                />
                {errors.firstName && <p className="text-sm text-destructive mt-1">{errors.firstName}</p>}
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  className={errors.lastName ? 'border-destructive' : ''}
                />
                {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="bio">About You *</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential clients about your healing journey, philosophy, and what makes your practice special..."
                value={data.bio}
                onChange={(e) => updateData('bio', e.target.value)}
                className={`min-h-[120px] ${errors.bio ? 'border-destructive' : ''}`}
              />
              {errors.bio && <p className="text-sm text-destructive mt-1">{errors.bio}</p>}
              <p className="text-sm text-muted-foreground mt-1">{data.bio.length}/500 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="City, State/Province, Country"
                  value={data.location}
                  onChange={(e) => updateData('location', e.target.value)}
                  className={errors.location ? 'border-destructive' : ''}
                />
                {errors.location && <p className="text-sm text-destructive mt-1">{errors.location}</p>}
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={data.phone}
                  onChange={(e) => updateData('phone', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                placeholder="https://your-website.com"
                value={data.website}
                onChange={(e) => updateData('website', e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Your Healing Specialties</h2>
              <p className="text-muted-foreground">What practices do you offer?</p>
            </div>

            <div>
              <Label>Specialties * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {SPECIALTIES.map((specialty) => (
                  <div
                    key={specialty}
                    onClick={() => toggleArrayItem('specialties', specialty)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      data.specialties.includes(specialty)
                        ? 'border-spiritual bg-spiritual/10 text-spiritual'
                        : 'border-border hover:border-spiritual/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{specialty}</span>
                      {data.specialties.includes(specialty) && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </div>
                ))}
              </div>
              {errors.specialties && <p className="text-sm text-destructive mt-2">{errors.specialties}</p>}
            </div>

            <div>
              <Label>Languages Spoken</Label>
              <div className="flex flex-wrap gap-2 mt-3">
                {LANGUAGES.map((language) => (
                  <Badge
                    key={language}
                    variant={data.languages.includes(language) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('languages', language)}
                  >
                    {language}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Session Types * (Select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                {SESSION_TYPES.map((type) => (
                  <div
                    key={type}
                    onClick={() => toggleArrayItem('sessionTypes', type)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      data.sessionTypes.includes(type)
                        ? 'border-spiritual bg-spiritual/10 text-spiritual'
                        : 'border-border hover:border-spiritual/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      {data.sessionTypes.includes(type) && <CheckCircle className="w-4 h-4" />}
                    </div>
                  </div>
                ))}
              </div>
              {errors.sessionTypes && <p className="text-sm text-destructive mt-2">{errors.sessionTypes}</p>}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Award className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Your Experience & Credentials</h2>
              <p className="text-muted-foreground">Build trust with your background</p>
            </div>

            <div>
              <Label htmlFor="yearsExperience">Years of Experience *</Label>
              <Input
                id="yearsExperience"
                type="number"
                min="0"
                value={data.yearsExperience}
                onChange={(e) => updateData('yearsExperience', parseInt(e.target.value) || 0)}
                className={errors.yearsExperience ? 'border-destructive' : ''}
              />
              {errors.yearsExperience && <p className="text-sm text-destructive mt-1">{errors.yearsExperience}</p>}
            </div>

            <div>
              <Label htmlFor="education">Education & Training Background</Label>
              <Textarea
                id="education"
                placeholder="Describe your formal education, training programs, schools attended, or traditional learning experiences..."
                value={data.education}
                onChange={(e) => updateData('education', e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label>Certifications & Credentials</Label>
              <div className="space-y-2">
                {data.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={cert}
                      onChange={(e) => {
                        const newCerts = [...data.certifications];
                        newCerts[index] = e.target.value;
                        updateData('certifications', newCerts);
                      }}
                      placeholder="e.g., Certified Reiki Master, Licensed Massage Therapist"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newCerts = data.certifications.filter((_, i) => i !== index);
                        updateData('certifications', newCerts);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => updateData('certifications', [...data.certifications, ''])}
                  className="w-full"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Star className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Service Pricing</h2>
              <p className="text-muted-foreground">Set your rates and offerings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Standard Hourly Rate * (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    className={`pl-10 ${errors.hourlyRate ? 'border-destructive' : ''}`}
                    value={data.hourlyRate}
                    onChange={(e) => updateData('hourlyRate', parseFloat(e.target.value) || 0)}
                  />
                </div>
                {errors.hourlyRate && <p className="text-sm text-destructive mt-1">{errors.hourlyRate}</p>}
              </div>

              <div>
                <Label htmlFor="consultationFee">Initial Consultation Fee (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="consultationFee"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-10"
                    value={data.consultationFee}
                    onChange={(e) => updateData('consultationFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-1">Leave 0 for free consultations</p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Platform Fee:</strong> Common Soul takes a 10% platform fee from each booking to maintain the platform and support services. Your rates above will be what clients pay, and you'll receive 90% of the session fee.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Clock className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Availability Setup</h2>
              <p className="text-muted-foreground">When are you available for sessions?</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can set detailed availability schedules after completing onboarding. For now, we'll set you as available during standard business hours. You can customize this later in your healer management dashboard.
              </AlertDescription>
            </Alert>

            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">Default Schedule Set</h3>
              <p className="text-muted-foreground">
                Monday - Friday: 9:00 AM - 5:00 PM<br />
                You can customize your availability schedule after onboarding.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="w-16 h-16 mx-auto mb-4 text-spiritual" />
              <h2 className="text-2xl font-bold">Complete Your Profile</h2>
              <p className="text-muted-foreground">Add photos and finalize your presence</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Profile Photo</Label>
                <div className="flex items-center gap-4 mt-2">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    {data.avatarUrl ? (
                      <img src={data.avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">Recommended: 400x400px, under 2MB</p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Cover Banner (Optional)</Label>
                <div className="mt-2">
                  <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                    {data.profileBanner ? (
                      <img src={data.profileBanner} alt="Banner" className="w-full h-32 rounded-lg object-cover" />
                    ) : (
                      <div className="text-center">
                        <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Add a cover photo</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Banner
                  </Button>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>You're almost ready!</strong> After submitting, your profile will be reviewed by our team. This usually takes 24-48 hours. You'll receive an email once approved.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Healer Onboarding</h1>
            <Badge variant="outline">{currentStep} of {STEPS.length}</Badge>
          </div>
          <Progress value={calculateProgress()} className="mb-4" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            {STEPS.map((step) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                  currentStep >= step.id 
                    ? 'border-spiritual bg-spiritual text-white' 
                    : 'border-border'
                }`}>
                  {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                </div>
                <div className="hidden md:block">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={isLoading}
            variant={currentStep === STEPS.length ? "spiritual" : "default"}
          >
            {isLoading ? (
              "Processing..."
            ) : currentStep === STEPS.length ? (
              "Complete Profile"
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HealerOnboarding;