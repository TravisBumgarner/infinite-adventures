import { createContext, useContext, type ReactNode } from "react";
import type { AuthUser } from "./service.js";

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Stub: will be implemented in ralph-code phase
  return <>{children}</>;
}
