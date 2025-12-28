import React, { createContext, useContext } from 'react';
import { create } from 'zustand';

export type FestivalPreference = 'hindu' | 'muslim' | 'all';

export interface PartyInfo {
  type: 'predefined' | 'custom';
  name: string;
  logoUrl?: string;
}

export interface SubscriptionPlan {
  durationMonths: 1 | 3 | 6 | 12;
  active: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  role?: 'user' | 'admin';
  photoUrl?: string;
  party?: PartyInfo;
  festivalPreference?: FestivalPreference;
}

export interface AppState {
  user: UserProfile | null;
  subscription: SubscriptionPlan | null;
  generatedPhotos: string[];
}

interface AppActions {
  login: (user: UserProfile) => void;
  logout: () => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  setSubscription: (subscription: SubscriptionPlan | null) => void;
  setGeneratedPhotos: (urls: string[]) => void;
}

type AppStore = AppState & AppActions;

const CURRENT_USER_KEY = 'sma_current_user';

function loadInitialUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

const useAppStoreBase = create<AppStore>((set) => ({
  user: typeof window !== 'undefined' ? loadInitialUser() : null,
  subscription: null,
  generatedPhotos: [],
  login: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
    set({ user: null, subscription: null, generatedPhotos: [] });
  },
  updateProfile: (partial) =>
    set((state) => {
      if (!state.user) return state;
      const nextUser = { ...state.user, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
      }
      return { user: nextUser };
    }),
  setSubscription: (subscription) => set({ subscription }),
  setGeneratedPhotos: (urls) => set({ generatedPhotos: urls })
}));

const AppStoreContext = createContext<typeof useAppStoreBase | null>(null);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <AppStoreContext.Provider value={useAppStoreBase}>
    {children}
  </AppStoreContext.Provider>
);

export const useAppStore: typeof useAppStoreBase = ((selector?: any, equals?: any) => {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }
  // @ts-expect-error - forwarding generics
  return ctx(selector, equals);
}) as typeof useAppStoreBase;


