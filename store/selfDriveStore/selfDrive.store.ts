import { create } from "zustand";
import { selfDriveApi } from "../../modules/selfDrive/selfDrive.service";
import { Car, Location, SearchCarsRequest } from "../../config/api.types";

interface SearchFilters {
  pickupLocation: Location | null;
  pickupDateTime: Date | null;
  dropoffDateTime: Date | null;
  pickupAddress?: string; // ← added (optional) to match UI usage
}

interface SelfDriveState {
  cars: Car[];
  isSearching: boolean; // we'll use this consistently
  searchError: string | null;
  searchFilters: SearchFilters;
  hasSearched: boolean;
  selectedCar: Car | null;

  searchCars: (filters: SearchFilters) => Promise<void>;
  clearSearch: () => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  selectCar: (car: Car) => void;
  clearSelectedCar: () => void;
  isLoading: boolean; // for future use (e.g., booking)
  isSearchModalOpen: boolean;
  openSearchModal: () => void;
  closeSearchModal: () => void;
}

export const useSelfDriveStore = create<SelfDriveState>((set) => ({
  cars: [],
  isSearching: false,
  searchError: null,
  searchFilters: {
    pickupLocation: null,
    pickupDateTime: null,
    dropoffDateTime: null,
    pickupAddress: undefined,
  },
  hasSearched: false,
  selectedCar: null,
  isLoading: false,
  isSearchModalOpen: false,
  openSearchModal: () => {
    console.log("🟢 [STORE] Opening Search Modal");
    set({ isSearchModalOpen: true });
  },

  closeSearchModal: () => {
    console.log("🟢 [STORE] Closing Search Modal");
    set({ isSearchModalOpen: false });
  },

  searchCars: async (filters) => {
    console.log("🟢 [STORE] searchCars called");
    console.log("🟢 [STORE] Filters:", filters);
    const { pickupLocation, pickupDateTime, dropoffDateTime } = filters;

    if (!pickupLocation || !pickupDateTime || !dropoffDateTime) {
      set({ searchError: "Please fill in all search fields" });
      return;
    }

    if (pickupDateTime >= dropoffDateTime) {
      set({ searchError: "Drop-off time must be after pickup time" });
      return;
    }

    set({ isSearching: true, searchError: null, hasSearched: true });

    try {
      const searchParams: SearchCarsRequest = {
        pickup_location: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
          address: pickupLocation.address,
          city: pickupLocation.city,
        },
        pickup_datetime: pickupDateTime.toISOString(),
        dropoff_datetime: dropoffDateTime.toISOString(),
      };

      const apiResponse = await selfDriveApi.searchCars(searchParams);

      // Adjust this line based on your actual response shape
      // Look at console.log below to see the structure
      const receivedCars =
        apiResponse?.cars ?? apiResponse?.cars ?? apiResponse ?? [];

      console.log("🟢 [STORE] Received cars:", receivedCars);

      set({
        cars: receivedCars,
        isSearching: false,
        searchFilters: {
          ...filters,
          pickupAddress: filters.pickupAddress ?? undefined,
        },
        searchError: null,
      });
    } catch (error: any) {
      console.error("Search error:", error);
      set({
        cars: [],
        isSearching: false,
        searchError: error.message || "Failed to search cars",
      });
    }
  },

  clearSearch: () => {
    set({
      cars: [],
      searchError: null,
      hasSearched: false,
      searchFilters: {
        pickupLocation: null,
        pickupDateTime: null,
        dropoffDateTime: null,
        pickupAddress: undefined,
      },
    });
  },

  setSearchFilters: (filters) => {
    set((state) => ({
      searchFilters: { ...state.searchFilters, ...filters },
    }));
  },

  selectCar: (car) => set({ selectedCar: car }),
  clearSelectedCar: () => set({ selectedCar: null }),
}));
