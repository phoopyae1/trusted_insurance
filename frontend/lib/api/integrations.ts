import { apiClient } from './client';

export interface Integration {
  _id: string;
  name: string;
  type: 'context_key' | 'script_tag';
  contextKey?: string;
  scriptTag?: string;
  description?: string;
  isActive: boolean;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationData {
  name?: string;
  type?: 'context_key' | 'script_tag';
  contextKey?: string;
  scriptTag?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateIntegrationData extends Partial<CreateIntegrationData> {}

export const integrationsApi = {
  getAll: async (): Promise<Integration[]> => {
    const response = await apiClient.get<{ success: true; data: Integration[] }>('/api/integrations');
    return response?.data || response || [];
  },

  getById: async (id: string): Promise<Integration> => {
    const response = await apiClient.get<{ success: true; data: Integration }>(`/api/integrations/${id}`);
    return response?.data || response;
  },

  create: async (data: CreateIntegrationData): Promise<Integration> => {
    const response = await apiClient.post<{ success: true; data: Integration }>('/api/integrations', data);
    return response?.data || response;
  },

  update: async (id: string, data: UpdateIntegrationData): Promise<Integration> => {
    const response = await apiClient.put<{ success: true; data: Integration }>(`/api/integrations/${id}`, data);
    return response?.data || response;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/integrations/${id}`);
  },
};
