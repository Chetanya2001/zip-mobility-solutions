// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://zipdrive.in/api",
  TIMEOUT: 30000,
};

// API Endpoints
export const API_ENDPOINTS = {
  SEARCH_CARS: "/cars/search",
  SEARCH_INTERCITY_CARS: "/cars/search-intercity",

  GET_CAR_DETAILS: "/car-details/getCarDetails",
  CREATE_BOOKING: "/bookings/create",
  GET_BOOKINGS: "/bookings/user",
  SELF_DRIVE_BOOKINGS: "/self-drive-bookings/book",
  INTERCITY_CAR_BOOK: "/intercity-bookings/book",
  GET_GUEST_BOOKINGS: "/bookings/guest/bookings",
  GET_HOST_BOOKINGS: "/bookings/host/bookings",
  HOST_MY_CARS: "/cars/my-host-cars",
  GET_SERVICE_CHECKLIST: "/service",

  LOGIN: "/users/login",
  SIGNUP: "/users/register",
  LOGOUT: "/auth/logout",
};

// Headers helper
export const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// Standard errors
export const API_ERRORS = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  TIMEOUT_ERROR: "Request timeout. Please try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  VALIDATION_ERROR: "Invalid data provided.",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "Please login to continue.",
};
