import { api } from './api';
import { API_CONFIG } from '../config/api';
import type { User, Stats } from '../types';

export const adminService = {
  // Stats
  async getStats(): Promise<Stats> {
    return api.get<Stats>(API_CONFIG.ENDPOINTS.ADMIN_STATS);
  },

  // Users
  async getAllUsers(): Promise<{ users: User[] }> {
    return api.get(API_CONFIG.ENDPOINTS.ADMIN_USERS);
  },

  async updateUser(
    userId: string,
    data: { name?: string; email?: string; phone?: string }
  ): Promise<{ message: string; user: User }> {
    return api.patch(API_CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(userId), data);
  },

  async changeUserRole(
    userId: string,
    role: 'user' | 'admin'
  ): Promise<{ message: string; user: User }> {
    return api.patch(API_CONFIG.ENDPOINTS.ADMIN_USER_ROLE(userId), { role });
  },

  async deleteUser(userId: string): Promise<{ message: string }> {
    return api.delete(API_CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(userId));
  },

  async uploadUserFooter(
    userId: string,
    file: File
  ): Promise<{ message: string; footer: { url: string; public_id: string } }> {
    const formData = new FormData();
    formData.append('footer', file);

    return api.postFormData(
      API_CONFIG.ENDPOINTS.ADMIN_USER_FOOTER(userId),
      formData
    );
  },

  async updateUserSubscription(
    userId: string,
    data: {
      plan?: string;
      isActive?: boolean;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ message: string; user: User }> {
    return api.patch(API_CONFIG.ENDPOINTS.ADMIN_USER_BY_ID(userId), {
      subscription: data
    });
  },
};
