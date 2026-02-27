import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../../store/auth.store";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface UserCar {
  car_id: number;
  make: string | null;
  model: string | null;
  year: number;
  rc_number: string | null;
  thumbnail: string | null;
}

interface ChecklistTemplate {
  id: number;
  title: string;
  plan_id: number;
}

interface ServicePlan {
  id: number;
  name: string;
  code: string;
  price: number | string;
  duration_minutes: number;
  description: string;
  templates?: ChecklistTemplate[];
  ChecklistTemplates?: ChecklistTemplate[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "https://zipdrive.in/api";

const apiCreateBooking = async (
  token: string,
  payload: {
    car_id: number;
    plan_id: number;
    scheduled_at: string;
  },
) => {
  const res = await fetch(`${BASE_URL}/service/book`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Booking failed");
  }
  return res.json();
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const formatPrice = (price: number | string) => {
  const n = Number(price);
  if (!n) return "Custom Quote";
  return `₹${n.toLocaleString("en-IN")}`;
};

const PLAN_ICON: Record<string, string> = {
  zip_express: "flash-outline",
  zip_classic: "shield-checkmark-outline",
  zip_repair: "construct-outline",
  zip_equip: "hardware-chip-outline",
};

// ── Date slot helpers ──────────────────────────────────────────────────────
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

const getNextDays = (count: number): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
};

const TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
];

const parseTimeSlot = (slot: string, date: Date): Date => {
  const [time, meridiem] = slot.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function ServiceBookingConfirmScreen({
  route,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();

  const car: UserCar = route.params?.car;
  const plan: ServicePlan = route.params?.plan;

  const days = getNextDays(7);
  const [selectedDay, setSelectedDay] = useState<Date>(days[0]);
  const [selectedTime, setSelectedTime] = useState<string>(TIME_SLOTS[1]);
  const [booking, setBooking] = useState(false);

  const checklist: ChecklistTemplate[] =
    plan?.templates ?? plan?.ChecklistTemplates ?? [];

  const carLabel =
    [car?.make, car?.model].filter(Boolean).join(" ") || "My Car";
  const priceNum = Number(plan?.price);
  const icon = PLAN_ICON[plan?.code] ?? "star-outline";

  if (!car || !plan) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Missing booking details.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBook = async () => {
    if (!token) {
      Alert.alert("Session expired", "Please log in again.");
      return;
    }
    setBooking(true);
    try {
      const scheduledAt = parseTimeSlot(selectedTime, selectedDay);
      const result = await apiCreateBooking(token, {
        car_id: car.car_id,
        plan_id: plan.id,
        scheduled_at: scheduledAt.toISOString(),
      });

      navigation.replace("ServiceBookingSuccess", {
        booking: result.booking ?? result,
        car,
        plan,
        scheduled_at: scheduledAt.toISOString(),
      });
    } catch (err: any) {
      Alert.alert("Booking Failed", err.message ?? "Please try again.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
      >
        {/* ── Car + Plan Summary Card ── */}
        <View style={styles.summaryCard}>
          {/* Car row */}
          <View style={styles.summaryCarRow}>
            {car.thumbnail ? (
              <Image
                source={{ uri: car.thumbnail }}
                style={styles.summaryCarImg}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.summaryCarImgFallback}>
                <Ionicons
                  name="car-outline"
                  size={30}
                  color={COLORS.textSecondary}
                />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryCarLabel}>SELECTED CAR</Text>
              <Text style={styles.summaryCarName} numberOfLines={1}>
                {carLabel}
              </Text>
              {car.rc_number ? (
                <Text style={styles.summaryCarPlate}>{car.rc_number}</Text>
              ) : (
                <Text style={styles.summaryCarPlate}>{car.year}</Text>
              )}
            </View>
            {/* Change car */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.changeBtn}
            >
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Plan row */}
          <View style={styles.summaryPlanRow}>
            <View style={styles.planIconBox}>
              <Ionicons name={icon as any} size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryPlanLabel}>SERVICE PLAN</Text>
              <Text style={styles.summaryPlanName}>{plan.name}</Text>
              {Number(plan.duration_minutes) > 0 && (
                <Text style={styles.summaryPlanDur}>
                  ~{plan.duration_minutes} mins
                </Text>
              )}
            </View>
            <Text style={styles.summaryPlanPrice}>
              {formatPrice(plan.price)}
            </Text>
          </View>
        </View>

        {/* ── What's Included ── */}
        {checklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            <View style={styles.checklistGrid}>
              {checklist.map((item) => (
                <View key={item.id} style={styles.checklistChip}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.checklistChipText}>{item.title}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── Pick a Date ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysRow}
          >
            {days.map((day, i) => {
              const isSelected =
                day.toDateString() === selectedDay.toDateString();
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => setSelectedDay(day)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      isSelected && styles.dayLabelSelected,
                    ]}
                  >
                    {DAY_LABELS[day.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.dayNumber,
                      isSelected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                  <Text
                    style={[
                      styles.dayMonth,
                      isSelected && styles.dayMonthSelected,
                    ]}
                  >
                    {MONTH_LABELS[day.getMonth()]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Pick a Time ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pick a Time</Text>
          <View style={styles.timeSlotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = slot === selectedTime;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlot,
                    isSelected && styles.timeSlotSelected,
                  ]}
                  onPress={() => setSelectedTime(slot)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isSelected && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Booking Summary ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Service Plan</Text>
              <Text style={styles.billValue}>{plan.name}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Scheduled</Text>
              <Text style={styles.billValue}>
                {DAY_LABELS[selectedDay.getDay()]}, {selectedDay.getDate()}{" "}
                {MONTH_LABELS[selectedDay.getMonth()]}
                {"  "}
                {selectedTime}
              </Text>
            </View>
            {Number(plan.duration_minutes) > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Duration</Text>
                <Text style={styles.billValue}>
                  ~{plan.duration_minutes} mins
                </Text>
              </View>
            )}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.billTotal}>Total</Text>
              <Text style={styles.billTotalValue}>
                {priceNum > 0 ? formatPrice(plan.price) : "Custom Quote"}
              </Text>
            </View>
            {priceNum > 0 && (
              <Text style={styles.billNote}>* Inc. all taxes</Text>
            )}
          </View>
        </View>

        {/* ── Guarantee Note ── */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.guaranteeTitle}>Service Guarantee</Text>
            <Text style={styles.guaranteeSub}>
              1000 km or 1 month warranty on all services
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── Footer CTA ── */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        {/* selected date+time reminder */}
        <View style={styles.footerMeta}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
          <Text style={styles.footerMetaText}>
            {DAY_LABELS[selectedDay.getDay()]}, {selectedDay.getDate()}{" "}
            {MONTH_LABELS[selectedDay.getMonth()]} · {selectedTime}
          </Text>
          <Text style={styles.footerMetaPrice}>
            {priceNum > 0 ? formatPrice(plan.price) : "Custom"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.bookBtn, booking && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={booking}
          activeOpacity={0.88}
        >
          {booking ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <Text style={styles.bookBtnText}>Book Appointment</Text>
          )}
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
  center: { alignItems: "center", justifyContent: "center", gap: SPACING.md },
  errorText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
  linkText: { color: COLORS.primary, fontSize: FONT_SIZES.md },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  scroll: { padding: SPACING.xl },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  summaryCarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCarImg: {
    width: 72,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  summaryCarImgFallback: {
    width: 72,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCarLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryCarName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summaryCarPlate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  changeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changeBtnText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },

  summaryPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  planIconBox: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  summaryPlanLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  summaryPlanName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  summaryPlanDur: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  summaryPlanPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },

  // Section
  section: { marginBottom: SPACING.xxl },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },

  // Checklist grid
  checklistGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  checklistChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  checklistChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
  },

  // Day picker
  daysRow: { gap: SPACING.sm, paddingRight: SPACING.md },
  dayCard: {
    width: 64,
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  dayCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "18",
  },
  dayLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  dayLabelSelected: { color: COLORS.primary },
  dayNumber: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  dayNumberSelected: { color: COLORS.primary },
  dayMonth: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  dayMonthSelected: { color: COLORS.primary },

  // Time slots
  timeSlotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  timeSlot: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
  },
  timeSlotSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "18",
  },
  timeSlotText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  timeSlotTextSelected: { color: COLORS.primary },

  // Bill card
  billCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  billLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    flex: 1,
    textAlign: "right",
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },
  billTotal: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  billTotalValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  billNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: -SPACING.xs,
  },

  // Guarantee
  guaranteeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  guaranteeTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  guaranteeSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Footer
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
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  footerMetaText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  footerMetaPrice: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  bookBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtnDisabled: { opacity: 0.55 },
  bookBtnText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
    letterSpacing: 0.3,
  },
});
