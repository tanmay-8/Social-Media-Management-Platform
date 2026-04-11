import { api } from './api';

export interface ComposeTestData {
  festivalId: string;
  selectedBaseImageId?: string;
  footerImageUrl?: string;
  partyLogoUrl?: string;
  userPhotoUrl?: string;
}

export interface PostNowData {
  festivalId: string;
  selectedBaseImageId?: string;
}

export const composeService = {
  // Test compose image
  async testCompose(data: ComposeTestData) {
    return api.post<{ composedImageUrl: string }>('/api/compose/test', data);
  },

  // Compose and post immediately
  async postNow(data: PostNowData) {
    return api.post('/api/compose/post-now', data);
  },
};
