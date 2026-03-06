import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useAuthStore } from "../../../store/auth.store";
import {
  API_CONFIG,
  API_ENDPOINTS,
  getHeaders,
} from "../../../config/api.config";

const { width } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Types  — matches actual /cars API response
// ─────────────────────────────────────────────────────────────────────────────
interface Car {
  id: number;
  brand: string;
  name: string;
  year: number;
  image: string;
  location: string | null;
  price_per_hour: number | null;
  price_per_km: number | null;
}

type CarMode = "selfdrive" | "intercity" | "both" | "service";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getCarMode = (car: Car): CarMode => {
  const hasHour = (car.price_per_hour ?? 0) > 0;
  const hasKm = (car.price_per_km ?? 0) > 0;
  if (hasHour && hasKm) return "both";
  if (hasHour) return "selfdrive";
  if (hasKm) return "intercity";
  return "service";
};

// Hide service-only cars from home screen
const isRentable = (car: Car) => getCarMode(car) !== "service";

const formatPrice = (car: Car): string => {
  const hasHour = (car.price_per_hour ?? 0) > 0;
  const hasKm = (car.price_per_km ?? 0) > 0;
  if (hasHour && hasKm)
    return `₹${car.price_per_hour}/hr · ₹${car.price_per_km}/km`;
  if (hasHour) return `₹${car.price_per_hour}/hr`;
  if (hasKm) return `₹${car.price_per_km}/km`;
  return "Service only";
};

const getBadgeStyle = (mode: CarMode) => {
  switch (mode) {
    case "selfdrive":
      return { label: "SELF-DRIVE", color: "#3B82F6" };
    case "intercity":
      return { label: "INTERCITY", color: "#8B5CF6" };
    case "both":
      return { label: "SELF-DRIVE + INTERCITY", color: "#F59E0B" };
    case "service":
      return { label: "CAR SERVICE", color: "#10B981" };
  }
};

const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const getFirstName = (name?: string) => (name ? name.split(" ")[0] : "there");

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: CarMode }) {
  const { label, color } = getBadgeStyle(mode);
  return (
    <View
      style={[
        badge.wrap,
        { backgroundColor: color + "22", borderColor: color + "44" },
      ]}
    >
      <Text style={[badge.text, { color }]}>{label}</Text>
    </View>
  );
}

