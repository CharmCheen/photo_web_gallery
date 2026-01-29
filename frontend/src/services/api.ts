import { Photo, PhotosResponse, User, TagsResponse, LikesResponse, LikeResult } from '../types';

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

export interface PhotoListParams {
  page?: number;
  limit?: number;
  authorId?: string;
  tag?: string;
  search?: string;
}

export const api = {
  auth: {
    sendCode: async (email: string, purpose: 'login' | 'register' | 'reset' = 'login'): Promise<{ message: string; cooldown: number; code?: string }> => {
      return requestJson('/api/auth/code/send', {
        method: 'POST',
        body: JSON.stringify({ email, purpose }),
      });
    },
    login: async (payload: { email: string; code: string }): Promise<User> => {
      return requestJson('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    register: async (payload: { name: string; email: string; code: string; password?: string }): Promise<User> => {
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
    list: async (params: PhotoListParams = {}): Promise<PhotosResponse> => {
      const { page = 1, limit = 24, authorId, tag, search } = params;
      const query = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (authorId) query.set('authorId', authorId);
      if (tag) query.set('tag', tag);
      if (search) query.set('search', search);
      return requestJson(`/api/photos?${query.toString()}`);
    },
    upload: async (payload: FormData): Promise<Photo> => {
      return requestForm('/api/photos/upload', payload);
    },
    like: async (id: string, userId: string): Promise<LikeResult> => {
      return requestJson(`/api/photos/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },
    checkLikes: async (userId: string, photoIds: string[]): Promise<LikesResponse> => {
      if (!userId || !photoIds.length) return { likes: {} };
      return requestJson(`/api/photos/likes?userId=${userId}&photoIds=${photoIds.join(',')}`);
    },
    delete: async (id: string, authorId: string): Promise<{ message: string }> => {
      return requestJson(`/api/photos/${id}?authorId=${authorId}`, {
        method: 'DELETE',
      });
    },
  },
  tags: {
    popular: async (): Promise<TagsResponse> => {
      return requestJson('/api/tags/popular');
    },
  },
  user: {
    getProfile: async (id: string): Promise<User> => {
      return requestJson(`/api/user/${id}`);
    },
  },
};
