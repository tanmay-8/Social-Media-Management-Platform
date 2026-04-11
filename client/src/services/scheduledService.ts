import { api } from './api';

export interface ScheduledPost {
  _id: string;
  festival: {
    _id: string;
    name: string;
    date?: string;
  };
  festivalDate?: string;
  festivalYear?: number;
  selectedBaseImageId?: string;
  resolvedBaseImageUrl?: string;
  scheduledAt: string;
  message: string;
  composedImageUrl?: string;
  status: 'pending' | 'processed' | 'failed' | 'posted' | 'skipped';
  createdAt: string;
}

export interface PostedPost {
  _id: string;
  status: 'posted';
  imageUrl: string;
  scheduledAt: string;
  createdAt: string;
  postedAt: string;
  festival?: {
    _id: string;
    name: string;
    date: string;
    baseImage?: {
      url: string;
      public_id?: string;
    };
  };
  platforms?: {
    facebook?: {
      status?: 'pending' | 'posted' | 'failed';
      postedAt?: string;
    };
    instagram?: {
      status?: 'pending' | 'posted' | 'failed';
      postedAt?: string;
    };
  };
}

export interface CreateScheduledPost {
  festivalId: string;
  festivalDate?: string;
  selectedBaseImageId?: string;
  scheduledAt?: string;
  message: string;
  imageUrl?: string;
}

export const scheduledService = {
  // Get all scheduled posts for current user
  async getScheduledPosts() {
    return api.get<{ posts: ScheduledPost[] }>('/api/scheduled');
  },

  // Get all posted posts for current user
  async getPostedPosts() {
    return api.get<{ posts: PostedPost[] }>('/api/scheduled/posted');
  },

  // Create a new scheduled post
  async createScheduledPost(data: CreateScheduledPost) {
    return api.post<{ post: ScheduledPost }>('/api/scheduled', data);
  },

  // Process a scheduled post (manually trigger)
  async processPost(postId: string) {
    return api.post(`/api/scheduled/${postId}/process`);
  },
};
