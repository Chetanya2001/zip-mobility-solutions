import { create } from "zustand";
import { API_CONFIG, API_ENDPOINTS, getHeaders } from "../../config/api.config";
interface BookingState {
  // Selected car for booking
  selectedCar: any | null;

  // Booking details from search
  pickupLocation: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  } | null;
  pickupDateTime: Date | null;
  dropoffDateTime: Date | null;

  // Booking options
  insureTrip: boolean;
  differentDropLocation: boolean;
  dropoffLocation: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
  } | null;

  // Pricing breakdown
  carCharges: number;
  insuranceCharges: number;
  pickDropCharges: number;
  gst: number;
  totalCost: number;

  // Actions
  setSelectedCar: (car: any) => void;
  setBookingDetails: (details: {
    pickupLocation?: any;
    pickupDateTime?: Date;
    dropoffDateTime?: Date;
  }) => void;
  setInsureTrip: (insure: boolean) => void;
  setDifferentDropLocation: (different: boolean) => void;
  setDropoffLocation: (location: any) => void;
  calculatePricing: () => void;
  resetBooking: () => void;
  createBooking: (token: string) => Promise<any>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedCar: null,
  pickupLocation: null,
  pickupDateTime: null,
  dropoffDateTime: null,
  insureTrip: false,
  differentDropLocation: false,
  dropoffLocation: null,
  carCharges: 0,
  insuranceCharges: 0,
  pickDropCharges: 0,
  gst: 0,
  totalCost: 0,

  setSelectedCar: (car) => {
    set({ selectedCar: car });
    // Recalculate pricing when car changes
    setTimeout(() => get().calculatePricing(), 0);
  },

  setBookingDetails: (details) => {
    set({
      pickupLocation: details.pickupLocation || get().pickupLocation,
      pickupDateTime: details.pickupDateTime || get().pickupDateTime,
      dropoffDateTime: details.dropoffDateTime || get().dropoffDateTime,
    });
    // Recalculate pricing when details change
    setTimeout(() => get().calculatePricing(), 0);
  },

  setInsureTrip: (insure) => {
    set({ insureTrip: insure });
    // Recalculate pricing when insurance changes
    setTimeout(() => get().calculatePricing(), 0);
  },

  setDifferentDropLocation: (different) => {
    set({ differentDropLocation: different });
    // Recalculate pricing when drop location option changes
    setTimeout(() => get().calculatePricing(), 0);
  },

  setDropoffLocation: (location) => {
    set({ dropoffLocation: location });
    // Recalculate pricing when drop location changes
    setTimeout(() => get().calculatePricing(), 0);
  },

  calculatePricing: () => {
    const state = get();
    const {
      selectedCar,
      pickupDateTime,
      dropoffDateTime,
      insureTrip,
      differentDropLocation,
    } = state;

    if (!selectedCar || !pickupDateTime || !dropoffDateTime) {
      console.log("⚠️ Cannot calculate pricing: missing data");
      return;
    }

    // Calculate rental duration in hours
    const durationMs = dropoffDateTime.getTime() - pickupDateTime.getTime();
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    console.log("💰 Calculating pricing:", {
      carPricePerHour: selectedCar.price_per_hour,
      durationHours,
    });

    // Base car charges
    const carCharges = (selectedCar.price_per_hour || 0) * durationHours;

    // Insurance charges (10% of car charges if opted)
    const insuranceCharges = insureTrip ? Math.round(carCharges * 0.1) : 0;

    // Pick & drop charges (flat fee if different location)
    const pickDropCharges = differentDropLocation ? 500 : 0;

    // Subtotal before GST
    const subtotal = carCharges + insuranceCharges + pickDropCharges;

    // GST (18% on subtotal)
    const gst = Math.round(subtotal * 0.18);

    // Total cost
    const totalCost = subtotal + gst;

    console.log("💰 Pricing breakdown:", {
      carCharges,
      insuranceCharges,
      pickDropCharges,
      gst,
      totalCost,
    });

    set({
      carCharges,
      insuranceCharges,
      pickDropCharges,
      gst,
      totalCost,
    });
  },

  resetBooking: () => {
    set({
      selectedCar: null,
      pickupLocation: null,
      pickupDateTime: null,
      dropoffDateTime: null,
      insureTrip: false,
      differentDropLocation: false,
      dropoffLocation: null,
      carCharges: 0,
      insuranceCharges: 0,
      pickDropCharges: 0,
      gst: 0,
      totalCost: 0,
    });
  },
  createBooking: async (token: string) => {
    const state = get();

    if (!token) throw new Error("No auth token");

    if (
      !state.selectedCar ||
      !state.pickupLocation ||
      !state.pickupDateTime ||
      !state.dropoffDateTime
    ) {
      throw new Error("Missing booking data");
    }

    const payload = {
      car_id: state.selectedCar.id,

      start_datetime: state.pickupDateTime.toISOString(),
      end_datetime: state.dropoffDateTime.toISOString(),

      pickup_address: state.pickupLocation.address,
      pickup_lat: state.pickupLocation.latitude,
      pickup_long: state.pickupLocation.longitude,

      // same as pickup (as you instructed)
      drop_address: state.pickupLocation.address,
      drop_lat: state.pickupLocation.latitude,
      drop_long: state.pickupLocation.longitude,

      insure_amount: state.insuranceCharges,
      driver_amount: 0,
      drop_charge: state.pickDropCharges,
    };

    console.log("🚗 Booking payload:", payload);

    const res = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.SELF_DRIVE_BOOKINGS}`, {
      method: "POST",
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Booking failed");
    }

    console.log("✅ Booking success:", data);

    // optional auto reset after success
    get().resetBooking();

    return data;
  },
}));
