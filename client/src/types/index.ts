export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'user' | 'admin';
  facebookId?: string;
  authProvider?: 'local' | 'facebook';
  subscription?: {
    isActive: boolean;
    plan?: string;
    startDate?: string;
    endDate?: string;
  };
  profile?: {
    instagramHandle?: string;
    facebookPageId?: string;
    instagramBusinessId?: string;
    footerImage?: {
      url: string;
      public_id: string;
    };
    festivalCategory?: 'all' | 'hindu' | 'muslim';
  };
}

export interface Festival {
  _id: string;
  name: string;
  date: string;
  category: 'all' | 'hindu' | 'muslim';
  description?: string;
  baseImage?: {
    url: string;
    public_id: string;
  };
}

export interface Stats {
  totalUsers: number;
  activeSubscriptions: number;
  totalFestivals: number;
  scheduledPosts: number;
}

export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData extends LoginCredentials {
  name: string;
  phone?: string;
}
