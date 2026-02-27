// Search Request Types
export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface SearchCarsRequest {
  pickup_location: LocationCoordinates;
  pickup_datetime: string; // ISO string
  dropoff_datetime: string; // ISO string
  pickupAddress?: string;
}

// Car Types
export interface CarLocation {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

export interface CarCapabilities {
  ac?: boolean;
  bluetooth?: boolean;
  gps?: boolean;
  child_seat?: boolean;
  sunroof?: boolean;
  [key: string]: any;
}

export interface Car {
  id: string;
  make: string | null;
  model: string | null;
  year: number;
  price_per_hour: number;
  pickup_location: CarLocation;
  capabilities: CarCapabilities;
  photos: string[];
}

export interface SearchCarsResponse {
  cars: Car[];
}

// Error Response
export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}

// Booking Types (for future)
export interface CreateBookingRequest {
  car_id: string;
  pickup_datetime: string;
  dropoff_datetime: string;
  pickup_location: LocationCoordinates;
  dropoff_location?: LocationCoordinates;
}

export interface Booking {
  id: string;
  car_id: string;
  user_id: string;
  booking_type: string;
  status: string;
  start_datetime: string;
  end_datetime: string;
  total_amount: number;
  createdAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}
