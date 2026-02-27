import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken, removeTokenSilently } from "../utils/authUtils";
import { JwtPayload } from "jwt-decode";
import {
  API_CONFIG,
  API_ENDPOINTS,
  getHeaders,
  API_ERRORS,
} from "../config/api.config";
import { jwtDecode } from "jwt-decode";
interface DecodedToken extends JwtPayload {
  id: string;
  email: string;
  role?: string;
  // add other claims your backend includes
}
export type UserRole = "guest" | "host";
export type viewMode = "host" | "guest";

export interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  role?: UserRole; // account capability (backend truth)
  viewMode?: UserRole; // current active UI mode
  avatar?: string;
}
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  switchRole: (role: UserRole) => void;

  // ✅ NEW: Manual auth setter for external auth flows (like modals)
  setAuthData: (user: User, token: string) => void;
  getProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      error: null,

      // ✅ LOGIN
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const res = await fetch(API_CONFIG.BASE_URL + API_ENDPOINTS.LOGIN, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || API_ERRORS.UNAUTHORIZED);
          }

          const decoded: any = jwtDecode(data.token);

          set({
            token: data.token,
            user: {
              id: String(decoded.id),
              email: decoded.email,
              role: decoded.role,
              viewMode: decoded.role === "host" ? "host" : "guest",
            },
            isAuthenticated: true,
            isLoading: false,
          });

          console.log("✅ Login stored in Zustand");
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message,
          });
        }
      },

      // ✅ SIGNUP
      signup: async (name, email, password) => {
        try {
          set({ isLoading: true, error: null });

          const res = await fetch(API_CONFIG.BASE_URL + API_ENDPOINTS.SIGNUP, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ name, email, password }),
          });

          const text = await res.text();

          let data;
          try {
            data = JSON.parse(text);
          } catch {
            throw new Error(API_ERRORS.SERVER_ERROR);
          }

          if (!res.ok) {
            throw new Error(data.message || API_ERRORS.VALIDATION_ERROR);
          }

          set({
            user: {
              ...data.user,
              viewMode: data.user.role === "host" ? "host" : "guest",
            },
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err: any) {
          set({
            isLoading: false,
            error: err.message || API_ERRORS.NETWORK_ERROR,
          });
        }
      },

      // ✅ LOGOUT
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },
      getProfile: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch(API_CONFIG.BASE_URL + "/users/profile", {
            method: "GET",
            headers: getHeaders(token),
          });

          const data = await res.json();

          console.log("🟢 [AUTH STORE] Profile fetched:", data);

          if (!res.ok) {
            throw new Error(data.message || API_ERRORS.SERVER_ERROR);
          }

          const u = data.user;

          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  name: `${u.first_name} ${u.last_name}`,
                  email: u.email,
                  phone: u.phone,
                  avatar: u.profile_pic,
                  role: u.role,
                }
              : null,
          }));
        } catch (err: any) {
          console.error("Failed to fetch profile:", err);
        }
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      switchRole: (mode) =>
        set((state) => ({
          user: state.user ? { ...state.user, viewMode: mode } : null,
        })),

      // ✅ NEW: Manual setter for auth data (used by AuthModal)
      setAuthData: (user, token) => {
        console.log("📝 [AUTH STORE] Setting auth data manually");
        console.log("📝 [AUTH STORE] User:", user);
        console.log("📝 [AUTH STORE] Token:", token.substring(0, 20) + "...");

        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        console.log("✅ [AUTH STORE] Auth data set successfully");
      },
      checkAndClearExpiredToken: async () => {
        const { token, isExpired } = await getToken();

        if (isExpired && get().token) {
          // Was logged in, now expired
          removeTokenSilently();
          set({
            token: null,
            user: null,
            isAuthenticated: false,
            error: "Session expired. Please log in again.",
          });
          return true;
        }

        if (token && !get().token) {
          // Token exists in storage but not in state → hydrate
          const decoded = jwtDecode<DecodedToken>(token);

          set({
            token,
            user: {
              id: decoded.id,
              email: decoded.email,
              role: decoded.role as UserRole | undefined,
              viewMode: decoded.role === "host" ? "host" : "guest",
            },
            isAuthenticated: true,
          });
        }

        return false;
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),

      // ✅ hydration fix
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;

          // auto-auth if token exists
          if (state.token) {
            state.isAuthenticated = true;
          }

          console.log("✅ Auth hydrated:", state.token ? "logged in" : "guest");
        }
      },
    },
  ),
);
