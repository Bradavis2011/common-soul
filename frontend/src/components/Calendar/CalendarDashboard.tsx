import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  MapPin, 
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import apiService from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  id: string;
  customerId: string;
  scheduledAt: string;
  duration: number;
  totalPrice: number;
  status: string;
  notes?: string;
  service?: {
    title: string;
    category: string;
  };
  customer?: {
    name: string;
    email: string;
  };
}

interface CalendarDashboardProps {
  healerId?: string;
  viewMode?: 'healer' | 'customer';
}

const CalendarDashboard = ({ healerId, viewMode = 'healer' }: CalendarDashboardProps) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const actualHealerId = healerId || user?.id;

  // Load bookings for the current month
  useEffect(() => {
    loadBookings();
  }, [currentDate, actualHealerId]);

  // Filter bookings when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === statusFilter));
    }
  }, [bookings, statusFilter]);

  const loadBookings = async () => {
    if (!actualHealerId) return;

    setLoading(true);
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      
      const response = await apiService.getBookings();
      if (response.success) {
        // Filter bookings for the current month and healer
        const monthBookings = response.data.filter((booking: Booking) => {
          const bookingDate = new Date(booking.scheduledAt);
          return bookingDate >= startDate && 
                 bookingDate <= endDate &&
                 (viewMode === 'healer' ? booking.healerId === actualHealerId : booking.customerId === actualHealerId);
        });
        setBookings(monthBookings);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date): Booking[] => {
    return filteredBookings.filter(booking => 
      isSameDay(new Date(booking.scheduledAt), date)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'PENDING': return 'Pending';
      case 'IN_PROGRESS': return 'In Progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  // Custom day content to show booking indicators
  const dayContent = (day: Date) => {
    const dayBookings = getBookingsForDate(day);
    const hasBookings = dayBookings.length > 0;
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={isToday(day) ? "font-bold" : ""}>{day.getDate()}</span>
        {hasBookings && (
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
            {dayBookings.slice(0, 3).map((booking, index) => (
              <div 
                key={index} 
                className={`w-1 h-1 rounded-full ${getStatusColor(booking.status)}`}
              />
            ))}
            {dayBookings.length > 3 && (
              <div className="w-1 h-1 rounded-full bg-gray-400" />
            )}
          </div>
        )}
      </div>
    );
  };

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  const monthStats = {
    total: filteredBookings.length,
    confirmed: filteredBookings.filter(b => b.status === 'CONFIRMED').length,
    pending: filteredBookings.filter(b => b.status === 'PENDING').length,
    completed: filteredBookings.filter(b => b.status === 'COMPLETED').length,
    revenue: filteredBookings.filter(b => b.status === 'COMPLETED').reduce((sum, b) => sum + b.totalPrice, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            {viewMode === 'healer' ? 'My Schedule' : 'My Sessions'}
          </h2>
          <p className="text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </p>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{monthStats.total}</div>
            <div className="text-xs text-muted-foreground">Total Sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{monthStats.confirmed}</div>
            <div className="text-xs text-muted-foreground">Confirmed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{monthStats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{monthStats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        {viewMode === 'healer' && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${monthStats.revenue}</div>
              <div className="text-xs text-muted-foreground">Revenue</div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Calendar View
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentDate}
                onMonthChange={setCurrentDate}
                className="rounded-md border"
                components={{
                  DayContent: ({ date }) => dayContent(date)
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Day Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : selectedDateBookings.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={`${getStatusColor(booking.status)} text-white`}>
                          {getStatusLabel(booking.status)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(booking.scheduledAt), 'h:mm a')}
                        </span>
                      </div>
                      
                      {booking.service && (
                        <div className="text-sm font-medium">{booking.service.title}</div>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{booking.duration} minutes</span>
                        <DollarSign className="w-3 h-3 ml-2" />
                        <span>${booking.totalPrice}</span>
                      </div>
                      
                      {viewMode === 'healer' && booking.customer && (
                        <div className="flex items-center gap-2 text-sm">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {booking.customer.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{booking.customer.name || booking.customer.email}</span>
                        </div>
                      )}
                      
                      {booking.notes && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                          {booking.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No sessions scheduled for this date</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalendarDashboard;