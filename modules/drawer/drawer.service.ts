import {
  API_CONFIG,
  API_ENDPOINTS,
  getHeaders,
  API_ERRORS,
} from "../../config/api.config";
import { useAuthStore } from "../../store/auth.store";

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

class DrawerService {
  private baseUrl = API_CONFIG.BASE_URL;

  /**
   * Auto reads token from Zustand
   */
  private getToken(): string {
    const token = useAuthStore.getState().token;

    if (!token) {
      throw new ApiError(API_ERRORS.UNAUTHORIZED, 401);
    }

    return token;
  }

  async getMyPayments() {
    try {
      const token = this.getToken();

      const response = await fetch(
        `${this.baseUrl}/payments/payments/mypayments`, // ← your endpoint
        {
          method: "GET",
          headers: getHeaders(token),
        },
      );

      const text = await response.text();
      let data: any;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError(API_ERRORS.SERVER_ERROR, response.status);
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || API_ERRORS.SERVER_ERROR,
          response.status,
        );
      }

      return data; // { success, count, data: [...] }
    } catch (error: any) {
      console.error("❌ DrawerService.getMyPayments:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(API_ERRORS.NETWORK_ERROR);
    }
  }

  /**
   * Get guest bookings
   */
  async getGuestBookings() {
    try {
      const token = this.getToken();

      const response = await fetch(
        this.baseUrl + API_ENDPOINTS.GET_GUEST_BOOKINGS,
        {
          method: "GET",
          headers: getHeaders(token),
        },
      );

      const text = await response.text();

      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError(API_ERRORS.SERVER_ERROR, response.status);
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || API_ERRORS.SERVER_ERROR,
          response.status,
        );
      }

      return data;
    } catch (error: any) {
      console.error("❌ DrawerService.getGuestBookings:", error);

      if (error instanceof ApiError) throw error;

      throw new ApiError(API_ERRORS.NETWORK_ERROR);
    }
  }
  async getHostBooking() {
    try {
      const token = this.getToken();
      const response = await fetch(
        this.baseUrl + API_ENDPOINTS.GET_HOST_BOOKINGS,
        {
          method: "GET",
          headers: getHeaders(token),
        },
      );
      const text = await response.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new ApiError(API_ERRORS.SERVER_ERROR, response.status);
      }

      if (!response.ok) {
        throw new ApiError(
          data?.message || API_ERRORS.SERVER_ERROR,
          response.status,
        );
      }

      return data;
    } catch (error: any) {
      console.error("❌ DrawerService.getGuestBookings:", error);

      if (error instanceof ApiError) throw error;

      throw new ApiError(API_ERRORS.NETWORK_ERROR);
    }
  }
}

export const drawerService = new DrawerService();
