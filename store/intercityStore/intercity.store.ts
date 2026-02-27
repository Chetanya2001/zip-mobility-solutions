import { create } from "zustand";
import { API_CONFIG, API_ENDPOINTS, getHeaders } from "../../config/api.config";
import { useAuthStore } from "../auth.store";

export interface IntercitySearchFilters {
  pickupCity: string | null;
  pickupStation: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  pickupDate: string | null;
  pickupTime: string | null;
  dropAddress: string | null;
  dropCity: string | null;
  dropLat: number | null;
  dropLng: number | null;
  pax: number;
  luggage: number;
  // ✅ NEW — set by getRoadDistance in intercitySearchModal
  tripDistanceKm: number;
  durationMin: number;
}

interface IntercityState {
  searchFilters: IntercitySearchFilters;
  cars: any[];
  isSearching: boolean;
  searchError: string | null;
  hasSearched: boolean;
  isSearchModalOpen: boolean;

  setSearchFilters: (filters: Partial<IntercitySearchFilters>) => void;
  searchCars: (filters: Partial<IntercitySearchFilters>) => Promise<void>;
  resetSearch: () => void;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

const defaultFilters: IntercitySearchFilters = {
  pickupCity: null,
  pickupStation: null,
  pickupLat: null,
  pickupLng: null,
  pickupDate: null,
  pickupTime: null,
  dropAddress: null,
  dropCity: null,
  dropLat: null,
  dropLng: null,
  pax: 1,
  luggage: 0,
  // ✅ NEW defaults
  tripDistanceKm: 0,
  durationMin: 0,
};

export const useIntercityStore = create<IntercityState>((set, get) => ({
  searchFilters: defaultFilters,
  cars: [],
  isSearching: false,
  searchError: null,
  hasSearched: false,
  isSearchModalOpen: false,

  setSearchFilters: (filters) => {
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    }));
  },

  searchCars: async (filters) => {
    const merged = { ...get().searchFilters, ...filters };

    console.log("🔍 [INTERCITY] Starting search with filters:", merged);

    if (
      merged.pickupLat == null ||
      merged.pickupLng == null ||
      !merged.pickupCity ||
      merged.dropLat == null ||
      merged.dropLng == null ||
      !merged.dropCity ||
      !merged.pickupDate ||
      !merged.pickupTime
    ) {
      set({
        searchError: "Missing required search fields",
        isSearching: false,
      });
      return;
    }

    set({ isSearching: true, searchError: null });

    try {
      const { token } = useAuthStore.getState();

      const pickup_datetime = new Date(
        `${merged.pickupDate}T${merged.pickupTime}`,
      ).toISOString();

      const payload = {
        pickup_location: {
          address: merged.pickupStation ?? "",
          city: merged.pickupCity,
          latitude: Number(merged.pickupLat),
          longitude: Number(merged.pickupLng),
        },
        drop_location: {
          address: merged.dropAddress ?? "",
          city: merged.dropCity,
          latitude: Number(merged.dropLat),
          longitude: Number(merged.dropLng),
        },
        pickup_datetime,
        pax: Number(merged.pax),
        luggage: Number(merged.luggage),
      };

      console.log("📤 [INTERCITY] Payload:", payload);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.SEARCH_INTERCITY_CARS}`,
        {
          method: "POST",
          headers: getHeaders(token ?? undefined),
          body: JSON.stringify(payload),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to search intercity cars");
      }

      console.log(
        "✅ [INTERCITY] Search successful:",
        data.cars?.length,
        "cars found",
      );

      set({
        cars: data.cars || [],
        isSearching: false,
        hasSearched: true,
        searchError: null,
        // ✅ Persist the full merged filters (includes tripDistanceKm + durationMin
        //    that were set by setSearchFilters before searchCars was called)
        searchFilters: merged,
      });
    } catch (error: any) {
      console.error("❌ [INTERCITY] Search failed:", error);

      set({
        cars: [],
        isSearching: false,
        searchError: error.message || "Failed to search cars",
        hasSearched: true,
      });
    }
  },

  resetSearch: () => {
    set({
      cars: [],
      searchError: null,
      hasSearched: false,
      searchFilters: defaultFilters,
    });
  },

  openSearchModal: () => {
    console.log("📂 [INTERCITY] Opening search modal");
    set({ isSearchModalOpen: true });
  },

  closeSearchModal: () => {
    console.log("📂 [INTERCITY] Closing search modal");
    set({ isSearchModalOpen: false });
  },
}));