function FeaturedCard({ car, onPress }: { car: Car; onPress: () => void }) {
  const mode = getCarMode(car);
  return (
    <TouchableOpacity style={fc.card} onPress={onPress} activeOpacity={0.9}>
      <Image
        source={{
          uri: car.image || "https://via.placeholder.com/800x400?text=No+Image",
        }}
        style={fc.img}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(10,18,32,0.97)"]}
        style={fc.gradient}
      >
        <ModeBadge mode={mode} />
        <Text style={fc.carName}>
          {car.brand} {car.name}
        </Text>
        <View style={fc.row}>
          <Text style={fc.year}>{car.year}</Text>
          {car.location ? (
            <Text style={fc.locText}> · {car.location}</Text>
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={fc.price}>{formatPrice(car)}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

function ListCard({ car, onPress }: { car: Car; onPress: () => void }) {
  const mode = getCarMode(car);
  return (
    <TouchableOpacity style={lc.card} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{
          uri: car.image || "https://via.placeholder.com/400x200?text=No+Image",
        }}
        style={lc.img}
        resizeMode="cover"
      />
      <View style={lc.info}>
        <Text style={lc.brand}>{car.brand}</Text>
        <Text style={lc.carName} numberOfLines={1}>
          {car.name} {car.year}
        </Text>
        <ModeBadge mode={mode} />
      </View>
      <View style={lc.right}>
        <Text style={lc.price}>{formatPrice(car)}</Text>
        {car.location ? (
          <View style={lc.locRow}>
            <Ionicons
              name="location-outline"
              size={11}
              color={COLORS.textSecondary}
            />
            <Text style={lc.locLabel} numberOfLines={1}>
              {car.location}
            </Text>
          </View>
        ) : null}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={COLORS.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ icon, message }: { icon?: any; message: string }) {
  return (
    <View style={es.wrap}>
      <Ionicons
        name={icon ?? "car-outline"}
        size={44}
        color={COLORS.textSecondary}
      />
      <Text style={es.text}>{message}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCars = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}${API_ENDPOINTS.GET_ALL_CARS}`,
          { headers: getHeaders(token ?? undefined) },
        );
        if (!res.ok) throw new Error("Failed to load cars");
        const data = await res.json();
        const list: Car[] = Array.isArray(data) ? data : (data.cars ?? []);
        setCars(list);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchCars();
  }, [fetchCars]);

  // ── Derived slices ──────────────────────────────────────────────────────
  const selfDrive = cars.filter((c) => {
    const m = getCarMode(c);
    return m === "selfdrive" || m === "both";
  });
  const intercity = cars.filter((c) => {
    const m = getCarMode(c);
    return m === "intercity" || m === "both";
  });
  const serviceCars = cars.filter((c) => getCarMode(c) === "service");
  const featured = cars; // show ALL cars in featured carousel

  const serviceCards = [
    {
      id: "1",
      icon: "car-sport" as const,
      title: "Self-Drive",
      subtitle: "Rent for any occasion",
      route: "SelfDrive",
    },
    {
      id: "2",
      icon: "navigate" as const,
      title: "Intercity",
      subtitle: "City to city travel",
      route: "Intercity",
    },
    {
      id: "3",
      icon: "swap-horizontal" as const,
      title: "Car Trade",
      subtitle: "Buy or sell your car",
      route: "Trade",
    },
    {
      id: "4",
      icon: "construct" as const,
      title: "Maintenance",
      subtitle: "Repairs & checks",
      route: "Service",
    },
  ];

  if (loading) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={s.loadingText}>Loading cars…</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <View style={s.center}>
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={COLORS.error}
          />
          <Text style={s.errorTitle}>Couldn't load cars</Text>
          <Text style={s.errorSub}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => fetchCars()}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchCars(true)}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[s.header, { paddingTop: insets.top + SPACING.md }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>
              {getGreeting()},{" "}
              <Text style={s.greetingAccent}>{getFirstName(user?.name)}</Text>{" "}
              👋
            </Text>
            <Text style={s.greetingSub}>Ready for your next journey?</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.openDrawer()}
            style={s.avatarBtn}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={s.avatarImg} />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={44}
                color={COLORS.textPrimary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Service shortcuts */}
        <View style={s.serviceGrid}>
          {serviceCards.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={s.serviceCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(svc.route)}
            >
              <View style={s.serviceIconBox}>
                <Ionicons name={svc.icon} size={26} color={COLORS.primary} />
              </View>
              <Text style={s.serviceTitle}>{svc.title}</Text>
              <Text style={s.serviceSub}>{svc.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live stats */}
        {cars.length > 0 && (
          <View style={s.statsBar}>
            {[
              { label: "Self-Drive", value: selfDrive.length },
              { label: "Intercity", value: intercity.length },
              { label: "Service", value: serviceCars.length },
            ].map((stat, i) => (
              <View
                key={stat.label}
                style={[
                  s.statItem,
                  i < 2 && {
                    borderRightWidth: 1,
                    borderRightColor: COLORS.border,
                  },
                ]}
              >
                <Text style={s.statValue}>{stat.value}</Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Featured cars */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Featured Cars</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SelfDrive")}>
              <Text style={s.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {cars.length === 0 ? (
            <EmptyState message="No cars available right now" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: SPACING.xl,
                gap: SPACING.md,
              }}
            >
              {featured.map((car) => (
                <FeaturedCard
                  key={car.id}
                  car={car}
                  onPress={() =>
                    navigation.navigate("CarDetails", { id: car.id })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {cars.length === 0 && (
          <EmptyState message="No cars listed yet. Check back soon!" />
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
    padding: SPACING.xl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  greeting: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  greetingAccent: { color: COLORS.primary },
  greetingSub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },

  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  serviceCard: {
    width: (width - SPACING.xl * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serviceIconBox: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  serviceTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: 2,
  },
  serviceSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  statsBar: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: SPACING.lg },
  statValue: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  section: { marginBottom: SPACING.xxl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  viewAll: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  loadingText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  errorTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  errorSub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },
});

const badge = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    marginBottom: 2,
  },
  text: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.3,
  },
});

const fc = StyleSheet.create({
  card: {
    width: width * 0.72,
    height: 210,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.cardBackground,
  },
  img: { width: "100%", height: "100%" },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  carName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginVertical: 4,
  },
  row: { flexDirection: "row", alignItems: "center" },
  year: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  locText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  price: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

const lc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  img: {
    width: 90,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  info: { flex: 1, marginLeft: SPACING.md, gap: 4 },
  brand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  carName: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  right: { alignItems: "flex-end", gap: 4, marginLeft: SPACING.sm },
  price: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  locRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  locLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    maxWidth: 80,
  },
});

const es = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
    gap: SPACING.md,
  },
  text: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
});
