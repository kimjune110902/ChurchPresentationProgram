import { create } from 'zustand';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  login: (user: UserProfile) => void;
  logout: () => void;
}

interface PresentationState {
  activeSlideId: string | null;
  slides: any[];
  isLive: boolean;
  setActiveSlide: (id: string | null) => void;
  setLive: (status: boolean) => void;
}

interface UiState {
  sidebarOpen: boolean;
  proMode: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleProMode: () => void;
  toggleDarkMode: () => void;
}

interface AppState {
  auth: AuthState;
  presentation: PresentationState;
  ui: UiState;
}

export const useAppStore = create<AppState>((set) => ({
  auth: {
    isAuthenticated: false,
    user: null,
    login: (user) => set((state) => ({ auth: { ...state.auth, isAuthenticated: true, user } })),
    logout: () => set((state) => ({ auth: { ...state.auth, isAuthenticated: false, user: null } })),
  },
  presentation: {
    activeSlideId: null,
    slides: [],
    isLive: false,
    setActiveSlide: (id) => set((state) => ({ presentation: { ...state.presentation, activeSlideId: id } })),
    setLive: (status) => set((state) => ({ presentation: { ...state.presentation, isLive: status } })),
  },
  ui: {
    sidebarOpen: true,
    proMode: true,
    darkMode: true,
    toggleSidebar: () => set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } })),
    toggleProMode: () => set((state) => ({ ui: { ...state.ui, proMode: !state.ui.proMode } })),
    toggleDarkMode: () => set((state) => ({ ui: { ...state.ui, darkMode: !state.ui.darkMode } })),
  },
}));
