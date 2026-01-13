import { api } from './api';

export interface ConnectFacebookData {
  pageId: string;
  pageAccessToken?: string; // No longer needed - server gets it
}

export interface ConnectInstagramData {
  instagramBusinessId: string;
  accessToken: string;
}

export interface TestPostData {
  message: string;
  imageUrl?: string;
}

export const socialService = {
  // Connect Facebook page
  async connectFacebook(data: ConnectFacebookData) {
    return api.post('/api/social/connect/facebook', data);
  },

  // Connect Instagram account
  async connectInstagram(data: ConnectInstagramData) {
    return api.post('/api/social/connect/instagram', data);
  },

  // Get Facebook pages from authenticated user's account
  async getPages() {
    return api.get('/api/social/pages');
  },

  // Test post to social media
  async testPost(data: TestPostData) {
    return api.post('/api/social/post/test', data);
  },
};
