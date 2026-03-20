"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { authApi } from "./api";

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  isAuthed: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Keep initial state deterministic across SSR and first client render.
  const [state, setState] = useState<AuthState>({
    token: null,
    userId: null,
    email: null,
    isAuthed: false,
    isLoading: true,
  });

  useEffect(() => {
    const id = window.setTimeout(() => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      const email = localStorage.getItem("email");

      if (token && userId) {
        setState({ token, userId, email, isAuthed: true, isLoading: false });
        return;
      }

      setState({ token: null, userId: null, email: null, isAuthed: false, isLoading: false });
    }, 0);

    return () => window.clearTimeout(id);
  }, []);

  const setAuth = useCallback(
    (token: string, userId: string, email: string) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("email", email);
      setState({ token, userId, email, isAuthed: true, isLoading: false });
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      setAuth(res.token, res.userId, email);
    },
    [setAuth]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.register(email, password);
      setAuth(res.token, res.userId, email);
    },
    [setAuth]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    setState({ token: null, userId: null, email: null, isAuthed: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
