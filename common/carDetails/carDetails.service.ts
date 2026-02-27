import { API_CONFIG, API_ENDPOINTS, API_ERRORS } from "../../config/api.config"; // adjust path if needed
import axios from "axios";
/**
 * Service for fetching car details publicly (no authentication required)
 */
class CarDetailsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Fetch details of a single car by its ID
   * - No token / Authorization header is sent
   * - Uses only basic public headers
   */
  async getCarDetails(carId: number | string): Promise<any> {
    try {
      const url = `${this.baseUrl}${API_ENDPOINTS.GET_CAR_DETAILS}`;

      const response = await axios.post(
        url,
        { car_id: carId }, // ← body as your backend expects
        {
          timeout: API_CONFIG.TIMEOUT || 15000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      console.log(
        "🟢 [carDetailsService] getCarDetails response:",
        response.data,
      );
      return response.data;
    } catch (error: any) {
      console.error("[carDetailsService] getCarDetails error:", error);

      // Handle axios-specific errors
      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          throw new Error(API_ERRORS.TIMEOUT_ERROR || "Request timed out");
        }

        if (!error.response) {
          throw new Error(
            API_ERRORS.NETWORK_ERROR || "Network error – check your connection",
          );
        }

        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to fetch car details";

        throw new Error(errorMessage);
      }

      throw new Error(error.message || API_ERRORS.SERVER_ERROR);
    }
  }
}

// Export singleton instance
export const carDetailsService = new CarDetailsService();
