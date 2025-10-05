import type { User } from './api';

// SSR対応: localStorageが利用可能かチェック
const isClient = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export const AuthStorage = {
  setToken: (token: string) => {
    if (isClient) {
      localStorage.setItem('token', token);
    }
  },

  getToken: (): string | null => {
    if (!isClient) return null;
    return localStorage.getItem('token');
  },

  removeToken: () => {
    if (isClient) {
      localStorage.removeItem('token');
    }
  },

  setUser: (user: User) => {
    if (isClient) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  getUser: (): User | null => {
    if (!isClient) return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser: () => {
    if (isClient) {
      localStorage.removeItem('user');
    }
  },

  isAuthenticated: (): boolean => {
    if (!isClient) return false;
    return !!AuthStorage.getToken();
  },

  logout: () => {
    AuthStorage.removeToken();
    AuthStorage.removeUser();
  }
};
