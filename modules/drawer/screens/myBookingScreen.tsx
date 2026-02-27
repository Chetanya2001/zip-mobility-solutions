import React, { useState, useEffect } from "react";
import { drawerService } from "../drawer.service";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
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
import { useAuthStore } from "../../../store/auth.store";
import { DrawerActions } from "@react-navigation/native";

type BookingStatus = "ongoing" | "upcoming" | "past";
type BookingCategory = "rental" | "service";

interface UnifiedBooking {
  id: string;
  booking_category: BookingCategory;
  status: string;
  carMake: string;
  carModel: string;
  carImage: string;
  createdAt: string;
  booking_type?: string;
  total_amount?: number;
  startDate?: string;
  endDate?: string;
  guestName?: string;
  guestPhone?: string;
  scheduled_at?: string;
  total_price?: number;
  planName?: string;
  planDuration?: number;
}

const FILTER_OPTIONS: { label: string; value: BookingStatus }[] = [
  { label: "ONGOING", value: "ongoing" },
  { label: "UPCOMING", value: "upcoming" },
  { label: "PAST", value: "past" },
];

const formatDate = (iso: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
};

const formatDateTime = (iso: string) => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const h = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
    const m = d.getMinutes().toString().padStart(2, "0");
    const mer = d.getHours() >= 12 ? "PM" : "AM";
    return `${d.getDate()} ${months[d.getMonth()]} · ${h}:${m} ${mer}`;
  } catch {
    return "";
  }
};

const formatPrice = (p?: number | string) => {
  const n = Number(p);
  return n ? `₹${n.toLocaleString("en-IN")}` : "Custom";
};

const mapRental = (b: any): UnifiedBooking => {
  const car = b.car || {};
  return {
    id: String(b.id),
    booking_category: "rental",
    status: b.status?.toLowerCase() ?? "confirmed",
    carMake: car.make || "Unknown",
    carModel:
      [car.make, car.model, car.year].filter(Boolean).join(" ") || "My Car",
    carImage:
      car.thumbnail ||
      "https://via.placeholder.com/400x200/90EE90/000000?text=Car",
    createdAt: b.createdAt,
    booking_type: b.booking_type,
    total_amount: Number(b.total_amount || 0),
    startDate:
      b.self_drive?.start_datetime || b.intercity?.pickup_datetime || "",
    endDate: b.self_drive?.end_datetime || b.intercity?.drop_datetime || "",
    guestName: b.guest?.name || undefined,
    guestPhone: b.guest?.phone || undefined,
  };
};

const mapService = (b: any): UnifiedBooking => {
  const car = b.car || {};
  return {
    id: String(b.id),
    booking_category: "service",
    status: b.status?.toLowerCase() ?? "pending",
    carMake: car.make || "Unknown",
    carModel:
      [car.make, car.model, car.year].filter(Boolean).join(" ") || "My Car",
    carImage:
      car.thumbnail ||
      "https://via.placeholder.com/400x200/E8F4FD/000000?text=Service",
    createdAt: b.createdAt,
    scheduled_at: b.scheduled_at,
    total_price: Number(b.total_price || b.plan?.price || 0),
    planName: b.plan?.name || "Car Service",
    planDuration: b.plan?.duration_minutes,
  };
};

const isDatePast = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  return new Date(dateStr).getTime() < Date.now();
};

// Date-first, status-second:
// If the booking end/scheduled date has passed → "past" (regardless of status)
// cancelled/completed → always "past"
// in_progress → "ongoing"
// future confirmed/scheduled/pending → "upcoming"
const getFilterTab = (
  status: string,
  endDate?: string,
  scheduledAt?: string,
): BookingStatus => {
  if (status === "completed" || status === "cancelled") return "past";
  const relevantDate = endDate || scheduledAt;
  if (isDatePast(relevantDate)) return "past";
  if (status === "in_progress") return "ongoing";
  return "upcoming";
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  in_progress: { label: "IN PROGRESS", color: COLORS.primary },
  confirmed: { label: "CONFIRMED", color: COLORS.primary },
  scheduled: { label: "SCHEDULED", color: "#6366F1" },
  pending: { label: "PENDING", color: "#F59E0B" },
  completed: { label: "COMPLETED", color: "#6B7280" },
  cancelled: { label: "CANCELLED", color: "#EF4444" },
};

