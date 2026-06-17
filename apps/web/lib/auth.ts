'use client';

import { useEffect, useState } from 'react';
import { api, setToken, clearToken } from './api';

export interface CurrentUser {
  userId: string;
  companyId: string;
  role: string;
  email: string;
  isPlatformAdmin: boolean;
}

export async function loginRequest(email: string, password: string) {
  const result = await api.post<{ accessToken: string; user: any }>('/auth/login', {
    email,
    password,
  });
  setToken(result.accessToken);
  return result.user;
}

export function logout() {
  clearToken();
  window.location.href = '/login';
}

/** Hook simples para telas client-side que precisam saber quem está logado. */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<CurrentUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
