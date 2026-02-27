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
import { DrawerActions } from "@react-navigation/native";

// ─────────────────────────────────────────────────────────────────────────────
// Badge configs
// ─────────────────────────────────────────────────────────────────────────────
type CarMode = "selfdrive" | "intercity" | "both";

const RENTAL_MODE_CONFIG: Record<
  CarMode,
  { label: string; color: string; icon: string }
> = {
  selfdrive: { label: "Self Drive", color: "#3B82F6", icon: "🚗" },
  intercity: { label: "Intercity", color: "#8B5CF6", icon: "🛣️" },
  both: { label: "Self Drive + Intercity", color: "#F59E0B", icon: "✨" },
};

const SERVICE_CONFIG = { label: "Car Service", color: "#10B981", icon: "🔧" };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const isServiceOnly = (car: any) =>
  !car.car_mode && car.price_per_hour == null && car.price_per_km == null;

const formatDate = (d: string) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ModeBadge
// ─────────────────────────────────────────────────────────────────────────────
function ModeBadge({ car }: { car: any }) {
  if (isServiceOnly(car)) {
    return (
      <View
        style={[s.modeBadge, { backgroundColor: SERVICE_CONFIG.color + "E6" }]}
      >
        <Text style={s.modeBadgeText}>
          {SERVICE_CONFIG.icon} {SERVICE_CONFIG.label}
        </Text>
      </View>
    );
  }
  const cfg =
    RENTAL_MODE_CONFIG[car.car_mode as CarMode] ?? RENTAL_MODE_CONFIG.selfdrive;
  return (
    <View style={[s.modeBadge, { backgroundColor: cfg.color + "E6" }]}>
      <Text style={s.modeBadgeText}>
        {cfg.icon} {cfg.label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PricingBlock
// ─────────────────────────────────────────────────────────────────────────────
function PricingBlock({ car }: { car: any }) {
  if (isServiceOnly(car)) {
    return (
      <View style={s.priceContainer}>
        <Text style={[s.priceLabel, { color: SERVICE_CONFIG.color }]}>
          Service
        </Text>
        <Text style={s.priceUnit}>only</Text>
      </View>
    );
  }

  const mode: CarMode = car.car_mode ?? "selfdrive";

  if (mode === "selfdrive") {
    return (
      <View style={s.priceContainer}>
        <Text style={s.priceLabel}>₹{car.price_per_hour ?? "—"}</Text>
        <Text style={s.priceUnit}>/ hour</Text>
      </View>
    );
  }

  if (mode === "intercity") {
    return (
      <View style={s.priceContainer}>
        <Text style={s.priceLabel}>₹{car.price_per_km ?? "—"}</Text>
        <Text style={s.priceUnit}>/ km</Text>
      </View>
    );
  }

  return (
    <View style={s.priceContainerBoth}>
      <View style={s.pricePill}>
        <Text style={s.pricePillLabel}>₹{car.price_per_hour ?? "—"}</Text>
        <Text style={s.pricePillUnit}>/hr</Text>
      </View>
      <View style={s.pricePill}>
        <Text style={s.pricePillLabel}>₹{car.price_per_km ?? "—"}</Text>
        <Text style={s.pricePillUnit}>/km</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CarCard
// ─────────────────────────────────────────────────────────────────────────────
function CarCard({ car, navigation }: { car: any; navigation: any }) {
  const serviceOnly = isServiceOnly(car);

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.9}
      onPress={() => navigation.navigate("CarDetails", { id: car.id })}
    >
      {/* Image */}
      <Image
        source={{
          uri:
            car.photos?.[0] ||
            "https://via.placeholder.com/400x220?text=No+Image",
        }}
        style={s.cardImg}
        resizeMode="cover"
      />

      {/* Overlaid badges */}
      <View style={s.badgesRow}>
        <View style={s.statusBadge}>
          <View style={s.statusDot} />
          <Text style={s.statusText}>Active</Text>
        </View>
        <ModeBadge car={car} />
      </View>

      {/* Body */}
      <View style={s.cardBody}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.carBrand}>{car.make || "Unknown"}</Text>
            <Text style={s.carName}>
              {car.model || "Model"} {car.year || ""}
            </Text>
          </View>
          <PricingBlock car={car} />
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {car.kms_driven != null && (
            <View style={s.statItem}>
              <Ionicons
                name="speedometer-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={s.statText}>
                {car.kms_driven.toLocaleString()} km
              </Text>
            </View>
          )}
          {car.documents?.city_of_registration && (
            <View style={s.statItem}>
              <Ionicons
                name="location-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={s.statText}>
                {car.documents.city_of_registration}
              </Text>
            </View>
          )}
          {car.documents?.rc_number && (
            <View style={s.statItem}>
              <Ionicons
                name="card-outline"
                size={15}
                color={COLORS.textSecondary}
              />
              <Text style={s.statText}>{car.documents.rc_number}</Text>
            </View>
          )}
        </View>

        {/* Availability row — rental only */}
        {!serviceOnly && car.available_from && car.available_till && (
          <View style={s.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={COLORS.primary}
            />
            <Text style={s.infoText}>
              Available: {formatDate(car.available_from)} –{" "}
              {formatDate(car.available_till)}
            </Text>
          </View>
        )}

        {/* Service hint row */}
        {serviceOnly && (
          <View style={[s.infoRow, s.serviceHint]}>
            <Ionicons
              name="construct-outline"
              size={13}
              color={SERVICE_CONFIG.color}
            />
            <Text style={[s.infoText, { color: SERVICE_CONFIG.color }]}>
              Added for car service only
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={s.actions}>
          {/* <TouchableOpacity
            style={s.editBtn}
            onPress={() => navigation.navigate("EditCar", { id: car.id })}
          >
            <Ionicons name="create-outline" size={17} color={COLORS.primary} />
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() => navigation.navigate("CarDetails", { id: car.id })}
          >
            <Ionicons name="eye-outline" size={17} color={COLORS.textPrimary} />
            <Text style={s.viewBtnText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MyCarsScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function MyCarsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { cars, loading, error, fetchMyCars } = useAddCarStore();

  useEffect(() => {
    fetchMyCars();
  }, []);

  const rentalCars = cars.filter((c: any) => !isServiceOnly(c));
  const serviceCars = cars.filter((c: any) => isServiceOnly(c));

  // ── Section divider ───────────────────────────────────────────────────────
  const SectionDivider = ({
    icon,
    label,
    count,
    color,
  }: {
    icon: string;
    label: string;
    count: number;
    color: string;
  }) => (
    <View style={[s.sectionDivider, { borderLeftColor: color }]}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={[s.sectionPill, { backgroundColor: color + "20" }]}>
        <Text style={[s.sectionPillText, { color }]}>{count}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={s.headerTitle}>My Cars</Text>
          {cars.length > 0 && (
            <Text style={s.headerSub}>
              {rentalCars.length} rental · {serviceCars.length} service
            </Text>
          )}
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Ionicons
              name="person-circle-outline"
              size={32}
              color={COLORS.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + SPACING.xxxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchMyCars}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Loading */}
        {loading && cars.length === 0 && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={s.loadingText}>Loading your cars...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={s.center}>
            <Ionicons
              name="alert-circle-outline"
              size={72}
              color={COLORS.error}
            />
            <Text style={s.errorTitle}>Oops!</Text>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchMyCars}>
              <Text style={s.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty */}
        {!loading && !error && cars.length === 0 && (
          <View style={s.center}>
            <Ionicons
              name="car-outline"
              size={80}
              color={COLORS.textSecondary}
            />
            <Text style={s.emptyTitle}>No Cars Listed Yet</Text>
            <Text style={s.emptySub}>
              Start earning by listing your car on ZipDrive.{"\n"}
              It only takes a few minutes!
            </Text>
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => navigation.navigate("AddCar")}
            >
              <Ionicons name="add-circle" size={20} color={COLORS.background} />
              <Text style={s.addBtnText}>List Your First Car</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cars */}
        {!loading && !error && cars.length > 0 && (
          <>
            {/* Results summary */}
            <View style={s.resultsHeader}>
              <Text style={s.resultsText}>
                {cars.length} {cars.length === 1 ? "car" : "cars"} listed
              </Text>
            </View>

            {/* Rental section */}
            {rentalCars.length > 0 && (
              <>
                <SectionDivider
                  icon="🚗"
                  label="Rental Cars"
                  count={rentalCars.length}
                  color="#3B82F6"
                />
                {rentalCars.map((car: any) => (
                  <CarCard key={car.id} car={car} navigation={navigation} />
                ))}
              </>
            )}

            {/* Service section */}
            {serviceCars.length > 0 && (
              <>
                <SectionDivider
                  icon="🔧"
                  label="Service Cars"
                  count={serviceCars.length}
                  color={SERVICE_CONFIG.color}
                />
                {serviceCars.map((car: any) => (
                  <CarCard key={car.id} car={car} navigation={navigation} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.xl },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
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
  headerSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Results header
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

  // Section divider
  sectionDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    borderLeftWidth: 3,
    paddingLeft: SPACING.md,
  },
  sectionIcon: { fontSize: 16 },
  sectionLabel: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  sectionPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.lg,
  },
  sectionPillText: { fontSize: FONT_SIZES.sm, fontWeight: FONT_WEIGHTS.bold },

  // Card
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardImg: {
    width: "100%",
    height: 200,
    backgroundColor: COLORS.cardBackgroundLight,
  },

  // Overlaid badges
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

  // Body
  cardBody: { padding: SPACING.lg },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  carBrand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  carName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Pricing
  priceContainer: { alignItems: "flex-end" },
  priceLabel: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  priceUnit: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceContainerBoth: { alignItems: "flex-end", gap: SPACING.xs },
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
  pricePillUnit: { fontSize: FONT_SIZES.xs, color: COLORS.primary },

  // Stats
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Info / hint rows
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackgroundLight,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  infoText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  serviceHint: { borderColor: "#10B98130", backgroundColor: "#10B98110" },

  // Actions
  actions: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.sm },
  editBtn: {
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
  editBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  viewBtn: {
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
  viewBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // States
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
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
  emptyTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  addBtnText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
