import { Photo, User } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const requestJson = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || '请求失败');
  }

  return response.json() as Promise<T>;
};

const requestForm = async <T>(path: string, formData: FormData): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.message || '请求失败');
  }

  return response.json() as Promise<T>;
};

export const api = {
  auth: {
    sendSms: async (phone: string): Promise<{ message: string; cooldown: number; code?: string }> => {
      return requestJson('/api/auth/sms/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
    },
    login: async (payload: { method: 'password' | 'sms'; email?: string; password?: string; phone?: string; code?: string }): Promise<User> => {
      return requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    register: async (payload: { name: string; email?: string; password?: string; phone: string; code: string }): Promise<User> => {
      return requestJson('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    logout: async () => {
      await requestJson('/api/auth/logout', { method: 'POST' });
    },
  },
  photos: {
    list: async (page = 1, limit = 24): Promise<Photo[]> => {
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      return requestJson(`/api/photos?${query.toString()}`);
    },
    upload: async (payload: FormData): Promise<Photo> => {
      return requestForm('/api/photos/upload', payload);
    },
    like: async (id: string): Promise<{ likes: number }> => {
      return requestJson(`/api/photos/${id}/like`, {
        method: 'POST',
      });
    },
  },
  user: {
    getProfile: async (id: string): Promise<User> => {
      return requestJson(`/api/user/${id}`);
    },
  },
};
