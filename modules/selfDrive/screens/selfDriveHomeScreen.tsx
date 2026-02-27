import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useSelfDriveStore } from "../../../store/selfDriveStore/selfDrive.store";
import { useBookingStore } from "../../../store/selfDriveStore/selfDriveBooking.store";
import SearchModal from "../modals/searchModal";

export default function SelfDriveHomeScreen({ navigation }: any) {
  console.log("🏠 [HOME] Screen Rendered");

  const insets = useSafeAreaInsets();

  const cars = useSelfDriveStore((state) => state.cars ?? []);
  const isSearching = useSelfDriveStore((state) => state.isSearching);
  const searchError = useSelfDriveStore((state) => state.searchError);
  const hasSearched = useSelfDriveStore((state) => state.hasSearched);
  const searchFilters = useSelfDriveStore((s) => s.searchFilters);

  const isSearchModalOpen = useSelfDriveStore((s) => s.isSearchModalOpen);
  const openSearchModal = useSelfDriveStore((s) => s.openSearchModal);
  const closeSearchModal = useSelfDriveStore((s) => s.closeSearchModal);

  const { setSelectedCar, setBookingDetails } = useBookingStore();

  console.log("🏠 [HOME] State:", {
    carsCount: cars.length,
    cars:
      cars.length > 0
        ? `${cars.length} items (first: ${cars[0]?.make || "n/a"})`
        : "empty",
    isSearching,
    searchError,
    hasSearched,
    searchFilters: {
      hasLocation: !!searchFilters.pickupLocation,
      hasPickup: !!searchFilters.pickupDateTime,
      hasDropoff: !!searchFilters.dropoffDateTime,
    },
  });

  const handleBookNow = (car: any) => {
    console.log("📅 [BOOK] Starting booking for car:", car.id);
    console.log("📅 [BOOK] Search filters:", {
      pickupLocation: searchFilters.pickupLocation,
      pickupDateTime: searchFilters.pickupDateTime,
      dropoffDateTime: searchFilters.dropoffDateTime,
    });

    // Validate we have the required data
    if (!searchFilters.pickupLocation) {
      console.error("❌ [BOOK] No pickup location in search filters");
      Alert.alert(
        "Missing Information",
        "Please search with a pickup location first",
        [
          {
            text: "Search Now",
            onPress: () => openSearchModal(),
          },
        ],
      );
      return;
    }

    if (!searchFilters.pickupDateTime || !searchFilters.dropoffDateTime) {
      console.error("❌ [BOOK] Missing pickup/dropoff dates");
      Alert.alert(
        "Missing Dates",
        "Please select pickup and dropoff dates first",
        [
          {
            text: "Search Now",
            onPress: () => openSearchModal(),
          },
        ],
      );
      return;
    }

    // Set selected car first
    console.log("✅ [BOOK] Setting selected car:", car.id);
    setSelectedCar(car);

    // Then set booking details
    console.log("✅ [BOOK] Setting booking details");
    setBookingDetails({
      pickupLocation: searchFilters.pickupLocation,
      pickupDateTime: searchFilters.pickupDateTime,
      dropoffDateTime: searchFilters.dropoffDateTime,
    });

    console.log("✅ [BOOK] All data set, navigating to summary");
    // Navigate to booking summary
    setTimeout(() => {
      navigation.navigate("BookingSummary");
    }, 100);
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.headerTitle}>Self-Drive Cars</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => {
            console.log("🟦 [HOME] Open Search Modal");
            openSearchModal();
          }}
        >
          <Ionicons name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.getParent()?.openDrawer()}
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="car-sport-outline"
        size={80}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {hasSearched ? "No Cars Found" : "Find Your Ride"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasSearched
          ? "No cars match your dates, location or filters.\nTry adjusting your search."
          : "Tap the search icon above to find available self-drive cars."}
      </Text>
      {!hasSearched && (
        <TouchableOpacity
          style={styles.searchNowButton}
          onPress={() => {
            console.log("🟦 [HOME] Search Now Clicked");
            openSearchModal();
          }}
        >
          <Ionicons name="search" size={20} color={COLORS.background} />
          <Text style={styles.searchNowButtonText}>Search Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>
        {searchError || "Something went wrong while searching."}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => openSearchModal()}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Finding available cars...</Text>
    </View>
  );

  const renderCarCard = (car: any) => (
    <TouchableOpacity key={car.id} style={styles.carCard} activeOpacity={1}>
      <Image
        source={{
          uri:
            car.photos?.[0]?.url ||
            car.photos?.[0] ||
            "https://via.placeholder.com/400x220?text=No+Image",
        }}
        style={styles.carImage}
        resizeMode="cover"
      />

      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <View style={styles.carTitleContainer}>
            <Text style={styles.carBrand}>{car.make || "Unknown Brand"}</Text>
            <Text style={styles.carName}>
              {car.model || "Model"} {car.year || ""}
            </Text>
          </View>
        </View>

        <View style={styles.carSpecs}>
          {car.capabilities?.seats && (
            <View style={styles.specItem}>
              <Ionicons
                name="people-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.specText}>
                {car.capabilities.seats} Seats
              </Text>
            </View>
          )}
          {car.capabilities?.transmission && (
            <View style={styles.specItem}>
              <Ionicons
                name="settings-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.specText}>
                {car.capabilities.transmission}
              </Text>
            </View>
          )}
          {car.capabilities?.fuelType && (
            <View style={styles.specItem}>
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.specText}>{car.capabilities.fuelType}</Text>
            </View>
          )}
        </View>

        <View style={styles.carLocation}>
          <Ionicons
            name="location-outline"
            size={16}
            color={COLORS.textSecondary}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {car.pickup_location?.city ||
              car.pickup_location?.address ||
              "Location not specified"}
          </Text>
        </View>

        <View style={styles.carFooter}>
          <View>
            <Text style={styles.priceLabel}>
              ₹{car.price_per_hour || "—"} / hr
            </Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => {
                console.log("🚗 [DETAILS] Navigating to car details:", car.id);
                navigation.navigate("CarDetails", { id: car.id });
              }}
            >
              <Text style={styles.detailsButtonText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => handleBookNow(car)}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxxl },
        ]}
      >
        {isSearching ? (
          renderLoading()
        ) : searchError ? (
          renderError()
        ) : cars.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {cars.length} {cars.length === 1 ? "car" : "cars"} found
              </Text>
            </View>
            {cars.map(renderCarCard)}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <SearchModal visible={isSearchModalOpen} onClose={closeSearchModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  resultsHeader: {
    marginBottom: SPACING.lg,
  },
  resultsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  searchNowButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  searchNowButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  errorState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },

  carCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  carImage: {
    width: "100%",
    height: 220,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  carInfo: {
    padding: SPACING.lg,
  },
  carHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  carTitleContainer: {
    flex: 1,
  },
  carBrand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs / 2,
  },
  carName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  carSpecs: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginBottom: SPACING.md,
    flexWrap: "wrap",
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  specText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  carLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
    marginBottom: SPACING.lg,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },

  carFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  detailsButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  bookButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
