import { apiClient } from './client';

export interface Product {
  id: number;
  name: string;
  type: string;
  description: string;
  basePremium: number;
  coverageLimits?: any;
  premiumRules?: any;
  exclusions?: any;
  createdAt: string;
}

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get<any>('/api/products');
      // Handle response format: { success: true, data: [...], count: ... }
      // The API client should extract data.data, but ensure we have an array
      if (Array.isArray(response)) {
        return response;
      }
      // If response is an object with data property
      if (response && typeof response === 'object' && 'data' in response) {
        return Array.isArray(response.data) ? response.data : [];
      }
      // Fallback to empty array
      console.warn('Unexpected products API response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  getById: async (id: number): Promise<Product> => {
    return apiClient.get<Product>(`/api/products/${id}`);
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    return apiClient.post<Product>('/api/products', product);
  },

  update: async (id: number, product: Partial<Product>): Promise<Product> => {
    return apiClient.put<Product>(`/api/products/${id}`, product);
  },

  delete: async (id: number): Promise<void> => {
    return apiClient.delete(`/api/products/${id}`);
  },
};
