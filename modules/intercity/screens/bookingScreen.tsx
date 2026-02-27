import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../../store/auth.store";
import { documentService } from "../../../common/document/document.service";
import AuthModal from "../../auth/modals/authModal";
import DocumentUploadModal from "../../../common/document/modals/documentUploadModal";
import {
  API_CONFIG,
  API_ENDPOINTS,
  getHeaders,
} from "../../../config/api.config";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";

// ─── Constants ────────────────────────────────────────────────────────────────
const GST_RATE = 0.18;
const DEFAULT_INSURANCE_PER_KM = 1.5;

// ─── Types ────────────────────────────────────────────────────────────────────
// NOTE: dropDateTime intentionally removed — backend calculates drop_datetime
//       from distance_km (speed: 60 km/hr, min 2h buffer) in booking.service.js
interface IntercityBookingParams {
  carId: number;
  carMake: string;
  carModel: string;
  carYear?: number;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
    city: string;
  };
  dropLocation: {
    address: string;
    lat: number;
    lng: number;
    city: string;
  };
  dropCity?: string;
  tripDistanceKm: number;
  pricePerKm: number;
  pax: number;
  luggage: number;
  insureTrip?: boolean;
  pickupDateTime: string; // "YYYY-MM-DDTHH:mm" — parsed as IST by backend moment-timezone
}

