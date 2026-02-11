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
  eligibleAmount?: number;
  deductible?: number;
  approvedAmount?: number;
  decisionReason?: string;
  assessedAt?: string;
  assessedBy?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  policy?: {
    id: number;
    policyNumber: string;
    product?: {
      id: number;
      name: string;
      type: string;
    };
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  assessedByUser?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreateClaimData {
  policyId: number;
  claimType: string;
  amount: number;
  incidentDate: string;
  description: string;
}

export interface CreateCustomerClaimData {
  policyNumber: string; // Customer endpoint uses policyNumber, not policyId
  claimType: string;
  amount: number;
  incidentDate: string;
  description: string;
  userId?: number; // Optional, defaults to authenticated user
}

export interface ClaimListFilters {
  status?: string;
  claimType?: string;
  policyId?: number;
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

  // Customer-specific endpoint: POST /api/customer-agent/claims
  getCustomerClaims: async (filters?: ClaimListFilters): Promise<Claim[]> => {
    try {
      const response = await apiClient.post<any>('/api/customer-agent/claims', filters || {});
      // Handle response format: { success: true, data: [...], count: ... }
      if (response?.success && response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching customer claims:', error);
      // If unauthorized, return empty array (user will be redirected to login)
      return [];
    }
  },

  getById: async (id: number): Promise<Claim> => {
    const response = await apiClient.get<any>(`/api/claims/${id}`);
    return response?.data || response;
  },

  create: async (claimData: CreateClaimData): Promise<Claim> => {
    const response = await apiClient.post<any>('/api/claims', claimData);
    // Handle response format: { success: true, data: {...} } or direct object
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  // Customer-specific claim submission: POST /api/customer-agent/claims/submit
  submitCustomerClaim: async (claimData: CreateCustomerClaimData): Promise<Claim> => {
    const response = await apiClient.post<any>('/api/customer-agent/claims/submit', claimData);
    // Handle response format: { success: true, data: {...}, message: ... }
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  assess: async (id: number): Promise<Claim> => {
    const response = await apiClient.patch<any>(`/api/claims/${id}/assess`, {});
    return response?.data || response;
  },

  makeDecision: async (
    id: number,
    decision: {
      status: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED';
      decisionReason: string;
      eligibleAmount?: number;
      deductible?: number;
      approvedAmount?: number;
    }
  ): Promise<Claim> => {
    const response = await apiClient.patch<any>(`/api/claims/${id}/decision`, decision);
    return response?.data || response;
  },

  processPayment: async (id: number): Promise<Claim> => {
    const response = await apiClient.patch<any>(`/api/claims/${id}/pay`, {});
    return response?.data || response;
  },
};
