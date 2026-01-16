import { apiClient } from './client';

export interface Policy {
  id: number;
  policyNumber: string;
  premium: number;
  startDate: string;
  endDate: string;
  premiumPaid: boolean;
  status: string;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    type: string;
  };
  quote?: {
    id: number;
    premium: number;
    status: string;
  };
}

export const policiesApi = {
  getAll: async (): Promise<Policy[]> => {
    try {
      const response = await apiClient.get<any>('/api/policies');
      // Handle response format: { success: true, data: [...], count: ... } or array
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      // If response has success property, extract data
      if (response?.success && response?.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching policies:', error);
      // If unauthorized, return empty array (user will be redirected to login)
      return [];
    }
  },

  getById: async (id: number): Promise<Policy> => {
    return apiClient.get<Policy>(`/api/policies/${id}`);
  },

  create: async (policy: {
    quoteId: number;
    startDate: string;
    endDate: string;
    premiumPaid?: boolean;
  }): Promise<Policy> => {
    const response = await apiClient.post<any>('/api/policies', policy);
    return response?.data || response;
  },

  createMissing: async (): Promise<{ message: string; count: number; data: Policy[] }> => {
    return apiClient.post<any>('/api/policies/create-missing');
  },

  update: async (id: number, updates: {
    status?: string;
    startDate?: string;
    endDate?: string;
    premiumPaid?: boolean;
  }): Promise<Policy> => {
    const response = await apiClient.patch<any>(`/api/policies/${id}`, updates);
    return response?.data || response;
  },
};
