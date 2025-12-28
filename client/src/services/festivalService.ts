import { api } from './api';
import { API_CONFIG } from '../config/api';
import type { Festival } from '../types';

export const festivalService = {
  // Public
  async getAllFestivals(): Promise<{ festivals: Festival[] }> {
    return api.get(API_CONFIG.ENDPOINTS.FESTIVALS);
  },

  async getFestivalById(id: string): Promise<{ festival: Festival }> {
    return api.get(API_CONFIG.ENDPOINTS.FESTIVAL_BY_ID(id));
  },

  // Admin only
  async createFestival(data: {
    name: string;
    date: string;
    category: 'all' | 'hindu' | 'muslim';
    description?: string;
    baseImage?: File;
  }): Promise<{ message: string; festival: Festival }> {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('date', data.date);
    formData.append('category', data.category);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.baseImage) {
      formData.append('baseImage', data.baseImage);
    }

    return api.postFormData(API_CONFIG.ENDPOINTS.ADMIN_FESTIVALS, formData);
  },

  async updateFestival(
    id: string,
    data: {
      name?: string;
      date?: string;
      category?: 'all' | 'hindu' | 'muslim';
      description?: string;
      baseImage?: File;
    }
  ): Promise<{ message: string; festival: Festival }> {
    // If image is provided, use FormData
    if (data.baseImage) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.date) formData.append('date', data.date);
      if (data.category) formData.append('category', data.category);
      if (data.description) formData.append('description', data.description);
      formData.append('baseImage', data.baseImage);

      return api.putFormData(API_CONFIG.ENDPOINTS.ADMIN_FESTIVAL_BY_ID(id), formData);
    }

    // Otherwise use JSON
    return api.put(API_CONFIG.ENDPOINTS.ADMIN_FESTIVAL_BY_ID(id), data);
  },

  async deleteFestival(id: string): Promise<{ message: string }> {
    return api.delete(API_CONFIG.ENDPOINTS.ADMIN_FESTIVAL_BY_ID(id));
  },

  async importFestivals(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return api.postFormData(API_CONFIG.ENDPOINTS.ADMIN_IMPORT_FESTIVALS, formData);
  },
};
