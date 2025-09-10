import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, Save, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import apiService from "@/services/api";

interface DayAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

interface AvailabilityManagerProps {
  healerId?: string;
}

const AvailabilityManager = ({ healerId }: AvailabilityManagerProps) => {
  const { toast } = useToast();
  const [availability, setAvailability] = useState<DayAvailability[]>([
    { dayOfWeek: 1, dayName: 'Monday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 2, dayName: 'Tuesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 3, dayName: 'Wednesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 4, dayName: 'Thursday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 5, dayName: 'Friday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 6, dayName: 'Saturday', isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' },
    { dayOfWeek: 0, dayName: 'Sunday', isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' }
  ]);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Generate time options (8 AM to 10 PM in 30-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 22 && minute > 0) break; // Stop at 10:00 PM
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        const displayTime = formatTime(timeString);
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const timeOptions = generateTimeOptions();

  // Load existing availability
  useEffect(() => {
    if (healerId) {
      loadAvailability();
    }
  }, [healerId]);

  const loadAvailability = async () => {
    if (!healerId) return;
    
    setLoading(true);
    try {
      const response = await apiService.getHealerAvailability(healerId);
      if (response.success && response.data?.availability) {
        setAvailability(response.data.availability);
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
      toast({
        title: "Error",
        description: "Failed to load your availability settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDayAvailability = (dayOfWeek: number, field: string, value: any) => {
    setAvailability(prev => 
      prev.map(day => 
        day.dayOfWeek === dayOfWeek 
          ? { ...day, [field]: value }
          : day
      )
    );
    setHasChanges(true);
  };

  const saveAvailability = async () => {
    setLoading(true);
    try {
      const response = await apiService.updateHealerAvailability(availability);
      if (response.success) {
        toast({
          title: "Success",
          description: "Your availability has been updated"
        });
        setHasChanges(false);
      } else {
        throw new Error(response.message || 'Failed to update availability');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save availability",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setAvailability([
      { dayOfWeek: 1, dayName: 'Monday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 2, dayName: 'Tuesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 3, dayName: 'Wednesday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 4, dayName: 'Thursday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 5, dayName: 'Friday', isAvailable: true, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 6, dayName: 'Saturday', isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' },
      { dayOfWeek: 0, dayName: 'Sunday', isAvailable: false, startTime: '09:00:00', endTime: '17:00:00' }
    ]);
    setHasChanges(true);
  };

  const copyToAllDays = (sourceDay: DayAvailability) => {
    setAvailability(prev => 
      prev.map(day => ({
        ...day,
        isAvailable: sourceDay.isAvailable,
        startTime: sourceDay.startTime,
        endTime: sourceDay.endTime,
        breakStartTime: sourceDay.breakStartTime,
        breakEndTime: sourceDay.breakEndTime
      }))
    );
    setHasChanges(true);
  };

  const getWorkingDaysCount = () => {
    return availability.filter(day => day.isAvailable).length;
  };

  const getTotalWorkingHours = () => {
    return availability.reduce((total, day) => {
      if (!day.isAvailable) return total;
      
      const start = new Date(`2024-01-01T${day.startTime}`);
      const end = new Date(`2024-01-01T${day.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // Subtract break time if applicable
      if (day.breakStartTime && day.breakEndTime) {
        const breakStart = new Date(`2024-01-01T${day.breakStartTime}`);
        const breakEnd = new Date(`2024-01-01T${day.breakEndTime}`);
        const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
        return total + Math.max(0, hours - breakHours);
      }
      
      return total + Math.max(0, hours);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Weekly Availability
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{getWorkingDaysCount()} working days</span>
          <span>{getTotalWorkingHours().toFixed(1)} hours per week</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getWorkingDaysCount()}</div>
            <div className="text-xs text-muted-foreground">Working Days</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{getTotalWorkingHours().toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">Hours/Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Math.round(getTotalWorkingHours() / getWorkingDaysCount() || 0)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Hours/Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {availability.some(day => day.breakStartTime) ? 'Yes' : 'No'}
            </div>
            <div className="text-xs text-muted-foreground">Break Times</div>
          </div>
        </div>

        <Separator />

        {/* Day by Day Settings */}
        <div className="space-y-4">
          {availability
            .sort((a, b) => (a.dayOfWeek === 0 ? 7 : a.dayOfWeek) - (b.dayOfWeek === 0 ? 7 : b.dayOfWeek))
            .map((day) => (
            <Card key={day.dayOfWeek} className={`transition-colors ${day.isAvailable ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Label className="text-base font-medium min-w-[80px]">{day.dayName}</Label>
                    <Switch
                      checked={day.isAvailable}
                      onCheckedChange={(checked) => updateDayAvailability(day.dayOfWeek, 'isAvailable', checked)}
                    />
                    {day.isAvailable && <Badge variant="outline" className="text-green-600 border-green-600">Available</Badge>}
                  </div>
                  
                  {day.isAvailable && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToAllDays(day)}
                      className="text-xs"
                    >
                      Copy to All Days
                    </Button>
                  )}
                </div>

                {day.isAvailable && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Time</Label>
                      <Select 
                        value={day.startTime} 
                        onValueChange={(value) => updateDayAvailability(day.dayOfWeek, 'startTime', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">End Time</Label>
                      <Select 
                        value={day.endTime} 
                        onValueChange={(value) => updateDayAvailability(day.dayOfWeek, 'endTime', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions.filter(option => option.value > day.startTime).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Break Start (Optional)</Label>
                      <Select 
                        value={day.breakStartTime || 'none'} 
                        onValueChange={(value) => updateDayAvailability(day.dayOfWeek, 'breakStartTime', value === 'none' ? undefined : value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="No break" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No break</SelectItem>
                          {timeOptions
                            .filter(option => option.value > day.startTime && option.value < day.endTime)
                            .map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Break End</Label>
                      <Select 
                        value={day.breakEndTime || 'none'} 
                        onValueChange={(value) => updateDayAvailability(day.dayOfWeek, 'breakEndTime', value === 'none' ? undefined : value)}
                        disabled={!day.breakStartTime}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Break end" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeOptions
                            .filter(option => 
                              day.breakStartTime && 
                              option.value > day.breakStartTime && 
                              option.value < day.endTime
                            )
                            .map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={loadAvailability}
              disabled={loading}
            >
              <Clock className="w-4 h-4 mr-2" />
              Reload
            </Button>
            <Button 
              onClick={saveAvailability} 
              disabled={!hasChanges || loading}
              variant="spiritual"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-amber-800 text-sm">
              You have unsaved changes to your availability. Don't forget to save!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AvailabilityManager;