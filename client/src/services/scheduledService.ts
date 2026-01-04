import { api } from './api';

export interface ScheduledPost {
  _id: string;
  festival: {
    _id: string;
    name: string;
    date: string;
  };
  scheduledDate: string;
  message: string;
  composedImageUrl?: string;
  status: 'pending' | 'processed' | 'failed';
  createdAt: string;
}

export interface CreateScheduledPost {
  festivalId: string;
  scheduledDate: string;
  message: string;
  imageUrl?: string;
}

export const scheduledService = {
  // Get all scheduled posts for current user
  async getScheduledPosts() {
    return api.get<{ posts: ScheduledPost[] }>('/api/scheduled');
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
