import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../constants/theme";
import { carDetailsService } from "../carDetails/carDetails.service";
import { useAuthStore } from "../../store/auth.store";
import { useBookingStore } from "../../store/selfDriveStore/selfDriveBooking.store";
import { useSelfDriveStore } from "../../store/selfDriveStore/selfDrive.store";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const FEATURES = [
  { key: "airconditions", label: "Air Conditioning", icon: "❄️" },
  { key: "child_seat", label: "Child Seat", icon: "👶" },
  { key: "gps", label: "GPS Navigation", icon: "📍" },
  { key: "luggage", label: "Luggage Space", icon: "🧳" },
  { key: "music", label: "Music System", icon: "🎵" },
  { key: "seat_belt", label: "Seat Belt", icon: "🔒" },
  { key: "sleeping_bed", label: "Sleeping Bed", icon: "🛏️" },
  { key: "water", label: "Water", icon: "💧" },
  { key: "bluetooth", label: "Bluetooth", icon: "📱" },
  { key: "onboard_computer", label: "Onboard Computer", icon: "💻" },
  { key: "audio_input", label: "Audio Input", icon: "🎧" },
  { key: "long_term_trips", label: "Long Term Trips", icon: "🚗" },
  { key: "car_kit", label: "Car Kit", icon: "🧰" },
  {
    key: "remote_central_locking",
    label: "Remote Central Locking",
    icon: "🔑",
  },
  { key: "climate_control", label: "Climate Control", icon: "🌡️" },
];