// ─── Booking API call ─────────────────────────────────────────────────────────
// Exactly mirrors backend bookIntercity controller's req.body destructuring:
//   car_id, total_amount, pickup_address, pickup_lat, pickup_long,
//   drop_address, drop_lat, drop_long, pax, luggage,
//   distance_km, driver_amount, pickup_datetime
// drop_datetime is NOT sent — backend computes it from distance_km
async function bookCarIntercity(
  data: {
    car_id: number;
    total_amount: number;
    pickup_address: string;
    pickup_lat: number;
    pickup_long: number; // backend uses pickup_long, not pickup_lng
    drop_address: string;
    drop_lat: number;
    drop_long: number; // backend uses drop_long, not drop_lng
    pax: number;
    luggage: number;
    distance_km: number;
    driver_amount: number; // insurance cost passed as driver_amount
    pickup_datetime: string; // "YYYY-MM-DDTHH:mm" parsed as IST on backend
  },
  token: string,
): Promise<{ message: string; booking: any; intercity: any }> {
  const url = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.INTERCITY_CAR_BOOK}`;
  console.log("[INTERCITY BOOK] URL:", url);
  console.log("[INTERCITY BOOK] Payload:", JSON.stringify(data, null, 2));

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(data),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Intercity booking failed");
  }

  return json;
}

// ─── Pricing Hook ─────────────────────────────────────────────────────────────
function useIntercityPricing(
  tripKm: number,
  pricePerKm: number,
  insureTrip: boolean,
  insurancePerKm = DEFAULT_INSURANCE_PER_KM,
) {
  return useMemo(() => {
    const baseFare = Math.round(tripKm * pricePerKm);
    const insurance = insureTrip ? Math.round(tripKm * insurancePerKm) : 0;
    const subTotal = baseFare + insurance;
    const gst = Math.round(subTotal * GST_RATE);
    const total = subTotal + gst;
    return { baseFare, insurance, gst, total };
  }, [tripKm, pricePerKm, insureTrip, insurancePerKm]);
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IntercityBookingSummaryScreen({
  route,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();

  const params: IntercityBookingParams = route?.params ?? {};
  const {
    carId,
    carMake = "—",
    carModel = "—",
    carYear,
    pickupLocation,
    dropLocation,
    dropCity,
    tripDistanceKm = 0,
    pricePerKm = 0,
    pax = 1,
    luggage = 0,
    pickupDateTime, // "YYYY-MM-DDTHH:mm" sent as-is; backend parses as IST
  } = params;

  // ── Local state ───────────────────────────────────────────────────────────
  const [insureTrip, setInsureTrip] = useState(params.insureTrip ?? true);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  // ── Pricing ───────────────────────────────────────────────────────────────
  const pricing = useIntercityPricing(tripDistanceKm, pricePerKm, insureTrip);

  // ── Eligibility check ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user && token) {
      checkEligibility();
    } else {
      setIsEligible(null);
      setEligibilityReason("");
    }
  }, [isAuthenticated, user, token]);

  const checkEligibility = async () => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) return;

    setCheckingEligibility(true);
    try {
      const result =
        await documentService.checkBookingEligibility(currentToken);
      const eligible =
        result.isEligible || result.all_documents_verified || false;
      setIsEligible(eligible);
      if (!eligible) {
        setEligibilityReason(
          result.reason ||
            (result.documents_count === 0
              ? "No documents uploaded"
              : !result.user_verified
                ? "User not verified"
                : "Some documents pending verification"),
        );
      } else {
        setEligibilityReason("");
      }
    } catch (error: any) {
      setIsEligible(false);
      setEligibilityReason(error.message || "Failed to check eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  // ── Auth / doc callbacks ──────────────────────────────────────────────────
  const handleAuthSuccess = (userData: any, authToken: string) => {
    useAuthStore.getState().setAuthData(userData, authToken);
    setShowAuthModal(false);
    setTimeout(() => checkEligibility(), 500);
  };

  const handleDocumentUploadSuccess = () => checkEligibility();

  // ── Pay button gate ───────────────────────────────────────────────────────
  const handlePayNowClick = () => {
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }
    if (isEligible === false || isEligible === null) {
      Alert.alert(
        "KYC/Documents Required",
        "Please upload and verify your documents before booking.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload Documents",
            onPress: () => setShowDocumentModal(true),
          },
        ],
      );
      return;
    }
    if (!agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the terms & conditions.");
      return;
    }
    handleConfirmBooking();
  };

  // ── Booking ───────────────────────────────────────────────────────────────
  const handleConfirmBooking = async () => {
    const currentToken = useAuthStore.getState().token;
    if (!currentToken) {
      Alert.alert("Error", "Missing auth token.");
      return;
    }

    if (!pickupDateTime) {
      Alert.alert("Error", "Pickup date and time are required.");
      return;
    }

    setProcessing(true);
    try {
      // Payload aligned exactly with backend bookIntercity controller:
      //
      //   pickup_long  ← pickupLocation.lng  (backend field is pickup_long)
      //   drop_long    ← dropLocation.lng    (backend field is drop_long)
      //   driver_amount ← pricing.insurance  (insurance passed as driver_amount)
      //   pickup_datetime ← "YYYY-MM-DDTHH:mm" (moment-timezone parses as IST)
      //
      //   drop_datetime NOT sent — backend calculates from distance_km
      //   payment_mode NOT sent — backend hardcodes ZERO_RS via ZERO_RS payment method
      await bookCarIntercity(
        {
          car_id: carId,
          total_amount: pricing.total,

          pickup_address: pickupLocation.address,
          pickup_lat: pickupLocation.lat,
          pickup_long: pickupLocation.lng,

          drop_address: dropLocation.address,
          drop_lat: dropLocation.lat,
          drop_long: dropLocation.lng,

          pax,
          luggage,
          distance_km: tripDistanceKm,
          driver_amount: pricing.insurance,

          pickup_datetime: pickupDateTime,
        },
        currentToken,
      );

      setIsBooked(true);
      Alert.alert(
        "Booking Confirmed! 🎉",
        `Your intercity trip from ${pickupLocation?.city} to ${
          dropCity || dropLocation?.city
        } has been booked.\n\nPay ₹${pricing.total} at car pickup.`,
        [
          {
            text: "View My Bookings",
            onPress: () => navigation.navigate("MyBookings" as never),
          },
          {
            text: "Go Home",
            onPress: () => navigation.navigate("Home" as never),
            style: "cancel",
          },
        ],
      );
    } catch (error: any) {
      console.error("❌ [INTERCITY BOOKING] Failed:", error);
      Alert.alert(
        "Booking Failed",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }],
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Button state ──────────────────────────────────────────────────────────
  const getButtonState = () => {
    if (!isAuthenticated) return "login";
    if (checkingEligibility) return "checking";
    if (isEligible !== true) return "kyc";
    if (!agreedToTerms) return "disabled";
    if (processing) return "processing";
    if (isBooked) return "booked";
    return "ready";
  };
  const buttonState = getButtonState();

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!carId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ color: COLORS.textSecondary }}>
          No booking data found.
        </Text>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.routeHeader}>
            <Ionicons name="location" size={14} color={COLORS.primary} />
            <Text style={styles.routeText} numberOfLines={1}>
              {pickupLocation?.city || "Pickup"}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={COLORS.textSecondary}
            />
            <Ionicons name="flag" size={14} color={COLORS.primary} />
            <Text style={styles.routeText} numberOfLines={1}>
              {dropCity || dropLocation?.city || "Drop"}
            </Text>
          </View>
        </View>
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + SPACING.xxxl + 60,
        }}
      >
        {/* ── Title ── */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Intercity Booking</Text>
          <Text style={styles.subtitle}>
            Review your trip details before confirming
          </Text>
        </View>

        {/* ── Car Details Card ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name="car-sport-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Selected Vehicle</Text>
          </View>
          <Text style={styles.carBrand}>{carMake}</Text>
          <Text style={styles.carName}>
            {carModel} {carYear ? `(${carYear})` : ""}
          </Text>
        </View>

        {/* ── Trip Route Card ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="map-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Trip Route</Text>
          </View>

          <View style={styles.routeVisual}>
            {/* Pickup */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotStart]} />
              <View style={styles.routePointText}>
                <Text style={styles.routeLabel}>PICKUP</Text>
                <Text style={styles.routeCity}>
                  {pickupLocation?.city || "—"}
                </Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {pickupLocation?.address || "—"}
                </Text>
              </View>
            </View>

            {/* Distance connector */}
            <View style={styles.routeLine}>
              <View style={styles.routeLineInner} />
              <View style={styles.routeDistanceBadge}>
                <Ionicons
                  name="navigate-outline"
                  size={12}
                  color={COLORS.primary}
                />
                <Text style={styles.routeDistanceText}>
                  {tripDistanceKm} km
                </Text>
              </View>
            </View>

            {/* Drop */}
            <View style={styles.routePoint}>
              <View style={[styles.routeDot, styles.routeDotEnd]} />
              <View style={styles.routePointText}>
                <Text style={styles.routeLabel}>DROP</Text>
                <Text style={styles.routeCity}>
                  {dropCity || dropLocation?.city || "—"}
                </Text>
                <Text style={styles.routeAddress} numberOfLines={1}>
                  {dropLocation?.address || "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Pickup datetime display */}
          {!!pickupDateTime && (
            <View style={styles.pickupDateRow}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textSecondary}
              />
              <Text style={styles.pickupDateText}>
                Pickup:{" "}
                {new Date(pickupDateTime).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* ── Passenger & Luggage Card ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Passengers & Luggage</Text>
          </View>
          <View style={styles.paxRow}>
            <View style={styles.paxItem}>
              <Ionicons name="people" size={24} color={COLORS.primary} />
              <Text style={styles.paxValue}>{pax}</Text>
              <Text style={styles.paxLabel}>Passengers</Text>
            </View>
            <View style={styles.paxDivider} />
            <View style={styles.paxItem}>
              <Ionicons name="briefcase" size={24} color={COLORS.primary} />
              <Text style={styles.paxValue}>{luggage}</Text>
              <Text style={styles.paxLabel}>Luggage bags</Text>
            </View>
            <View style={styles.paxDivider} />
            <View style={styles.paxItem}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
              <Text style={styles.paxValue}>✓</Text>
              <Text style={styles.paxLabel}>Driver incl.</Text>
            </View>
          </View>
        </View>

        {/* ── Add-ons Card ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={COLORS.primary}
            />
            <Text style={styles.cardTitle}>Trip Add-ons</Text>
          </View>
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Trip Insurance</Text>
              <Text style={styles.optionSubtext}>
                Comprehensive coverage for ₹{DEFAULT_INSURANCE_PER_KM}/km
              </Text>
            </View>
            <Switch
              value={insureTrip}
              onValueChange={setInsureTrip}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={insureTrip ? COLORS.background : COLORS.textSecondary}
            />
          </View>
        </View>

        {/* ── Fare Breakdown Card ── */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Fare Breakdown</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Base Fare (₹{pricePerKm}/km × {tripDistanceKm} km)
            </Text>
            <Text style={styles.priceValue}>₹{pricing.baseFare}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              Insurance {insureTrip ? `(₹${DEFAULT_INSURANCE_PER_KM}/km)` : ""}
            </Text>
            <Text
              style={[styles.priceValue, !insureTrip && styles.priceValueMuted]}
            >
              {insureTrip ? `₹${pricing.insurance}` : "Not added"}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST (18%)</Text>
            <Text style={styles.priceValue}>₹{pricing.gst}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
            <Text style={styles.totalValue}>₹{pricing.total}</Text>
          </View>

          {/* Pay ₹0 now callout */}
          <View style={styles.paymentNote}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={COLORS.primary}
            />
            <Text style={styles.paymentNoteText}>
              Pay only <Text style={styles.paymentHighlight}>₹0 now</Text> to
              confirm. Balance{" "}
              <Text style={styles.paymentHighlight}>₹{pricing.total}</Text> is
              payable at car pickup. GST included.
            </Text>
          </View>

          {/* Terms */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.8}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color={COLORS.background}
                />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.termsLink}>terms & conditions</Text> and
              cancellation policy.
            </Text>
          </TouchableOpacity>

          {/* CTA Button */}
          <TouchableOpacity
            style={[
              styles.payButton,
              (buttonState === "disabled" ||
                buttonState === "checking" ||
                buttonState === "booked") &&
                styles.payButtonDisabled,
            ]}
            onPress={handlePayNowClick}
            disabled={
              buttonState === "disabled" ||
              buttonState === "checking" ||
              buttonState === "booked"
            }
            activeOpacity={0.85}
          >
            {buttonState === "checking" || buttonState === "processing" ? (
              <>
                <ActivityIndicator size="small" color={COLORS.background} />
                <Text style={styles.payButtonText}>
                  {buttonState === "checking" ? "Checking..." : "Processing..."}
                </Text>
              </>
            ) : buttonState === "login" ? (
              <Text style={styles.payButtonText}>Login to Continue</Text>
            ) : buttonState === "kyc" ? (
              <Text style={styles.payButtonText}>Upload KYC Documents</Text>
            ) : buttonState === "booked" ? (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={COLORS.background}
                />
                <Text style={styles.payButtonText}>Booking Confirmed</Text>
              </>
            ) : (
              <Text style={styles.payButtonText}>CONFIRM & PAY ₹0 NOW</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Verification Status Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Verification Status</Text>

          <View style={styles.checkDetail}>
            <View style={styles.checkIcon}>
              <Ionicons name="location" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkLabel}>CAR PICKUP LOCATION</Text>
              <Text style={styles.checkValue}>
                {pickupLocation?.city || "Not set"}
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={COLORS.primary}
            />
          </View>

          <View style={[styles.checkDetail, { borderBottomWidth: 0 }]}>
            <View style={styles.checkIcon}>
              <Ionicons
                name="document-text"
                size={22}
                color={
                  !isAuthenticated
                    ? COLORS.textSecondary
                    : checkingEligibility
                      ? COLORS.textSecondary
                      : isEligible
                        ? COLORS.primary
                        : COLORS.error
                }
              />
            </View>
            <View style={styles.checkContent}>
              {!isAuthenticated ? (
                <>
                  <Text
                    style={[styles.checkValue, { color: COLORS.textSecondary }]}
                  >
                    Login required to verify documents
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => setShowAuthModal(true)}
                  >
                    <Ionicons
                      name="log-in-outline"
                      size={14}
                      color={COLORS.background}
                    />
                    <Text style={styles.uploadButtonText}>Login Now</Text>
                  </TouchableOpacity>
                </>
              ) : checkingEligibility ? (
                <Text style={styles.checkValue}>Checking KYC status...</Text>
              ) : isEligible ? (
                <Text style={[styles.checkValue, { color: COLORS.primary }]}>
                  ✓ Documents Verified
                </Text>
              ) : (
                <>
                  <Text style={[styles.checkValue, { color: COLORS.error }]}>
                    ✗ KYC / Documents Not Verified
                  </Text>
                  {eligibilityReason ? (
                    <Text style={styles.checkLabel}>
                      Reason: {eligibilityReason}
                    </Text>
                  ) : null}
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => setShowDocumentModal(true)}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={14}
                      color={COLORS.background}
                    />
                    <Text style={styles.uploadButtonText}>
                      Upload Documents
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <Ionicons
              name={
                !isAuthenticated
                  ? "alert-circle-outline"
                  : checkingEligibility
                    ? "time-outline"
                    : isEligible
                      ? "checkmark-circle"
                      : "close-circle"
              }
              size={22}
              color={
                !isAuthenticated
                  ? COLORS.textSecondary
                  : checkingEligibility
                    ? COLORS.textSecondary
                    : isEligible
                      ? COLORS.primary
                      : COLORS.error
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* ── Modals ── */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      {isAuthenticated && token && (
        <DocumentUploadModal
          visible={showDocumentModal}
          onClose={() => setShowDocumentModal(false)}
          onSuccess={handleDocumentUploadSuccess}
          token={token}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  routeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  routeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    maxWidth: 80,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: { flex: 1 },
  titleSection: { padding: SPACING.lg, paddingBottom: SPACING.sm },
  title: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  carBrand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  carName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginTop: SPACING.xs / 2,
  },
  routeVisual: { marginTop: SPACING.sm },
  routePoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  routeDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  routeDotStart: { backgroundColor: COLORS.primary },
  routeDotEnd: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
  },
  routePointText: { flex: 1 },
  routeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.8,
  },
  routeCity: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  routeAddress: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 5,
    marginVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  routeLineInner: { width: 2, height: 32, backgroundColor: COLORS.border },
  routeDistanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  routeDistanceText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  pickupDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pickupDateText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  paxRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  paxItem: { alignItems: "center", gap: SPACING.xs / 2 },
  paxValue: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  paxLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  paxDivider: { width: 1, height: 40, backgroundColor: COLORS.border },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  optionInfo: { flex: 1, marginRight: SPACING.md },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs / 2,
  },
  optionSubtext: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  priceLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  priceValueMuted: { color: COLORS.textSecondary, fontStyle: "italic" },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  totalLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  totalValue: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  paymentNote: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    flexDirection: "row",
    gap: SPACING.xs,
    alignItems: "flex-start",
  },
  paymentNoteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  paymentHighlight: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.bold },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  termsLink: { color: COLORS.primary, textDecorationLine: "underline" },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  payButtonDisabled: { opacity: 0.6 },
  payButtonText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  checkDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  checkIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  checkContent: { flex: 1 },
  checkLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  checkValue: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  uploadButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  uploadButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  error: { color: COLORS.error },
});
