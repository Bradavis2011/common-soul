import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/api";

interface ReportButtonProps {
  targetType: 'USER' | 'SERVICE' | 'REVIEW' | 'MESSAGE';
  targetId: string;
  targetUserId?: string;
  size?: "sm" | "default" | "lg";
  variant?: "ghost" | "outline" | "destructive";
  className?: string;
}

const REPORT_REASONS = {
  SPAM: 'Spam',
  INAPPROPRIATE: 'Inappropriate Content', 
  FRAUD: 'Suspected Fraud',
  NO_SHOW: 'No Show / Cancellation Issue',
  UNPROFESSIONAL: 'Unprofessional Behavior',
  SAFETY: 'Safety Concern',
  OTHER: 'Other'
};

export const ReportButton = ({ 
  targetType, 
  targetId, 
  targetUserId, 
  size = "sm", 
  variant = "ghost",
  className = ""
}: ReportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiService.createReport({
        targetType,
        targetId,
        reason,
        details: details || undefined
      });

      if (response.success) {
        toast({
          title: "Report Submitted",
          description: "Thank you for helping keep our community safe. We'll review this report shortly."
        });
        
        setIsOpen(false);
        setReason("");
        setDetails("");
      } else {
        throw new Error(response.message || "Failed to submit report");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          className={`text-muted-foreground hover:text-destructive ${className}`}
        >
          <Flag className="w-4 h-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Report Content
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_REASONS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional context that might help us review this report..."
              className="min-h-[80px]"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {details.length}/500 characters
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> False reports may result in action against your account. 
              Please only report content that genuinely violates our community guidelines.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
          >
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};