export default function CarDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params as { id: number };

  const user = useAuthStore((state: any) => state.user);
  const searchFilters = useSelfDriveStore((s) => s.searchFilters);
  const { setSelectedCar, setBookingDetails } = useBookingStore();

  const [carDetails, setCarDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isHost = user?.role === "host";
  const isOwnerHost = isHost && carDetails?.host_id === user?.id;

  useEffect(() => {
    fetchCarDetails();
  }, [id]);

  const fetchCarDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await carDetailsService.getCarDetails(id);
      setCarDetails(data);
    } catch (err: any) {
      console.error("Error fetching car details:", err);
      setError(err.message || "Failed to load car details");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCarDetails();
    setRefreshing(false);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        setActiveIndex(viewableItems[0].index || 0);
      }
    },
  ).current;

  const handleBookNow = () => {
    if (!carDetails) return;

    console.log("📅 Booking car from details:", carDetails.id);

    // Set booking data
    setSelectedCar(carDetails);
    setBookingDetails({
      pickupLocation: searchFilters.pickupLocation,
      pickupDateTime: searchFilters.pickupDateTime || undefined,
      dropoffDateTime: searchFilters.dropoffDateTime || undefined,
    });

    // Navigate to booking summary
    navigation.navigate("BookingSummary" as never);
  };

  if (loading && !carDetails) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading car details...</Text>
      </View>
    );
  }

  if (error || !carDetails) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={80} color={COLORS.error} />
        <Text style={styles.errorText}>{error || "Car not found"}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCarDetails}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get photos from the car data
  const photos = carDetails.photos || [];
  const photoUrls = photos
    .map((p: any) => (typeof p === "string" ? p : p.url || p.photo_url))
    .filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Car Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: SPACING.xxxl + 80,
        }}
      >
        {/* Image Carousel */}
        {photoUrls.length > 0 ? (
          <View style={styles.carouselWrapper}>
            <FlatList
              data={photoUrls}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              keyExtractor={(item, index) => `photo-${index}`}
              renderItem={({ item }) => (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: item }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                </View>
              )}
            />
            {photoUrls.length > 1 && (
              <View style={styles.paginationContainer}>
                {photoUrls.map((_: any, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.paginationDot,
                      i === activeIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyPhoto}>
            <Ionicons
              name="car-sport-outline"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyPhotoText}>No Photos Available</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          {/* Title Section */}
          <View style={styles.headerSection}>
            <Text style={styles.carBrand}>{carDetails.make}</Text>
            <Text style={styles.title}>
              {carDetails.model} {carDetails.year}
            </Text>
          </View>

          {/* Location */}
          {carDetails.pickup_location && (
            <View style={styles.locationSection}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <Text style={styles.locationText}>
                {carDetails.pickup_location.city ||
                  carDetails.pickup_location.address ||
                  "Location not specified"}
              </Text>
            </View>
          )}

          {/* Pricing & Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Pricing & Availability</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rate</Text>
              <Text style={styles.infoValue}>
                {carDetails.price_per_hour
                  ? `₹${carDetails.price_per_hour} / hr`
                  : carDetails.price_per_km
                    ? `₹${carDetails.price_per_km} / km`
                    : "Not set"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available From</Text>
              <Text style={styles.infoValue}>
                {formatDate(carDetails.available_from)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Available Till</Text>
              <Text style={styles.infoValue}>
                {formatDate(carDetails.available_till)}
              </Text>
            </View>
          </View>

          {/* Capabilities/Specs */}
          {carDetails.capabilities && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Specifications</Text>
              {carDetails.capabilities.seats && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Seats</Text>
                  <Text style={styles.infoValue}>
                    {carDetails.capabilities.seats}
                  </Text>
                </View>
              )}
              {carDetails.capabilities.transmission && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Transmission</Text>
                  <Text style={styles.infoValue}>
                    {carDetails.capabilities.transmission}
                  </Text>
                </View>
              )}
              {carDetails.capabilities.fuelType && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fuel Type</Text>
                  <Text style={styles.infoValue}>
                    {carDetails.capabilities.fuelType}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Description */}
          {carDetails.description && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Description</Text>
              <Text style={styles.description}>{carDetails.description}</Text>
            </View>
          )}

          {/* Insurance */}
          {carDetails.insurance && (
            <View style={styles.section}>
              <Text style={styles.sectionHeading}>Insurance</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Company</Text>
                <Text style={styles.infoValue}>
                  {carDetails.insurance.company || "—"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>IDV Value</Text>
                <Text style={styles.infoValue}>
                  {carDetails.insurance.idv_value
                    ? `₹${carDetails.insurance.idv_value.toLocaleString()}`
                    : "—"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Valid Till</Text>
                <Text style={styles.infoValue}>
                  {formatDate(carDetails.insurance.valid_till)}
                </Text>
              </View>
              {carDetails.insurance.image && (
                <Image
                  source={{ uri: carDetails.insurance.image }}
                  style={styles.insuranceImage}
                  resizeMode="contain"
                />
              )}
            </View>
          )}

          {/* Features */}
          {carDetails.features &&
            Object.keys(carDetails.features).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeading}>Features</Text>
                <View style={styles.featuresGrid}>
                  {Object.entries(carDetails.features).map(([key, enabled]) => {
                    if (!enabled) return null;
                    const feature = FEATURES.find((f) => f.key === key);
                    if (!feature) return null;
                    return (
                      <View key={key} style={styles.featureCard}>
                        <Text style={styles.featureIcon}>{feature.icon}</Text>
                        <Text style={styles.featureName}>{feature.label}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
        </View>
      </ScrollView>

      {/* Book Now Button (for non-host users) */}
      {!isOwnerHost && (
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookNow}>
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Text style={styles.bookButtonPrice}>
              ₹{carDetails.price_per_hour || "—"} / hr
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorText: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  scrollView: {
    flex: 1,
  },

  carouselWrapper: {
    height: 280,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    position: "absolute",
    bottom: SPACING.lg,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  emptyPhoto: {
    height: 280,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.cardBackgroundLight,
  },
  emptyPhotoText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  contentContainer: {
    padding: SPACING.lg,
  },

  headerSection: {
    marginBottom: SPACING.lg,
  },
  carBrand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs / 2,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },

  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeading: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  insuranceImage: {
    width: "100%",
    height: 200,
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
  },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  featureCard: {
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: "center",
    minWidth: "30%",
    flexBasis: "30%",
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  featureName: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  bookButtonPrice: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
