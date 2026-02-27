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
import { drawerService } from "../drawer.service"; // adjust path

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

export default function PaymentHistoryScreen() {
  const insets = useSafeAreaInsets();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.error("Payment fetch error:", err);
      setError(err.message || "Failed to load payment history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return (
      date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }) +
      " • " +
      date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    );
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUCCESS":
        return COLORS.success || "#4CAF50";
      case "FAILED":
        return COLORS.error || "#F44336";
      default:
        return COLORS.textSecondary;
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.bookingType}>
            {item.booking.type.replace("_", " ")}
          </Text>
          <Text style={styles.dateText}>{formatDate(item.paid_at)}</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "30" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Amount Paid</Text>
        <Text style={styles.amountValue}>
          ₹{item.amount.toLocaleString("en-IN")}
        </Text>
      </View>

      <View style={styles.methodRow}>
        <Text style={styles.methodText}>
          via {item.method === "ZERO_RS" ? "Zero Payment" : "Razorpay"}
        </Text>
        {item.razorpay_payment_id && (
          <Text style={styles.paymentId}>
            #{item.razorpay_payment_id.slice(-8)}
          </Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.bookingInfo}>
        <Text style={styles.bookingLabel}>Booking ID: {item.booking.id}</Text>
        <Text style={styles.totalText}>
          Total: ₹{item.booking.total.toLocaleString("en-IN")}
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="card-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Payments Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your completed payments will appear here
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.headerTitle}>Payment History</Text>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchPayments()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPaymentItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPayments(true)}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl * 2,
  },

  paymentCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
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
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },

  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  amountLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  amountValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  methodText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  paymentId: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  bookingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  totalText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  errorText: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.md,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
});