export default function MyBookingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const userRole: string = Array.isArray(user?.role)
    ? user.role[0]
    : (user?.role ?? "guest");
  const isHost = userRole?.toLowerCase() === "host";

  const [activeFilter, setActiveFilter] = useState<BookingStatus>("upcoming");
  const [bookings, setBookings] = useState<UnifiedBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [isHost]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      if (isHost) {
        // ── HOST: fetch both endpoints in parallel ──────────────────────
        // - getHostBooking()   → rental bookings where host_id = user
        //                        + service bookings where user_id = user
        // - getGuestBookings() → service bookings where user_id = user
        //                        (we only need the service array from this)
        const [hostResponse, guestResponse] = await Promise.all([
          drawerService.getHostBooking(),
          drawerService.getGuestBookings(),
        ]);

        const hostRental: any[] = hostResponse?.rental ?? [];
        const hostService: any[] = hostResponse?.service ?? [];
        const guestService: any[] = guestResponse?.service ?? [];

        // Deduplicate service bookings by id — hostService and guestService
        // both return the same user's service bookings, so just use one set
        // (they should be identical, but guard with a Map just in case)
        const serviceMap = new Map<string, any>();
        [...hostService, ...guestService].forEach((b) =>
          serviceMap.set(String(b.id), b),
        );
        const allService = Array.from(serviceMap.values());

        const mapped: UnifiedBooking[] = [
          ...hostRental.map(mapRental), // cars rented out by host
          ...allService.map(mapService), // service bookings made by this user
        ];

        mapped.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBookings(mapped);
      } else {
        // ── GUEST: single call, both rental + service ───────────────────
        const response = await drawerService.getGuestBookings();
        const mapped: UnifiedBooking[] = [
          ...(response?.rental ?? []).map(mapRental),
          ...(response?.service ?? []).map(mapService),
        ];
        mapped.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setBookings(mapped);
      }
    } catch (error: any) {
      console.error("Error fetching bookings:", error.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleBookings = bookings.filter(
    (b) => getFilterTab(b.status, b.endDate, b.scheduled_at) === activeFilter,
  );

  // ── Rental card ──────────────────────────────────────────────────────────
  const renderRentalCard = (b: UnifiedBooking) => {
    const badge = STATUS_BADGE[b.status] ?? {
      label: b.status.toUpperCase(),
      color: COLORS.textSecondary,
    };
    const typeLabel =
      b.booking_type === "SELF_DRIVE" ? "SELF-DRIVE" : "INTERCITY";
    const isPast = getFilterTab(b.status, b.endDate, b.scheduled_at) === "past";

    return (
      <View key={`r-${b.id}`} style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: b.carImage }}
            style={styles.carImage}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
          <View style={styles.bottomBadge}>
            <Text style={styles.bottomBadgeText}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.rowSpread}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>{b.carModel}</Text>
              {b.startDate ? (
                <View style={styles.row}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.subText}>
                    {formatDate(b.startDate)} –{" "}
                    {formatDate(b.endDate || b.startDate)}
                  </Text>
                </View>
              ) : null}
              {/* Show guest info only when host is viewing their hosted rentals */}
              {isHost && b.guestName ? (
                <View style={styles.row}>
                  <Ionicons
                    name="person-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.subText}>{b.guestName}</Text>
                  {b.guestPhone ? (
                    <Text style={styles.subText}> · {b.guestPhone}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.priceLabel}>
                {isPast ? "TOTAL PAID" : "AMOUNT DUE"}
              </Text>
              <Text style={styles.priceValue}>
                ₹{(b.total_amount || 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ── Service card ─────────────────────────────────────────────────────────
  const renderServiceCard = (b: UnifiedBooking) => {
    const badge = STATUS_BADGE[b.status] ?? {
      label: b.status.toUpperCase(),
      color: COLORS.textSecondary,
    };
    const isPast = getFilterTab(b.status, b.endDate, b.scheduled_at) === "past";

    return (
      <View key={`s-${b.id}`} style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: b.carImage }}
            style={styles.carImage}
            resizeMode="cover"
          />
          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
          <View
            style={[
              styles.bottomBadge,
              { flexDirection: "row", alignItems: "center", gap: 4 },
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={11}
              color={COLORS.primary}
            />
            <Text style={styles.bottomBadgeText}>CAR SERVICE</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.rowSpread}>
            <View style={{ flex: 1 }}>
              <Text style={styles.carName}>{b.carModel}</Text>
              {b.planName ? (
                <View style={styles.row}>
                  <Ionicons
                    name="flash-outline"
                    size={13}
                    color={COLORS.primary}
                  />
                  <Text
                    style={[
                      styles.subText,
                      {
                        color: COLORS.primary,
                        fontWeight: FONT_WEIGHTS.semibold,
                      },
                    ]}
                  >
                    {b.planName}
                    {b.planDuration ? `  ·  ~${b.planDuration} mins` : ""}
                  </Text>
                </View>
              ) : null}
              {b.scheduled_at ? (
                <View style={styles.row}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.subText}>
                    {formatDateTime(b.scheduled_at)}
                  </Text>
                </View>
              ) : null}
              <View style={styles.row}>
                <Ionicons
                  name="receipt-outline"
                  size={12}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.subText}>
                  #{String(b.id).padStart(5, "0")}
                </Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.priceLabel}>
                {isPast ? "TOTAL PAID" : "AMOUNT DUE"}
              </Text>
              <Text style={styles.priceValue}>
                {formatPrice(b.total_price)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="calendar-outline"
        size={72}
        color={COLORS.textSecondary}
      />
      <Text style={styles.emptyTitle}>No {activeFilter} bookings</Text>
      <Text style={styles.emptySubtitle}>
        {activeFilter === "ongoing"
          ? "You don't have any active bookings right now"
          : activeFilter === "upcoming"
            ? "You don't have any upcoming bookings"
            : "You don't have any past bookings"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.rolePill}>
            <Ionicons
              name={isHost ? "home-outline" : "person-outline"}
              size={11}
              color={COLORS.primary}
            />
            <Text style={styles.rolePillText}>
              {isHost ? "Host view" : "Guest view"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map(({ label, value }) => {
          const isActive = activeFilter === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.filterBtn, isActive && styles.filterBtnActive]}
              onPress={() => setActiveFilter(value)}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.filterText, isActive && styles.filterTextActive]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bookings List */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + SPACING.xxxl },
        ]}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        ) : visibleBookings.length > 0 ? (
          visibleBookings.map((b) =>
            b.booking_category === "service"
              ? renderServiceCard(b)
              : renderRentalCard(b),
          )
        ) : (
          renderEmptyState()
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  rolePillText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  filterBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary + "20",
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.5,
  },
  filterTextActive: { color: COLORS.primary },
  list: { padding: SPACING.xl },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageContainer: {
    position: "relative",
    height: 180,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  carImage: { width: "100%", height: "100%" },
  statusBadge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  bottomBadge: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.background + "E6",
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  bottomBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.5,
  },
  cardBody: { padding: SPACING.lg },
  rowSpread: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 4,
  },
  carName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  subText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl * 2,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  emptyState: {
    flex: 1,
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
    lineHeight: 22,
  },
});
