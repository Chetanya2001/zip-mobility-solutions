import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BORDER_RADIUS,
  COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  SPACING,
} from "../../../constants/theme";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = [
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

const formatPrice = (price: number | string) => {
  const n = Number(price);
  if (!n) return "Custom Quote";
  return `₹${n.toLocaleString("en-IN")}`;
};

const formatScheduled = (iso: string) => {
  const d = new Date(iso);
  const day = DAY_LABELS[d.getDay()];
  const date = d.getDate();
  const month = MONTH_LABELS[d.getMonth()];
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const meridiem = hours >= 12 ? "PM" : "AM";
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${day}, ${date} ${month} · ${h}:${minutes} ${meridiem}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Animated checkmark circle
// ─────────────────────────────────────────────────────────────────────────────
function SuccessIcon() {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Main icon pop-in
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
      delay: 100,
    }).start();
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
      delay: 100,
    }).start();
    // Ripple ring
    Animated.loop(
      Animated.parallel([
        Animated.timing(ring, {
          toValue: 1.6,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <View style={si.wrapper}>
      {/* Ripple */}
      <Animated.View
        style={[
          si.ring,
          { transform: [{ scale: ring }], opacity: ringOpacity },
        ]}
      />
      {/* Icon */}
      <Animated.View style={[si.circle, { transform: [{ scale }], opacity }]}>
        <Ionicons name="checkmark" size={46} color="#fff" />
      </Animated.View>
    </View>
  );
}

const si = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 120,
    marginBottom: SPACING.lg,
  },
  ring: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ServiceBookingSuccessScreen({
  route,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();

  const booking = route.params?.booking;
  const car = route.params?.car;
  const plan = route.params?.plan;
  const scheduled_at: string =
    route.params?.scheduled_at ?? booking?.scheduled_at;

  const carLabel =
    [car?.make, car?.model].filter(Boolean).join(" ") || "My Car";
  const templates = plan?.templates ?? plan?.ChecklistTemplates ?? [];

  // Slide-up animation for the card
  const slideY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, {
        toValue: 0,
        duration: 400,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 400,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + SPACING.xxl,
            paddingBottom: insets.bottom + 120,
          },
        ]}
      >
        {/* ── Success icon + heading ── */}
        <SuccessIcon />
        <Text style={styles.heading}>Booking Confirmed!</Text>
        <Text style={styles.subheading}>
          Your service appointment has been scheduled.{"\n"}We'll see you soon!
        </Text>

        {/* ── Booking ID pill ── */}
        {booking?.id && (
          <View style={styles.idPill}>
            <Text style={styles.idPillText}>
              Booking ID #ZD{String(booking.id).padStart(5, "0")}
            </Text>
          </View>
        )}

        {/* ── Main detail card ── */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ translateY: slideY }], opacity: cardOpacity },
          ]}
        >
          {/* Car row */}
          <View style={styles.cardRow}>
            {car?.thumbnail ? (
              <Image
                source={{ uri: car.thumbnail }}
                style={styles.carImg}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.carImgFallback}>
                <Ionicons
                  name="car-outline"
                  size={26}
                  color={COLORS.textSecondary}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>VEHICLE</Text>
              <Text style={styles.cardValue} numberOfLines={1}>
                {carLabel}
              </Text>
              {car?.rc_number && (
                <Text style={styles.cardSub}>{car.rc_number}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Plan + price row */}
          <View style={styles.cardRowSpread}>
            <View>
              <Text style={styles.cardLabel}>SERVICE PLAN</Text>
              <Text style={styles.cardValue}>{plan?.name ?? "—"}</Text>
              {Number(plan?.duration_minutes) > 0 && (
                <Text style={styles.cardSub}>
                  ~{plan.duration_minutes} mins
                </Text>
              )}
            </View>
            <Text style={styles.priceText}>{formatPrice(plan?.price)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Date/time row */}
          <View style={styles.cardRowIcon}>
            <View style={styles.iconBox}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
            </View>
            <View>
              <Text style={styles.cardLabel}>SCHEDULED FOR</Text>
              <Text style={styles.cardValue}>
                {formatScheduled(scheduled_at)}
              </Text>
            </View>
          </View>

          {/* Status row */}
          <View style={styles.divider} />
          <View style={styles.cardRowIcon}>
            <View style={styles.iconBox}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>STATUS</Text>
              <View style={styles.statusChip}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {booking?.status
                    ? booking.status.charAt(0).toUpperCase() +
                      booking.status.slice(1)
                    : "Scheduled"}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── What's included ── */}
        {templates.length > 0 && (
          <Animated.View
            style={[
              styles.includesCard,
              { transform: [{ translateY: slideY }], opacity: cardOpacity },
            ]}
          >
            <Text style={styles.includesTitle}>What's Included</Text>
            {templates.map((t: any) => (
              <View key={t.id} style={styles.includesRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={COLORS.primary}
                />
                <Text style={styles.includesText}>{t.title}</Text>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Footer buttons ── */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "Home" }] })
          }
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { alignItems: "center", paddingHorizontal: SPACING.xl },

  heading: {
    fontSize: 26,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  subheading: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },

  idPill: {
    backgroundColor: COLORS.primary + "18",
    borderRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  idPillText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.6,
  },

  card: {
    width: "100%",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  cardRowSpread: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardRowIcon: { flexDirection: "row", alignItems: "center", gap: SPACING.md },

  carImg: {
    width: 72,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  carImgFallback: {
    width: 72,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },

  cardLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  cardValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  cardSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  priceText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  includesCard: {
    width: "100%",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  includesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  includesRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  includesText: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },

  guaranteeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    width: "100%",
  },
  guaranteeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: "center",
  },
  primaryBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
  secondaryBtn: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  secondaryBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
});
