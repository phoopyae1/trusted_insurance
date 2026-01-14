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
    return apiClient.get<Product[]>('/api/products');
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
