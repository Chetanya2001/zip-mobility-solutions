// utils/locationIQ.ts
import * as Location from "expo-location";

const LOCATIONIQ_TOKEN = "pk.4b638ab501e6474bf3f369d1f8e0398b";

export const getCarLocation = async () => {
  try {
    // 1. Request permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") throw new Error("Location permission denied");

    // 2. Get current GPS
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    // 3. Reverse geocode with LocationIQ
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_TOKEN}&lat=${latitude}&lon=${longitude}&format=json&countrycodes=IN`,
    );
    const data = await response.json();

    return {
      latitude,
      longitude,
      address: data.display_name || data.address?.road || "Unknown location",
      city: data.address?.city || data.address?.town || data.address?.state,
    };
  } catch (error) {
    console.error("Location error:", error);
    return null;
  }
};

export const searchLocations = async (query: string) => {
  const LOCATIONIQ_TOKEN = "pk.4b638ab501e6474bf3f369d1f8e0398b"; // Same as web

  try {
    if (query.length < 3) return [];

    const response = await fetch(
      `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(
        query,
      )}&limit=5&format=json`,
    );

    const results = await response.json();
    return results; // Array of { display_name, lat, lon, address }
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};
