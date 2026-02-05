type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
};

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { method = 'GET', headers = {}, body } = config;

    const token = this.getToken();
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: defaultHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle token expiration or any 401 error - try to refresh
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the original request with new token
          const newToken = this.getToken();
          if (newToken) {
            defaultHeaders['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
              method,
              headers: defaultHeaders,
              body: body ? JSON.stringify(body) : undefined,
            });
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) {
              // If retry still fails, clear auth and redirect
              if (retryResponse.status === 401) {
                this.clearAuth();
                if (typeof window !== 'undefined') {
                  window.location.href = '/login';
                }
              }
              throw new ApiError(
                retryData.error?.message || 'An error occurred',
                retryResponse.status,
                retryData.error?.code
              );
            }
            return retryData.data || retryData;
          }
        }
        
        // If refresh failed or no refresh token, clear auth and redirect to login
        this.clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(
          'Your session has expired. Please log in again.',
          response.status,
          'SESSION_EXPIRED'
        );
      }
      
      throw new ApiError(
        data.error?.message || data.message || 'An error occurred',
        response.status,
        data.error?.code
      );
    }

    return data.data || data;
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.log('No refresh token available');
        return false;
      }

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('Token refresh failed:', errorData.message || 'Refresh token invalid or expired');
        return false;
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        console.log('Token refreshed successfully');
        return true;
      }
      console.log('Invalid refresh response format');
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
