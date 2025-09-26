import type { User } from './api';

export const AuthStorage = {
  setToken: (token: string) => {
    localStorage.setItem('token', token);
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  removeToken: () => {
    localStorage.removeItem('token');
  },

  setUser: (user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser: () => {
    localStorage.removeItem('user');
  },

  isAuthenticated: (): boolean => {
    return !!AuthStorage.getToken();
  },

  logout: () => {
    AuthStorage.removeToken();
    AuthStorage.removeUser();
  }
};
