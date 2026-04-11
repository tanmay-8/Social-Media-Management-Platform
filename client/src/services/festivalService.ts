import { api } from './api';
import { API_CONFIG } from '../config/api';
import type { Festival } from '../types';

export const festivalService = {
  // Public
  async getAllFestivals(): Promise<{ festivals: Festival[] }> {
    return api.get(API_CONFIG.ENDPOINTS.FESTIVALS);
  },

  // Admin only list (includes past, present, future)
  async getAllFestivalsAdmin(): Promise<{ festivals: Festival[] }> {
    return api.get(API_CONFIG.ENDPOINTS.ADMIN_FESTIVALS);
  },

  async getFestivalById(id: string): Promise<{ festival: Festival }> {
    return api.get(API_CONFIG.ENDPOINTS.FESTIVAL_BY_ID(id));
  },

  // Admin only
  async createFestival(data: {
    name: string;
    date?: string;
    yearDates?: Array<{ year: number; date: string }>;
    category: 'all' | 'hindu' | 'muslim';
    description?: string;
    baseImage?: File;
    baseImages?: File[];
  }): Promise<{ message: string; festival: Festival }> {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.date) {
      formData.append('date', data.date);
    }
    if (data.yearDates && data.yearDates.length > 0) {
      formData.append('yearDates', JSON.stringify(data.yearDates));
    }
    formData.append('category', data.category);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.baseImage) {
      formData.append('baseImage', data.baseImage);
    }
    if (data.baseImages && data.baseImages.length > 0) {
      data.baseImages.forEach((file) => formData.append('baseImages', file));
    }

    return api.postFormData(API_CONFIG.ENDPOINTS.ADMIN_FESTIVALS, formData);
  },

  async updateFestival(
    id: string,
    data: {
      name?: string;
      date?: string;
      yearDates?: Array<{ year: number; date: string }>;
      category?: 'all' | 'hindu' | 'muslim';
      description?: string;
      baseImage?: File;
      baseImages?: File[];
      defaultBaseImageId?: string;
      removeBaseImageIds?: string[];
    }
  ): Promise<{ message: string; festival: Festival }> {
    const formData = new FormData();
    if (data.name !== undefined) formData.append('name', data.name);
    if (data.date !== undefined) formData.append('date', data.date);
    if (data.yearDates !== undefined) formData.append('yearDates', JSON.stringify(data.yearDates));
    if (data.category !== undefined) formData.append('category', data.category);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.defaultBaseImageId !== undefined) {
      formData.append('defaultBaseImageId', data.defaultBaseImageId);
    }
    if (data.removeBaseImageIds && data.removeBaseImageIds.length > 0) {
      formData.append('removeBaseImageIds', JSON.stringify(data.removeBaseImageIds));
    }
    if (data.baseImage) formData.append('baseImage', data.baseImage);
    if (data.baseImages && data.baseImages.length > 0) {
      data.baseImages.forEach((file) => formData.append('baseImages', file));
    }

    return api.putFormData(API_CONFIG.ENDPOINTS.ADMIN_FESTIVAL_BY_ID(id), formData);
  },

  async deleteFestival(id: string): Promise<{ message: string }> {
    return api.delete(API_CONFIG.ENDPOINTS.ADMIN_FESTIVAL_BY_ID(id));
  },

  async importFestivals(file: File): Promise<{ message: string; count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return api.postFormData(API_CONFIG.ENDPOINTS.ADMIN_IMPORT_FESTIVALS, formData);
  }
};
