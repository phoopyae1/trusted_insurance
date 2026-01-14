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
    return apiClient.post<AuthResponse>('/api/auth/login', { email, password });
  },

  register: async (
    email: string,
    password: string,
    name: string
  ): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/api/auth/register', {
      email,
      password,
      name,
    });
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
