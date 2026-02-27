import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
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
import { useAddCarStore } from "../../../store/host/addCar.store";
import { useAuthStore } from "../../../store/auth.store";

type CarMode = "selfdrive" | "intercity" | "both";

const CAR_MODE_CONFIG: Record<
  CarMode,
  { label: string; color: string; icon: string }
> = {
  selfdrive: { label: "Self Drive", color: "#3B82F6", icon: "🚗" },
  intercity: { label: "Intercity", color: "#8B5CF6", icon: "🛣️" },
  both: { label: "Self Drive + Intercity", color: "#F59E0B", icon: "✨" },
};

export default function HostedCarsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { cars, loading, error, fetchMyCars } = useAddCarStore();

  useEffect(() => {
    console.log("🚗 [HOSTED CARS] Screen mounted, fetching cars...");
    fetchMyCars();
  }, []);

  const handleRefresh = () => {
    fetchMyCars();
  };

  const handleAddCar = () => {
    navigation.navigate("AddCar");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // ── Car Mode Badge ────────────────────────────────────────────────────────
  const renderModeBadge = (car: any) => {
    const mode: CarMode = car.car_mode ?? "selfdrive";
    const config = CAR_MODE_CONFIG[mode];
    return (
      <View
        style={[styles.modeBadge, { backgroundColor: config.color + "E6" }]}
      >
        <Text style={styles.modeBadgeText}>
          {config.icon} {config.label}
        </Text>
      </View>
    );
  };

  // ── Pricing block based on car_mode ───────────────────────────────────────
  const renderPricing = (car: any) => {
    const mode: CarMode = car.car_mode ?? "selfdrive";

    if (mode === "selfdrive") {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>₹{car.price_per_hour ?? "—"}</Text>
          <Text style={styles.priceUnit}>/ hour</Text>
        </View>
      );
    }

    if (mode === "intercity") {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>₹{car.price_per_km ?? "—"}</Text>
          <Text style={styles.priceUnit}>/ km</Text>
        </View>
      );
    }

    // both
    return (
      <View style={styles.priceContainerBoth}>
        <View style={styles.pricePill}>
          <Text style={styles.pricePillLabel}>
            ₹{car.price_per_hour ?? "—"}
          </Text>
          <Text style={styles.pricePillUnit}>/hr</Text>
        </View>
        <View style={styles.pricePill}>
          <Text style={styles.pricePillLabel}>₹{car.price_per_km ?? "—"}</Text>
          <Text style={styles.pricePillUnit}>/km</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.headerTitle}>My Cars</Text>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCar}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle" size={28} color={COLORS.primary} />
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
      <Ionicons name="car-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Cars Listed Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start earning by listing your car on ZipDrive.{"\n"}
        It only takes a few minutes!
      </Text>
      <TouchableOpacity
        style={styles.addCarButton}
        onPress={handleAddCar}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle" size={20} color={COLORS.background} />
        <Text style={styles.addCarButtonText}>List Your First Car</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorState}>
      <Ionicons name="alert-circle-outline" size={80} color={COLORS.error} />
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorText}>
        {error || "Something went wrong while loading your cars."}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={handleRefresh}
        activeOpacity={0.8}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Loading your cars...</Text>
    </View>
  );

  const renderCarCard = (car: any) => (
    <TouchableOpacity
      key={car.id}
      style={styles.carCard}
      activeOpacity={0.9}
      onPress={() => {
        console.log("View car details:", car.id);
        // navigation.navigate("CarDetails", { id: car.id });
      }}
    >
      {/* Car Image */}
      <Image
        source={{
          uri:
            car.photos?.[0] ||
            "https://via.placeholder.com/400x220?text=No+Image",
        }}
        style={styles.carImage}
        resizeMode="cover"
      />

      {/* Badges Row — overlaid on image */}
      <View style={styles.badgesRow}>
        {/* Active status — left */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>

        {/* Car mode — right */}
        {renderModeBadge(car)}
      </View>

      {/* Car Info */}
      <View style={styles.carInfo}>
        <View style={styles.carHeader}>
          <View style={styles.carTitleContainer}>
            <Text style={styles.carBrand}>{car.make || "Unknown"}</Text>
            <Text style={styles.carName}>
              {car.model || "Model"} {car.year || ""}
            </Text>
          </View>

          {/* Dynamic pricing */}
          {renderPricing(car)}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {car.kms_driven !== undefined && (
            <View style={styles.statItem}>
              <Ionicons
                name="speedometer-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.statText}>
                {car.kms_driven.toLocaleString()} km
              </Text>
            </View>
          )}
          {car.documents?.city_of_registration && (
            <View style={styles.statItem}>
              <Ionicons
                name="location-outline"
                size={16}
                color={COLORS.textSecondary}
              />
              <Text style={styles.statText}>
                {car.documents.city_of_registration}
              </Text>
            </View>
          )}
        </View>

        {/* Availability */}
        {car.available_from && car.available_till && (
          <View style={styles.availabilityRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={COLORS.primary}
            />
            <Text style={styles.availabilityText}>
              Available: {formatDate(car.available_from)} -{" "}
              {formatDate(car.available_till)}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => {
              console.log("View details:", car.id);
              // navigation.navigate("CarDetails", { id: car.id });
            }}
          >
            <Ionicons name="eye-outline" size={18} color={COLORS.textPrimary} />
            <Text style={styles.detailsButtonText}>View Details</Text>
          </TouchableOpacity>
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
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {loading && cars.length === 0 ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : cars.length > 0 ? (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                {cars.length} {cars.length === 1 ? "car" : "cars"} listed
              </Text>
              <TouchableOpacity onPress={handleAddCar}>
                <Text style={styles.addMoreText}>+ Add More</Text>
              </TouchableOpacity>
            </View>
            {cars.map(renderCarCard)}
          </>
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  addButton: {
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

  // Results Header
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  resultsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  addMoreText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Empty State
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
  addCarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  addCarButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Error State
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

  // Loading State
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

  // Car Card
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
    height: 200,
    backgroundColor: COLORS.cardBackgroundLight,
  },

  // Badges row — overlaid on top of image
  badgesRow: {
    position: "absolute",
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "E6",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.background,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  modeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  modeBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Car Info
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

  // Pricing — single mode (selfdrive or intercity)
  priceContainer: {
    alignItems: "flex-end",
  },
  priceLabel: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  priceUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },

  // Pricing — "both" mode
  priceContainerBoth: {
    alignItems: "flex-end",
    gap: SPACING.xs,
  },
  pricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: COLORS.primary + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  pricePillLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  pricePillUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  statText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Availability
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackgroundLight,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  availabilityText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary + "20",
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  detailsButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBackgroundLight,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
