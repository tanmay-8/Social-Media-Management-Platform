import { api } from './api';

export interface UserProfile {
  name?: string;
  phone?: string;
  address?: string;
  instagramHandle?: string;
  facebookPageId?: string;
}

export const userService = {
  // Get user profile
  async getProfile() {
    return api.get('/api/users/profile');
  },

  // Update user profile
  async updateProfile(data: UserProfile) {
    return api.put('/api/users/profile', data);
  },

  // Upload footer image
  async uploadFooter(file: File) {
    const formData = new FormData();
    formData.append('footer', file);
    
    return api.postFormData('/api/users/footer', formData);
  },

  // Upload profile image
  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    return api.postFormData('/api/users/profile-image', formData);
  },
};
