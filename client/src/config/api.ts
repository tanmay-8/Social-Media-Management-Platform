// API Configuration
export const API_CONFIG = {
  // base
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  ENDPOINTS: {
    // Auth
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    ME: '/api/auth/me',
    
    // Users
    USERS: '/api/users',
    USER_BY_ID: (id: string) => `/api/users/${id}`,
    
    // Admin
    ADMIN_STATS: '/api/admin/stats',
    ADMIN_USERS: '/api/admin/users',
    ADMIN_USER_BY_ID: (id: string) => `/api/admin/users/${id}`,
    ADMIN_USER_ROLE: (id: string) => `/api/admin/users/${id}/role`,
    ADMIN_USER_FOOTER: (id: string) => `/api/admin/users/${id}/footer`,
    ADMIN_FESTIVALS: '/api/admin/festivals',
    ADMIN_FESTIVAL_BY_ID: (id: string) => `/api/admin/festivals/${id}`,
    ADMIN_IMPORT_FESTIVALS: '/api/admin/import-festivals',
    
    // Festivals
    FESTIVALS: '/api/festivals',
    FESTIVAL_BY_ID: (id: string) => `/api/festivals/${id}`,
    
    // Subscriptions
    SUBSCRIPTIONS: '/api/subscriptions',
    
    // Compose
    COMPOSE: '/api/compose',
    
    // Scheduled Posts
    SCHEDULED_POSTS: '/api/scheduled',
    
    // Social
    SOCIAL_CONNECT: '/api/social/connect',
    SOCIAL_POST: '/api/social/post',
  },
  TIMEOUT: 30000,
};
