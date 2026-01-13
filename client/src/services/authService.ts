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

  // Facebook OAuth - initiate login or connect
  loginWithFacebook(): void {
    const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
    const token = storage.getToken();
    
    // Pass token as query parameter if user is authenticated (connecting account)
    if (token) {
      window.location.href = `${serverUrl}/api/auth/facebook?token=${encodeURIComponent(token)}`;
    } else {
      window.location.href = `${serverUrl}/api/auth/facebook`;
    }
  },

  // Instagram OAuth - initiate login or connect
  loginWithInstagram(): void {
    const serverUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
    const token = storage.getToken();
    
    // Pass token as query parameter if user is authenticated (connecting account)
    if (token) {
      window.location.href = `${serverUrl}/api/auth/instagram?token=${encodeURIComponent(token)}`;
    } else {
      window.location.href = `${serverUrl}/api/auth/instagram`;
    }
  },

  // Handle OAuth callback
  async handleOAuthCallback(token: string): Promise<{ user: User }> {
    storage.setToken(token);
    return this.getCurrentUser();
  },

  // Connect Facebook account to existing user
  async connectFacebook(accessToken: string): Promise<{ user: User }> {
    return api.post('/api/auth/facebook/connect', { accessToken });
  },

  // Disconnect Facebook account
  async disconnectFacebook(): Promise<{ user: User }> {
    return api.post('/api/auth/facebook/disconnect');
  },

  // Disconnect Instagram account
  async disconnectInstagram(): Promise<{ user: User }> {
    return api.post('/api/auth/instagram/disconnect');
  },
};
