import { apiClient } from './client';

export interface Quote {
  id: number;
  productId: number;
  userId: number;
  premium: number;
  status: string;
  version: number;
  metadata: any;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    type: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  policy?: {
    id: number;
    policyNumber: string;
    startDate?: string;
    endDate?: string;
    premiumPaid?: boolean;
  } | null;
}

export interface CreateQuoteData {
  productId: number;
  metadata: {
    age?: number;
    smoker?: boolean;
    vehicleValue?: number;
    tripDuration?: number;
  };
}

export const quotesApi = {
  getAll: async (): Promise<Quote[]> => {
    try {
      const response = await apiClient.get<any>('/api/quotes');
      if (Array.isArray(response)) {
        return response;
      }
      if (response?.data && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return [];
    }
  },

  create: async (quoteData: CreateQuoteData): Promise<Quote> => {
    const response = await apiClient.post<any>('/api/quotes', quoteData);
    // Handle response format: { success: true, data: {...} } or direct object
    if (response?.data) {
      return response.data;
    }
    return response;
  },

  updateStatus: async (
    id: number, 
    status: string, 
    premiumPaid?: boolean, 
    startDate?: string, 
    endDate?: string
  ): Promise<Quote> => {
    const body: any = { status };
    if (premiumPaid !== undefined) {
      body.premiumPaid = premiumPaid;
    }
    if (startDate) {
      body.startDate = startDate;
    }
    if (endDate) {
      body.endDate = endDate;
    }
    return apiClient.patch<Quote>(`/api/quotes/${id}/status`, body);
  },
};
