import { apiClient } from './client';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/auth/login', { email, password });
    // Handle both response formats: direct object or wrapped in { data: ... }
    if (response.token) {
      return response;
    }
    if (response.data && response.data.token) {
      return response.data;
    }
    throw new Error('Invalid login response format');
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/auth/register', {
      email,
      password,
      name,
    });
    // Handle both response formats: direct object or wrapped in { data: ... }
    if (response.token) {
      return response;
    }
    if (response.data && response.data.token) {
      return response.data;
    }
    throw new Error('Invalid register response format');
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/api/auth/logout', { refreshToken });
  },

  refreshToken: async (refreshToken: string): Promise<{
    token: string;
    refreshToken: string;
  }> => {
    return apiClient.post('/api/auth/refresh', { refreshToken });
  },
};
