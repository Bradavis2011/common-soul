import { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoCallProps {
  roomName: string;
  healerName?: string;
  sessionType?: string;
  onCallEnd?: () => void;
}

export const VideoCall = ({ roomName, healerName, sessionType, onCallEnd }: VideoCallProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleJoinCall = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsCallActive(true);
      setIsLoading(false);
      toast({
        title: "Joining session...",
        description: `Connecting to your ${sessionType || 'healing'} session with ${healerName}`,
      });
    }, 1500);
  };

  const handleCallEnd = () => {
    setIsCallActive(false);
    toast({
      title: "Session ended",
      description: "Thank you for your healing session. Take some time to integrate the energy.",
    });
    onCallEnd?.();
  };

  const jitsiConfig = {
    roomName: `commonsoul-${roomName}`,
    width: '100%',
    height: 600,
    parentNode: undefined,
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
      disableModeratorIndicator: true,
      startScreenSharing: false,
      enableEmailInStats: false,
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      DISABLE_PRESENCE_STATUS: true,
      MOBILE_APP_PROMO: false,
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_BRAND_WATERMARK: false,
      BRAND_WATERMARK_LINK: '',
      SHOW_POWERED_BY: false,
      DISPLAY_WELCOME_PAGE_CONTENT: false,
      DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
      SHOW_CHROME_EXTENSION_BANNER: false,
    },
    userInfo: {
      displayName: user?.name || 'Spiritual Seeker',
      email: user?.email || '',
    },
  };

  if (!isCallActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Pre-call interface */}
        <Card className="border-spiritual/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="" alt={healerName} />
                <AvatarFallback className="bg-gradient-spiritual text-primary-foreground text-lg">
                  {healerName?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{sessionType || 'Healing Session'}</CardTitle>
                <p className="text-muted-foreground">with {healerName}</p>
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <Badge variant="outline" className="text-spiritual">
                <Video className="w-3 h-3 mr-1" />
                Video Session
              </Badge>
              <Badge variant="outline" className="text-nature">
                <Users className="w-3 h-3 mr-1" />
                Private Room
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Session info */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-center">Prepare for Your Session</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p>🧘‍♀️ <strong>Find a quiet space</strong></p>
                  <p>💻 <strong>Check your camera & microphone</strong></p>
                  <p>🕯️ <strong>Light a candle if you wish</strong></p>
                </div>
                <div className="space-y-2">
                  <p>💎 <strong>Have crystals nearby</strong></p>
                  <p>💧 <strong>Drink some water</strong></p>
                  <p>🙏 <strong>Set an intention</strong></p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleJoinCall}
                disabled={isLoading}
                className="px-8 py-6 text-lg"
                variant="spiritual"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-5 h-5 mr-2 rounded-full border-2 border-current border-t-transparent" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Join Session
                  </>
                )}
              </Button>
            </div>

            {/* Session details */}
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>Room: {roomName} • Secure & Private</p>
              <p>Your session will be recorded for your personal use only</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Call header */}
      <Card className="border-spiritual/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="" alt={healerName} />
                <AvatarFallback className="bg-gradient-spiritual text-primary-foreground">
                  {healerName?.charAt(0) || 'H'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{sessionType || 'Healing Session'}</h3>
                <p className="text-sm text-muted-foreground">with {healerName}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-600 border-green-600/20 bg-green-50">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                Live Session
              </Badge>
              <Button
                onClick={handleCallEnd}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jitsi Meeting */}
      <Card className="border-spiritual/20 overflow-hidden">
        <div className="relative">
          <JitsiMeeting
            {...jitsiConfig}
            onApiReady={(externalApi) => {
              console.log('Jitsi API ready:', externalApi);
            }}
            onReadyToClose={handleCallEnd}
            getIFrameRef={(iframeRef) => {
              if (iframeRef) {
                iframeRef.style.borderRadius = '8px';
              }
            }}
          />
        </div>
      </Card>
    </div>
  );
};