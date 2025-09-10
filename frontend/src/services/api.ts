const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'An error occurred',
          errors: data.errors || [],
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  // Auth methods
  async login(email: string, password: string, userType: 'seeker' | 'healer'): Promise<ApiResponse> {
    // Map frontend user types to backend expected values
    const userTypeMapping = {
      'seeker': 'CUSTOMER',
      'healer': 'HEALER'
    };

    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        userType: userTypeMapping[userType]
      }),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async register(
    name: string, 
    email: string, 
    password: string, 
    userType: 'seeker' | 'healer'
  ): Promise<ApiResponse> {
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    // Map frontend user types to backend expected values
    const userTypeMapping = {
      'seeker': 'CUSTOMER',
      'healer': 'HEALER'
    };

    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        userType: userTypeMapping[userType],
        firstName,
        lastName,
      }),
    });

    if (response.success && response.data?.token) {
      this.token = response.data.token;
      localStorage.setItem('auth_token', this.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
    }

    return response;
  }

  async logout(): Promise<void> {
    // Call logout endpoint if it exists
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore logout errors
    }

    // Clear local storage
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request('/auth/me');
  }

  // Profile methods
  async getProfile(): Promise<ApiResponse> {
    return this.request('/profile');
  }

  async updateProfile(profileData: any): Promise<ApiResponse> {
    return this.request('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Healer methods
  async getHealers(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/healers${queryString}`);
  }

  async getHealer(id: string): Promise<ApiResponse> {
    return this.request(`/healers/${id}`);
  }

  // Booking methods
  async createBooking(bookingData: any): Promise<ApiResponse> {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  async getBookings(): Promise<ApiResponse> {
    return this.request('/bookings');
  }

  // Service methods
  async getServices(healerId?: string): Promise<ApiResponse> {
    const endpoint = healerId ? `/services?healerId=${healerId}` : '/services';
    return this.request(endpoint);
  }

  // Review methods
  async createReview(reviewData: any): Promise<ApiResponse> {
    return this.request('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  async getReviews(healerId: string): Promise<ApiResponse> {
    return this.request(`/reviews?healerId=${healerId}`);
  }

  // Messaging methods
  async getConversations(): Promise<ApiResponse> {
    return this.request('/messaging/conversations');
  }

  async getMessages(conversationId: string): Promise<ApiResponse> {
    return this.request(`/messaging/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string): Promise<ApiResponse> {
    return this.request(`/messaging/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  // Update auth token (for when token is refreshed)
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Payment methods
  async createCheckoutSession(bookingId: string): Promise<ApiResponse> {
    return this.request(`/payments/create-checkout/${bookingId}`, {
      method: 'POST',
    });
  }

  async createPaymentIntent(bookingId: string): Promise<ApiResponse> {
    return this.request(`/payments/create-intent/${bookingId}`, {
      method: 'POST',
    });
  }

  async getPaymentStatus(bookingId: string): Promise<ApiResponse> {
    return this.request(`/payments/status/${bookingId}`);
  }

  async requestRefund(bookingId: string, amount?: number, reason?: string): Promise<ApiResponse> {
    return this.request(`/payments/refund/${bookingId}`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  // Healer profile methods
  async updateHealerProfile(profileData: {
    specialties?: string[];
    hourlyRate?: number;
    yearsExperience?: number;
    certifications?: string[];
    isActive?: boolean;
  }): Promise<ApiResponse> {
    return this.request('/healers/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getHealerById(id: string): Promise<ApiResponse> {
    return this.request(`/healers/${id}`);
  }

  // Service management methods
  async getMyServices(): Promise<ApiResponse> {
    return this.request('/services/my-services');
  }

  async createService(serviceData: {
    title: string;
    description: string;
    duration: number;
    price: number;
    category: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<ApiResponse> {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(serviceId: string, serviceData: {
    title?: string;
    description?: string;
    duration?: number;
    price?: number;
    category?: string;
    imageUrl?: string;
    isActive?: boolean;
  }): Promise<ApiResponse> {
    return this.request(`/services/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  }

  async deleteService(serviceId: string): Promise<ApiResponse> {
    return this.request(`/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  async getServiceById(serviceId: string): Promise<ApiResponse> {
    return this.request(`/services/${serviceId}`);
  }

  // Availability methods
  async getHealerAvailability(healerId: string, startDate?: Date, endDate?: Date): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate.toISOString());
    if (endDate) queryParams.append('endDate', endDate.toISOString());
    
    const endpoint = `/healers/${healerId}/availability` + 
      (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return this.request(endpoint);
  }

  async updateHealerAvailability(availability: any[]): Promise<ApiResponse> {
    return this.request('/healers/availability', {
      method: 'PUT',
      body: JSON.stringify({ availability }),
    });
  }

  // Report methods
  async createReport(reportData: {
    targetType: string;
    targetId: string;
    reason: string;
    details?: string;
  }): Promise<ApiResponse> {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  async getMyReports(): Promise<ApiResponse> {
    return this.request('/reports/my-reports');
  }

  async getReportStats(userId: string): Promise<ApiResponse> {
    return this.request(`/reports/stats/${userId}`);
  }

  // Healer verification status
  async getHealerVerificationStatus(): Promise<ApiResponse> {
    return this.request('/healers/verification-status');
  }

  async submitForVerification(): Promise<ApiResponse> {
    return this.request('/healers/submit-for-verification', {
      method: 'POST',
    });
  }

  // Admin methods
  async getAdminReports(params?: any): Promise<ApiResponse> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/admin/reports${queryString}`);
  }

  async resolveReport(reportId: string, data: {
    status: string;
    resolution: string;
    action?: string;
  }): Promise<ApiResponse> {
    return this.request(`/admin/reports/${reportId}/resolve`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Stripe Connect methods
  async createStripeConnectAccount(): Promise<ApiResponse> {
    return this.request('/payments/connect/create', {
      method: 'POST',
    });
  }

  async createStripeOnboardingLink(): Promise<ApiResponse> {
    return this.request('/payments/connect/onboarding', {
      method: 'POST',
    });
  }

  async getStripeConnectStatus(): Promise<ApiResponse> {
    return this.request('/payments/connect/status');
  }

  // Availability management methods (duplicate removed)

  async getMyAvailability(): Promise<ApiResponse> {
    return this.request('/availability');
  }

  async updateAvailabilitySchedule(schedule: any[]): Promise<ApiResponse> {
    return this.request('/availability/schedule', {
      method: 'PUT',
      body: JSON.stringify({ schedule }),
    });
  }

  async updateDayAvailability(dayOfWeek: number, availabilityData: any): Promise<ApiResponse> {
    return this.request(`/availability/day/${dayOfWeek}`, {
      method: 'PUT',
      body: JSON.stringify(availabilityData),
    });
  }

  async getAvailableSlots(healerId: string, date: string, duration: number): Promise<ApiResponse> {
    return this.request(`/availability/slots/${healerId}?date=${date}&duration=${duration}`);
  }

  async checkSlotAvailability(healerId: string, scheduledAt: string, duration: number): Promise<ApiResponse> {
    return this.request('/availability/check-slot', {
      method: 'POST',
      body: JSON.stringify({ healerId, scheduledAt, duration }),
    });
  }

  async initializeHealerAvailability(): Promise<ApiResponse> {
    return this.request('/availability/init', {
      method: 'POST',
    });
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;