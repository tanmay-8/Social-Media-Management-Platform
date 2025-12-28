import { api } from './api';
import { API_CONFIG } from '../config/api';
import { storage } from '../utils/storage';
import type { AuthResponse, LoginCredentials, SignupData, User } from '../types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      credentials,
      { requiresAuth: false }
    );

    // Store token
    storage.setToken(response.token);

    return response;
  },

  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.SIGNUP,
      data,
      { requiresAuth: false }
    );

    // Store token
    storage.setToken(response.token);

    return response;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return api.get(API_CONFIG.ENDPOINTS.ME);
  },

  logout(): void {
    storage.clear();
  },

  isAuthenticated(): boolean {
    return !!storage.getToken();
  },
};
