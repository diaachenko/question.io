import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),

  isAuthLoading: !!localStorage.getItem('token'), 

  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isAuthLoading: false });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isAuthLoading: false });
  },

  setUser: (user) => set({ user, isAuthenticated: true, isAuthLoading: false }),

  setAuthFailed: () => set({ user: null, isAuthenticated: false, isAuthLoading: false })
}));