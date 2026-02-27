import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
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
import { drawerService } from "../../drawer/drawer.service"; // adjust path if needed
import { useAuthStore } from "../../../store/auth.store";

interface Payment {
  id: number;
  amount: number;
  currency: string;
  method: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  paid_at: string;
  booking: {
    id: number;
    type: string;
    total: number;
    paid: number;
    booking_status: string;
    car: any | null;
  };
}

type FilterTab = "all" | "paid" | "pending";

const FILTER_OPTIONS: { label: string; value: FilterTab }[] = [
  { label: "ALL", value: "all" },
  { label: "PAID", value: "paid" },
  { label: "PENDING", value: "pending" },
];

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return (
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }) +
    " · " +
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  );
};

const getStatusMeta = (
  status: string,
): { color: string; label: string; icon: string } => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return {
        color: COLORS.success ?? "#01d28e",
        label: "PAID",
        icon: "checkmark-circle",
      };
    case "FAILED":
      return {
        color: COLORS.error ?? "#EF4444",
        label: "FAILED",
        icon: "close-circle",
      };
    case "PENDING":
      return { color: "#F59E0B", label: "PENDING", icon: "time" };
    default:
      return {
        color: COLORS.textSecondary,
        label: status?.toUpperCase() ?? "—",
        icon: "ellipse",
      };
  }
};

// Booking types that belong to the guest side — never earnings for host
const GUEST_BOOKING_TYPES = ["SELF_DRIVE", "INTERCITY"];

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);

  // role="host" means they have a host account; role="guest" means pure guest
  const isHostAccount = user?.role === "host";

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const fetchPayments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await drawerService.getMyPayments();
      if (response?.success && Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setError("No payment data received");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load earnings");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  // Strip payments user made as a guest (self-drive / intercity rentals they paid for)
  const hostPayments = isHostAccount
    ? payments.filter(
        (p) => !GUEST_BOOKING_TYPES.includes(p.booking.type?.toUpperCase()),
      )
    : [];

  const totalEarned = hostPayments
    .filter((p) => p.status?.toUpperCase() === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = hostPayments
    .filter((p) => p.status?.toUpperCase() === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const visiblePayments = hostPayments.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "paid") return p.status?.toUpperCase() === "SUCCESS";
    if (activeFilter === "pending")
      return p.status?.toUpperCase() === "PENDING";
    return true;
  });

  // ── Summary cards ─────────────────────────────────────────────────────────
  const renderSummary = () => (
    <View style={styles.summaryRow}>
      <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="trending-up" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.summaryLabel}>Total Earned</Text>
        <Text style={styles.summaryValue}>
          ₹{totalEarned.toLocaleString("en-IN")}
        </Text>
      </View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="time-outline" size={18} color="#F59E0B" />
        </View>
        <Text style={styles.summaryLabel}>Pending</Text>
        <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>
          ₹{totalPending.toLocaleString("en-IN")}
        </Text>
      </View>
    </View>
  );

  // ── Payment card ──────────────────────────────────────────────────────────
  const renderPaymentItem = ({ item }: { item: Payment }) => {
    const meta = getStatusMeta(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {/* Left: type + date */}
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingType}>
              {item.booking.type.replace(/_/g, " ")}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.paid_at)}</Text>
          </View>
          {/* Right: amount + status */}
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>
              ₹{item.amount.toLocaleString("en-IN")}
            </Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: meta.color + "22" },
              ]}
            >
              <Ionicons name={meta.icon as any} size={11} color={meta.color} />
              <Text style={[styles.statusText, { color: meta.color }]}>
                {meta.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <Text style={styles.metaText}>Booking #{item.booking.id}</Text>
          <Text style={styles.metaText}>
            via{" "}
            <Text style={styles.metaHighlight}>
              {item.method === "ZERO_RS" ? "Zero Payment" : "Razorpay"}
            </Text>
          </Text>
          {item.razorpay_payment_id && (
            <Text style={styles.paymentId}>
              #{item.razorpay_payment_id.slice(-8)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (!isHostAccount) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.becomeHostIcon}>
            <Ionicons name="star-outline" size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>You're not a host yet</Text>
          <Text style={styles.emptySub}>
            Earnings are only available for host accounts.Register as a host to
            start listing your car and earning money.
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="wallet-outline"
          size={72}
          color={COLORS.textSecondary}
        />
        <Text style={styles.emptyTitle}>
          No {activeFilter === "all" ? "" : activeFilter} earnings
        </Text>
        <Text style={styles.emptySub}>
          {activeFilter === "pending"
            ? "You have no pending payments"
            : activeFilter === "paid"
              ? "No payments received yet"
              : "Your earnings will appear here"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <View>
          <Text style={styles.headerTitle}>Earnings</Text>
          <View style={styles.rolePill}>
            <Ionicons name="home-outline" size={11} color={COLORS.primary} />
            <Text style={styles.rolePillText}>Host view</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchPayments(true)}>
          <Ionicons
            name="refresh-outline"
            size={24}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading earnings...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color={COLORS.error}
          />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchPayments()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visiblePayments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          ListHeaderComponent={
            <>
              {/* Summary */}
              {renderSummary()}

              {/* Filter tabs */}
              <View style={styles.filterRow}>
                {FILTER_OPTIONS.map(({ label, value }) => {
                  const isActive = activeFilter === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.filterBtn,
                        isActive && styles.filterBtnActive,
                      ]}
                      onPress={() => setActiveFilter(value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.filterText,
                          isActive && styles.filterTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          }
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPayments(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + SPACING.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  summaryCardPrimary: {
    borderColor: COLORS.primary + "40",
    backgroundColor: COLORS.primary + "0A",
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Filters
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

  list: { paddingHorizontal: SPACING.xl },

  // Payment card
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  bookingType: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    textTransform: "capitalize",
    marginBottom: 3,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  amount: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-end",
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  metaHighlight: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  paymentId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Loading / error / empty
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  errorBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  retryText: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
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
    textTransform: "capitalize",
  },
  emptySub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  becomeHostIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "18",
    borderWidth: 2,
    borderColor: COLORS.primary + "40",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
});
