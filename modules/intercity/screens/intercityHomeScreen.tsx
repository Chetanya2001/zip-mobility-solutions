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
import { useIntercityStore } from "../../../store/intercityStore/intercity.store";
import IntercitySearchModal from "../modals/intercitySearchModal";

export default function IntercityHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const cars = useIntercityStore((state) => state.cars ?? []);
  const isSearching = useIntercityStore((state) => state.isSearching);
  const searchError = useIntercityStore((state) => state.searchError);
  const hasSearched = useIntercityStore((state) => state.hasSearched);
  const searchFilters = useIntercityStore((s) => s.searchFilters);
  const isSearchModalOpen = useIntercityStore((s) => s.isSearchModalOpen);
  const openSearchModal = useIntercityStore((s) => s.openSearchModal);
  const closeSearchModal = useIntercityStore((s) => s.closeSearchModal);

  // ── Estimated fare helper (base + GST, no insurance) ─────────────────────
  const getEstimatedFare = (pricePerKm: number) => {
    const km = searchFilters.tripDistanceKm ?? 0;
    if (!km || !pricePerKm) return null;
    const base = Math.round(km * pricePerKm);
    const gst = Math.round(base * 0.18);
    return base + gst;
  };

  const handleBookNow = (car: any) => {
    if (!searchFilters.pickupCity || !searchFilters.pickupStation) {
      Alert.alert(
        "Missing Information",
        "Please search with pickup city and station first",
        [{ text: "Search Now", onPress: () => openSearchModal() }],
      );
      return;
    }
    if (!searchFilters.pickupDate || !searchFilters.pickupTime) {
      Alert.alert("Missing Dates", "Please select pickup date and time first", [
        { text: "Search Now", onPress: () => openSearchModal() },
      ]);
      return;
    }
    if (!searchFilters.dropAddress) {
      Alert.alert("Missing Drop Address", "Please enter drop address first", [
        { text: "Search Now", onPress: () => openSearchModal() },
      ]);
      return;
    }

    navigation.navigate("BookingSummary", {
      carId: car.id,
      carMake: car.make,
      carModel: car.model,
      carYear: car.year,

      pickupLocation: {
        address: searchFilters.pickupStation,
        lat: searchFilters.pickupLat ?? 0,
        lng: searchFilters.pickupLng ?? 0,
        city: searchFilters.pickupCity,
      },

      dropLocation: {
        address: searchFilters.dropAddress,
        lat: searchFilters.dropLat ?? 0,
        lng: searchFilters.dropLng ?? 0,
        city: searchFilters.dropCity ?? "",
      },

      dropCity: searchFilters.dropCity ?? "",

      // ✅ KEY FIX: tripDistanceKm from store → booking summary
      tripDistanceKm: searchFilters.tripDistanceKm ?? 0,
      pricePerKm: car.price_per_km ?? 0,

      pickupDateTime: `${searchFilters.pickupDate}T${searchFilters.pickupTime}`,

      pax: searchFilters.pax ?? 1,
      luggage: searchFilters.luggage ?? 0,
      insureTrip: true,
    });
  };

  // ── Sub-components ────────────────────────────────────────────────────────

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.headerTitle}>Intercity Travel</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={openSearchModal}>
          <Ionicons name="search" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
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
    <View style={styles.centerState}>
      <Ionicons name="bus-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.centerTitle}>
        {hasSearched ? "No Cars Found" : "Plan Your City-to-City Trip"}
      </Text>
      <Text style={styles.centerSubtitle}>
        {hasSearched
          ? "No intercity cars match your route or schedule.\nTry adjusting your search."
          : "Tap the search icon above to find available intercity cars with drivers."}
      </Text>
      {!hasSearched && (
        <TouchableOpacity style={styles.searchNowBtn} onPress={openSearchModal}>
          <Ionicons name="search" size={20} color={COLORS.background} />
          <Text style={styles.searchNowBtnText}>Search Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.centerState}>
      <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
      <Text style={styles.centerTitle}>Oops!</Text>
      <Text style={styles.centerSubtitle}>
        {searchError || "Something went wrong while searching."}
      </Text>
      <TouchableOpacity style={styles.retryBtn} onPress={openSearchModal}>
        <Text style={styles.retryBtnText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.centerSubtitle}>Finding available cars...</Text>
    </View>
  );

  const renderCarCard = (car: any) => {
    const estimatedFare = getEstimatedFare(car.price_per_km);
    const distanceKm = searchFilters.tripDistanceKm;

    return (
      <TouchableOpacity
        key={car.id}
        style={styles.carCard}
        activeOpacity={0.97}
      >
        {/* ── Image ── */}
        <View>
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

          {/* Driver badge — top right */}
          {car.driver_included && (
            <View style={styles.driverBadge}>
              <Ionicons name="person" size={13} color={COLORS.background} />
              <Text style={styles.driverBadgeText}>Driver Included</Text>
            </View>
          )}

          {/* ✅ Distance badge — bottom left on image */}
          {!!distanceKm && (
            <View style={styles.imagDistanceBadge}>
              <Ionicons name="navigate" size={12} color="#fff" />
              <Text style={styles.imagDistanceBadgeText}>{distanceKm} km</Text>
            </View>
          )}
        </View>

        {/* ── Card Body ── */}
        <View style={styles.carInfo}>
          {/* Title */}
          <Text style={styles.carBrand}>{car.make || "Unknown Brand"}</Text>
          <Text style={styles.carName}>
            {car.model || "Model"} {car.year || ""}
          </Text>

          {/* Specs */}
          <View style={styles.carSpecs}>
            {car.capabilities?.seats && (
              <View style={styles.specItem}>
                <Ionicons
                  name="people-outline"
                  size={14}
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
                  size={14}
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
                  size={14}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.specText}>{car.capabilities.fuelType}</Text>
              </View>
            )}
          </View>

          {/* ── Route block ── */}
          {searchFilters.pickupCity && searchFilters.dropAddress && (
            <View style={styles.routeBox}>
              {/* Pickup row */}
              <View style={styles.routeRow}>
                <View style={styles.routeDotGreen} />
                <Text style={styles.routeRowText} numberOfLines={1}>
                  {searchFilters.pickupStation}, {searchFilters.pickupCity}
                </Text>
              </View>

              {/* ✅ Distance connector between pickup and drop */}
              <View style={styles.routeConnector}>
                <View style={styles.routeConnectorLine} />
                {!!distanceKm && (
                  <View style={styles.routeConnectorChip}>
                    <Ionicons
                      name="navigate-outline"
                      size={10}
                      color={COLORS.primary}
                    />
                    <Text style={styles.routeConnectorChipText}>
                      {distanceKm} km road distance
                    </Text>
                  </View>
                )}
                <View style={styles.routeConnectorLine} />
              </View>

              {/* Drop row */}
              <View style={styles.routeRow}>
                <View style={styles.routeDotRed} />
                <Text style={styles.routeRowText} numberOfLines={1}>
                  {searchFilters.dropAddress}
                </Text>
              </View>
            </View>
          )}

          {/* ── Footer: price + book button ── */}
          <View style={styles.carFooter}>
            <View>
              <Text style={styles.pricePerKm}>
                ₹{car.price_per_km || "—"} / km
              </Text>
              {/* ✅ Estimated total fare with GST */}
              {estimatedFare ? (
                <Text style={styles.estimatedFare}>
                  Est. ≈ ₹{estimatedFare}{" "}
                  <Text style={styles.estimatedFareNote}>(incl. GST)</Text>
                </Text>
              ) : (
                <Text style={styles.priceNote}>+ Driver charges</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => handleBookNow(car)}
              activeOpacity={0.85}
            >
              <Text style={styles.bookBtnText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────

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
            {/* ── Results header with route + distance ── */}
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {cars.length} {cars.length === 1 ? "car" : "cars"} found
              </Text>
              <View style={styles.resultsMetaRow}>
                {searchFilters.pickupCity && (
                  <Text style={styles.resultsMeta}>
                    {searchFilters.pickupCity} →{" "}
                    {searchFilters.dropCity || "Drop Location"}
                  </Text>
                )}
                {/* ✅ Distance pill in header */}
                {!!searchFilters.tripDistanceKm && (
                  <View style={styles.headerDistancePill}>
                    <Ionicons
                      name="navigate"
                      size={11}
                      color={COLORS.primary}
                    />
                    <Text style={styles.headerDistancePillText}>
                      {searchFilters.tripDistanceKm} km
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {cars.map(renderCarCard)}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <IntercitySearchModal
        visible={isSearchModalOpen}
        onClose={closeSearchModal}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.xl },

  // Header
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: SPACING.xs },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Results header
  resultsHeader: { marginBottom: SPACING.lg },
  resultsCount: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  resultsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs / 2,
    flexWrap: "wrap",
  },
  resultsMeta: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  // Distance pill next to route summary
  headerDistancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary + "18",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: 20,
  },
  headerDistancePillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Center states (empty / error / loading)
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  centerTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  centerSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  searchNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  searchNowBtnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryBtnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Car card
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

  // Driver badge — top right
  driverBadge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  driverBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Distance badge — bottom left on image
  imagDistanceBadge: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: "rgba(0,0,0,0.58)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  imagDistanceBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: FONT_WEIGHTS.bold,
  },

  carInfo: { padding: SPACING.lg },
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
    marginBottom: SPACING.sm,
  },
  carSpecs: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.md,
    flexWrap: "wrap",
  },
  specItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  specText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Route box
  routeBox: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  routeDotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    flexShrink: 0,
  },
  routeDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    flexShrink: 0,
  },
  routeRowText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },

  // Distance connector
  routeConnector: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 4,
    marginVertical: SPACING.xs,
    gap: SPACING.xs,
  },
  routeConnectorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  routeConnectorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.primary + "14",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 20,
  },
  routeConnectorChipText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Footer
  carFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pricePerKm: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  priceNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  estimatedFare: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: 2,
  },
  estimatedFareNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  bookBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
