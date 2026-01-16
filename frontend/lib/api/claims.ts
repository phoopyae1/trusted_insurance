import { apiClient } from './client';

export interface Claim {
  id: number;
  policyId: number;
  userId: number;
  claimType: string;
  amount: number;
  incidentDate: string;
  description: string;
  status: string;
  attachments?: any;
  createdAt: string;
}

export interface CreateClaimData {
  policyId: number;
  claimType: string;
  amount: number;
  incidentDate: string;
  description: string;
}

export const claimsApi = {
  getAll: async (): Promise<Claim[]> => {
    try {
      const response = await apiClient.get<any>('/api/claims');
      // Handle response format: { success: true, data: [...], count: ... } or array
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (response?.success && response?.data) {
        return Array.isArray(response.data) ? response.data : [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching claims:', error);
      // If unauthorized, return empty array (user will be redirected to login)
      return [];
    }
  },

  getById: async (id: number): Promise<Claim> => {
    return apiClient.get<Claim>(`/api/claims/${id}`);
  },

  create: async (claimData: CreateClaimData): Promise<Claim> => {
    const response = await apiClient.post<any>('/api/claims', claimData);
    // Handle response format: { success: true, data: {...} } or direct object
    if (response?.data) {
      return response.data;
    }
    return response;
  },
};
