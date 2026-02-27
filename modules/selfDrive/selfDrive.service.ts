import {
  API_CONFIG,
  API_ENDPOINTS,
  getHeaders,
  API_ERRORS,
} from "../../config/api.config";
import type {
  SearchCarsRequest,
  SearchCarsResponse,
  ApiError,
} from "../../config/api.types";

class SelfDriveApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Search for available cars based on location and datetime
   */
  async searchCars(params: SearchCarsRequest): Promise<SearchCarsResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        API_CONFIG.TIMEOUT,
      );

      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.SEARCH_CARS}`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(params),
          signal: controller.signal,
        },
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          message: API_ERRORS.SERVER_ERROR,
        }));
        throw new Error(errorData.message || API_ERRORS.SERVER_ERROR);
      }

      const data: SearchCarsResponse = await response.json();
      console.log("🟢 [API] searchCars response:", data);
      return data;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error(API_ERRORS.TIMEOUT_ERROR);
      }

      if (error.message === "Network request failed") {
        throw new Error(API_ERRORS.NETWORK_ERROR);
      }

      throw error;
    }
  }

  /**
   * Get car details by ID (for future implementation)
   */
  async getCarDetails(carId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.GET_CAR_DETAILS.replace(":id", carId)}`,
        {
          method: "GET",
          headers: getHeaders(),
        },
      );

      if (!response.ok) {
        throw new Error(API_ERRORS.NOT_FOUND);
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || API_ERRORS.SERVER_ERROR);
    }
  }
}

// Export singleton instance
export const selfDriveApi = new SelfDriveApiService();
