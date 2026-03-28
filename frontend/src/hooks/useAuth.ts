import { useEffect, useState } from 'react';

type User = {
  id: string;
  email: string;
  recoveryEmail?: string | null;
  name: string;
  role?: string;
  emailVerified?: boolean;
};

type AuthResponse = {
  token?: string;
  user?: User;
  requiresVerification?: boolean;
  message?: string;
  verificationLink?: string;
};

const API_URL = '/api';

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('mc_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('mc_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem('mc_token', token);
    else localStorage.removeItem('mc_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('mc_user', JSON.stringify(user));
    else localStorage.removeItem('mc_user');
  }, [user]);

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data: AuthResponse = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data: AuthResponse = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    if (!data.token || !data.user) throw new Error('Login failed');
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateUser = (nextUser: User) => {
    setUser(nextUser);
  };

  return { token, user, login, register, logout, updateUser };
}
