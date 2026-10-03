import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { container } from '../../di/container';
import type { User } from '../../domain/entities/User';

interface AuthState {
  user: User | null;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  const persist = (token: string, u: User) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const register = useCallback(async (username: string, email: string, password: string) => {
    const r = await container.authenticate.register(username, email, password);
    persist(r.accessToken, r.user);
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    const r = await container.authenticate.login(usernameOrEmail, password);
    persist(r.accessToken, r.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, register, login, logout }),
    [user, register, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}