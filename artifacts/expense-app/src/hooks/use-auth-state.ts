import { create } from "zustand";
import { UserWithCompany } from "@workspace/api-client-react";

interface AuthState {
  user: UserWithCompany | null;
  isAuthenticated: boolean;
  setUser: (user: UserWithCompany | null) => void;
  login: (token: string, user: UserWithCompany) => void;
  logout: () => void;
}

export const useAuthState = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("auth_token"),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: (token, user) => {
    localStorage.setItem("auth_token", token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, isAuthenticated: false });
    window.location.href = "/login";
  },
}));
