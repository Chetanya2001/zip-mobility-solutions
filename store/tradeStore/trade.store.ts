import { create } from "zustand";
import { API_CONFIG, getHeaders } from "../../config/api.config";
import { useAuthStore } from "../auth.store";

const BASE = API_CONFIG.BASE_URL + "/trade";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type TradeListing = {
  id: number;
  car_id: number;
  seller_id: number;
  asking_price: number;
  city: string;
  description: string | null;
  status: "active" | "sold" | "inactive";
  createdAt: string;
  updatedAt: string;
};

export type TradeRequest = {
  id: number;
  buyer_id: number;
  city: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/** Payload sent from SellCarScreen to createListing */
export type CreateListingPayload = {
  car_id: string | number;
  kms_driven: number;
  expected_price: number; // → backend maps to asking_price
  fuel_type?: string | null;
  color?: string | null;
  owner?: string | null;
  city: string;
  notes?: string | null; // → backend maps to description
  photos?: string[];
};

type TradeStore = {
  myRequests: TradeRequest[];
  myListings: TradeListing[];
  offers: unknown[];
  deals: unknown[];
  isLoading: boolean;
  error: string | null;

  createRequest: (formData: Record<string, unknown>) => Promise<TradeRequest>;
  createListing: (formData: CreateListingPayload) => Promise<TradeListing>;
  fetchMyListings: () => Promise<void>;
  makeOffer: (payload: Record<string, unknown>) => Promise<unknown>;
  acceptOffer: (offerId: number) => Promise<unknown>;
  clearError: () => void;

  _setLoading: (v: boolean) => void;
  _setError: (e: unknown) => void;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const authHeaders = (): HeadersInit => {
  const token = useAuthStore.getState().token ?? undefined;
  return getHeaders(token);
};

/**
 * Parse the backend's { success, message, data } envelope.
 * Falls back gracefully if the backend returns a flat object (old shape).
 */
const handleRes = async <T = unknown>(res: Response): Promise<T> => {
  const json = await res.json();

  if (!res.ok) {
    // Backend sends { success: false, error: "..." }
    throw new Error(json?.error ?? json?.message ?? "Request failed");
  }

  // New backend shape: { success: true, data: {...} }
  // Flat fallback: the object itself is the data
  return (json?.data ?? json) as T;
};

// ─── Store ─────────────────────────────────────────────────────────────────────

export const useTradeStore = create<TradeStore>((set, get) => ({
  // ── state ──────────────────────────────────────────────────────────────────
  myRequests: [],
  myListings: [],
  offers: [],
  deals: [],
  isLoading: false,
  error: null,

  _setLoading: (v: boolean) => set({ isLoading: v, error: null }),

  _setError: (e: unknown) =>
    set({
      isLoading: false,
      error: e instanceof Error ? e.message : "Something went wrong",
    }),

  // ── createRequest ──────────────────────────────────────────────────────────

  createRequest: async (formData) => {
    get()._setLoading(true);
    try {
      const res = await fetch(`${BASE}/request`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await handleRes<TradeRequest>(res);
      set((s) => ({ myRequests: [data, ...s.myRequests], isLoading: false }));
      return data;
    } catch (e: unknown) {
      get()._setError(e);
      throw e;
    }
  },

  // ── createListing ──────────────────────────────────────────────────────────
  /**
   * Sends CreateListingPayload to POST /trade/listing.
   *
   * Backend maps:
   *   expected_price  →  asking_price
   *   notes           →  description
   *   kms_driven      →  also updates Car.kms_driven
   */
  createListing: async (formData) => {
    get()._setLoading(true);
    try {
      const res = await fetch(`${BASE}/listing`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(formData),
      });

      const data = await handleRes<TradeListing>(res);
      set((s) => ({ myListings: [data, ...s.myListings], isLoading: false }));
      return data;
    } catch (e: unknown) {
      get()._setError(e);
      throw e;
    }
  },

  // ── fetchMyListings ────────────────────────────────────────────────────────

  fetchMyListings: async () => {
    get()._setLoading(true);
    try {
      const res = await fetch(`${BASE}/listing/my`, {
        method: "GET",
        headers: authHeaders(),
      });

      const data = await handleRes<TradeListing[]>(res);
      set({ myListings: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e: unknown) {
      get()._setError(e);
    }
  },

  // ── makeOffer ──────────────────────────────────────────────────────────────

  makeOffer: async (payload) => {
    get()._setLoading(true);
    try {
      const res = await fetch(`${BASE}/offer`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await handleRes(res);
      set((s) => ({ offers: [data, ...s.offers], isLoading: false }));
      return data;
    } catch (e: unknown) {
      get()._setError(e);
      throw e;
    }
  },

  // ── acceptOffer ────────────────────────────────────────────────────────────

  acceptOffer: async (offerId) => {
    get()._setLoading(true);
    try {
      const res = await fetch(`${BASE}/offer/${offerId}/accept`, {
        method: "POST",
        headers: authHeaders(),
      });

      const data = await handleRes(res);
      set((s) => ({ deals: [data, ...s.deals], isLoading: false }));
      return data;
    } catch (e: unknown) {
      get()._setError(e);
      throw e;
    }
  },

  clearError: () => set({ error: null }),
}));
