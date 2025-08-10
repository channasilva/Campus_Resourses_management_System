const API_BASE_URL = 'http://localhost:3001/api';

export interface RegisterData {
  username: string;
  email: string;
  role: 'student' | 'lecturer';
  lecturerId?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: 'student' | 'lecturer';
      lecturerId?: string;
      studentId?: string;
    };
    token: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('Making API request to:', url);
      const response = await fetch(url, config);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const requestData = {
      username: data.username,
      email: data.email,
      role: data.role,
      lecturerId: data.role === 'lecturer' ? data.lecturerId : undefined,
      password: data.password,
    };
    
    console.log('Sending registration data:', requestData);
    
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async healthCheck(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/test');
  }
}

export const apiService = new ApiService(); 