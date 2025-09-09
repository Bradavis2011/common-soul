import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoCall } from '@/components/VideoCall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Clock, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SessionDetails {
  id: string;
  healerName: string;
  healerRating: number;
  sessionType: string;
  duration: string;
  scheduledTime: string;
  description: string;
  healer: {
    name: string;
    specialty: string;
    avatar: string;
    rating: number;
  };
}

const mockSessionData: Record<string, SessionDetails> = {
  'sarah-moonwhisper': {
    id: 'sarah-moonwhisper',
    healerName: 'Sarah Moonwhisper',
    healerRating: 4.9,
    sessionType: 'Crystal Healing & Meditation',
    duration: '60 minutes',
    scheduledTime: 'Now',
    description: 'A deeply transformative crystal healing session to align your chakras and restore energetic balance.',
    healer: {
      name: 'Sarah Moonwhisper',
      specialty: 'Crystal Healing & Meditation',
      avatar: '',
      rating: 4.9,
    }
  },
  'marcus-lightbringer': {
    id: 'marcus-lightbringer',
    healerName: 'Marcus Lightbringer',
    healerRating: 4.8,
    sessionType: 'Reiki & Energy Healing',
    duration: '45 minutes',
    scheduledTime: 'Now',
    description: 'Experience the powerful healing energy of Reiki to release blockages and restore your natural vitality.',
    healer: {
      name: 'Marcus Lightbringer',
      specialty: 'Reiki & Energy Healing',
      avatar: '',
      rating: 4.8,
    }
  },
  'luna-starseeker': {
    id: 'luna-starseeker',
    healerName: 'Luna Starseeker',
    healerRating: 4.9,
    sessionType: 'Tarot & Spiritual Guidance',
    duration: '30 minutes',
    scheduledTime: 'Now',
    description: 'Receive divine guidance through sacred tarot cards and connect with your spiritual path.',
    healer: {
      name: 'Luna Starseeker',
      specialty: 'Tarot & Astrology',
      avatar: '',
      rating: 4.9,
    }
  }
};

const VideoSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionData, setSessionData] = useState<SessionDetails | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (sessionId && mockSessionData[sessionId]) {
      setSessionData(mockSessionData[sessionId]);
    } else {
      // Redirect to dashboard if session not found
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  const handleStartSession = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to join a session.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    setShowVideo(true);
    toast({
      title: "Starting session...",
      description: `Preparing your ${sessionData?.sessionType} session`,
    });
  };

  const handleSessionEnd = () => {
    setShowVideo(false);
    toast({
      title: "Session completed",
      description: "Thank you for your healing session. Take time to integrate the energy you received.",
    });
    
    // Navigate back to dashboard after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-spiritual border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading your session...</p>
        </div>
      </div>
    );
  }

  if (showVideo) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <VideoCall
            roomName={sessionData.id}
            healerName={sessionData.healerName}
            sessionType={sessionData.sessionType}
            onCallEnd={handleSessionEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>

        {/* Session preparation */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main session card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-spiritual/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{sessionData.sessionType}</CardTitle>
                    <p className="text-muted-foreground">with {sessionData.healerName}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{sessionData.healerRating}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Session details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span>{sessionData.duration}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span>{sessionData.scheduledTime}</span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About This Session</h3>
                  <p className="text-muted-foreground">{sessionData.description}</p>
                </div>

                {/* Start session button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleStartSession}
                    size="lg"
                    variant="spiritual"
                    className="w-full py-6 text-lg"
                  >
                    Start Healing Session
                  </Button>
                  <p className="text-center text-sm text-muted-foreground mt-2">
                    Click when you're ready to begin your transformative experience
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preparation checklist */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Preparation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-spiritual rounded-full" />
                    <span className="text-sm">Find a quiet, private space</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-nature rounded-full" />
                    <span className="text-sm">Test your camera and microphone</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-sunset rounded-full" />
                    <span className="text-sm">Have water nearby</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-aurora rounded-full" />
                    <span className="text-sm">Set an intention for healing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-glow rounded-full" />
                    <span className="text-sm">Have crystals or sacred items ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p>📹 <strong>Camera:</strong> Required for video session</p>
                  <p>🎤 <strong>Microphone:</strong> Required for communication</p>
                  <p>🌐 <strong>Internet:</strong> Stable broadband connection</p>
                  <p>💻 <strong>Browser:</strong> Chrome, Firefox, or Safari</p>
                </div>
              </CardContent>
            </Card>

            {/* Session policies */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Session Policies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>• Sessions are private and confidential</p>
                  <p>• Recording is for your personal use only</p>
                  <p>• Please arrive with an open heart and mind</p>
                  <p>• Cancellations require 24-hour notice</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSession;