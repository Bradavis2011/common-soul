const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:3003';

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
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        userType: userType.toUpperCase() 
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

    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        userType: userType.toUpperCase(),
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

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const apiService = new ApiService(API_BASE_URL);
export default apiService;