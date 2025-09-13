import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Share, 
  Copy, 
  Facebook, 
  Twitter, 
  Link as LinkIcon,
  MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  text?: string;
  url: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export const ShareButton = ({
  title,
  text,
  url,
  variant = "ghost",
  size = "sm",
  className = "",
  showIcon = true,
  showText = false
}: ShareButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const shareData = {
    title,
    text: text || title,
    url: window.location.origin + url
  };

  const handleNativeShare = async () => {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully!",
          description: "Content has been shared."
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
          toast({
            title: "Share failed",
            description: "Unable to share content.",
            variant: "destructive"
          });
        }
      }
    } else {
      setIsOpen(true);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard."
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareData.text
    )}&url=${encodeURIComponent(shareData.url)}&hashtags=CommonSoul,SpiritualHealing,Community`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareToFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareData.url
    )}`;
    window.open(facebookUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `${shareData.text} ${shareData.url}`
    )}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  // If native sharing is supported, show simple share button
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleNativeShare}
        className={`gap-2 ${className}`}
      >
        {showIcon && <Share className="w-4 h-4" />}
        {showText && "Share"}
      </Button>
    );
  }

  // Otherwise show dropdown with share options
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
        >
          {showIcon && <Share className="w-4 h-4" />}
          {showText && "Share"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2" />
          Share to Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2" />
          Share to Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share to WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;