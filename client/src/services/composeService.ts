import { api } from './api';

export interface ComposeTestData {
  festivalId: string;
  footerImageUrl?: string;
  partyLogoUrl?: string;
  userPhotoUrl?: string;
}

export const composeService = {
  // Test compose image
  async testCompose(data: ComposeTestData) {
    return api.post<{ composedImageUrl: string }>('/api/compose/test', data);
  },
};
