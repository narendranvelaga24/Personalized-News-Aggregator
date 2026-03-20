"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") {
      return {
        token: null,
        userId: null,
        email: null,
        isAuthed: false,
        isLoading: false,
      };
    }

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");

    if (token && userId) {
      return { token, userId, email, isAuthed: true, isLoading: false };
    }

    return {
      token: null,
      userId: null,
      email: null,
      isAuthed: false,
      isLoading: false,
    };
  });

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
