import { API_CONFIG } from '../config/api';
import { storage } from '../utils/storage';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(requiresAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const token = storage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        data?.message || data || 'Request failed',
        response.status,
        data
      );
    }

    return data as T;
  }

  async get<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(requiresAuth),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(body),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(body),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(requiresAuth),
      body: JSON.stringify(body),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(requiresAuth),
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async postFormData<T = any>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {};
    if (requiresAuth) {
      const token = storage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }

  async putFormData<T = any>(
    endpoint: string,
    formData: FormData,
    options: RequestOptions = {}
  ): Promise<T> {
    const { requiresAuth = true, ...fetchOptions } = options;

    const headers: HeadersInit = {};
    if (requiresAuth) {
      const token = storage.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: formData,
      ...fetchOptions,
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiService(API_CONFIG.BASE_URL);
