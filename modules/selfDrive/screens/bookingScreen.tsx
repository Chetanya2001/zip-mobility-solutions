import React, { useEffect, useState } from "react";
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
import { DrawerActions } from "@react-navigation/native";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useBookingStore } from "../../../store/selfDriveStore/selfDriveBooking.store";
import { useAuthStore } from "../../../store/auth.store";
import { documentService } from "../../../common/document/document.service";
import AuthModal from "../../auth/modals/authModal";
import DocumentUploadModal from "../../../common/document/modals/documentUploadModal";

export default function BookingSummaryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  // Booking store
  const {
    selectedCar,
    pickupLocation,
    pickupDateTime,
    dropoffDateTime,
    insureTrip,
    differentDropLocation,
    carCharges,
    insuranceCharges,
    pickDropCharges,
    gst,
    totalCost,
    setInsureTrip,
    setDifferentDropLocation,
    calculatePricing,
  } = useBookingStore();

  // Auth store - using separate selectors to ensure reactivity
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const createBooking = useBookingStore((s) => s.createBooking);

  console.log("🔐 [BOOKING] Auth state:", {
    isAuthenticated,
    hasUser: !!user,
    userEmail: user?.email,
    hasToken: !!token,
    tokenPreview: token?.substring(0, 20),
  });

  // Local state
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string>("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  useEffect(() => {
    calculatePricing();
  }, []);

  useEffect(() => {
    if (!selectedCar) {
      Alert.alert("No Car Selected", "Please select a car first");
      navigation.goBack();
    }
  }, [selectedCar]);

  useEffect(() => {
    console.log("🔍 [BOOKING] Auth changed, checking eligibility...");
    // Check eligibility when user is authenticated and has token
    if (isAuthenticated && user && token) {
      console.log("✅ [BOOKING] User authenticated, checking eligibility");
      checkEligibility();
    } else {
      console.log("❌ [BOOKING] Not authenticated, resetting eligibility");
      // Reset eligibility when logged out
      setIsEligible(null);
      setEligibilityReason("");
    }
  }, [isAuthenticated, user, token]);

  const checkEligibility = async () => {
    const currentToken = useAuthStore.getState().token;

    if (!currentToken) {
      console.log("❌ [ELIGIBILITY] No token in store");
      return;
    }

    setCheckingEligibility(true);

    try {
      console.log(
        "🔍 [ELIGIBILITY] Checking with token:",
        currentToken.substring(0, 20) + "...",
      );
      const result =
        await documentService.checkBookingEligibility(currentToken);
      console.log("✅ [ELIGIBILITY] Result:", result);

      // ✅ FIX: API returns 'isEligible' not 'eligible'
      // Also check 'all_documents_verified' as backup
      const eligible =
        result.isEligible || result.all_documents_verified || false;

      console.log("✅ [ELIGIBILITY] Parsed eligibility:", eligible);

      setIsEligible(eligible);

      // If not eligible, try to extract reason from response
      if (!eligible) {
        const reason =
          result.reason ||
          (result.documents_count === 0
            ? "No documents uploaded"
            : !result.user_verified
              ? "User not verified"
              : !result.all_documents_verified
                ? "Some documents pending verification"
                : "Documents not verified");
        setEligibilityReason(reason);
      } else {
        setEligibilityReason("");
      }
    } catch (error: any) {
      console.error("❌ [ELIGIBILITY] Check error:", error);
      setIsEligible(false);
      setEligibilityReason(error.message || "Failed to check eligibility");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "Not set";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDuration = () => {
    if (!pickupDateTime || !dropoffDateTime) return "—";
    const durationMs = dropoffDateTime.getTime() - pickupDateTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const handleAuthSuccess = (userData: any, authToken: string) => {
    console.log("✅ [AUTH] Auth success callback");
    console.log("✅ [AUTH] User:", userData);
    console.log("✅ [AUTH] Token:", authToken.substring(0, 20) + "...");

    // Use the new setAuthData method from the store
    useAuthStore.getState().setAuthData(userData, authToken);

    console.log("✅ [AUTH] Store updated via setAuthData");

    // Close auth modal
    setShowAuthModal(false);

    // Force a re-check of eligibility after a short delay
    setTimeout(() => {
      console.log("🔄 [AUTH] Triggering eligibility check...");
      const currentToken = useAuthStore.getState().token;
      console.log(
        "🔄 [AUTH] Current token in store:",
        currentToken?.substring(0, 20),
      );
      checkEligibility();
    }, 500);
  };

  const handleDocumentUploadSuccess = () => {
    console.log("✅ [DOCUMENTS] Documents uploaded, rechecking eligibility");
    // Refresh eligibility after document upload
    checkEligibility();
  };

  const handlePayNowClick = () => {
    console.log("🔘 [PAYMENT] Pay button clicked");
    console.log("📊 [PAYMENT] State:", {
      isAuthenticated,
      isEligible,
      agreedToTerms,
      processing,
    });

    // STEP 1: Check if user is logged in
    if (!isAuthenticated || !user) {
      console.log("❌ [PAYMENT] User not authenticated, showing login modal");
      setShowAuthModal(true);
      return;
    }

    // STEP 2: Check if documents are verified
    if (isEligible === false || isEligible === null) {
      console.log("❌ [PAYMENT] Documents not verified, showing upload prompt");
      Alert.alert(
        "KYC/Documents Required",
        "Please upload and verify your documents before booking",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Upload Documents",
            onPress: () => setShowDocumentModal(true),
          },
        ],
      );
      return;
    }

    // STEP 3: Check terms agreement
    if (!agreedToTerms) {
      console.log("❌ [PAYMENT] Terms not agreed");
      Alert.alert("Terms Required", "Please agree to terms & conditions");
      return;
    }

    // STEP 4: Process payment
    console.log("✅ [PAYMENT] All checks passed, processing payment");
    handlePayNow();
  };

  const handlePayNow = async () => {
    const currentToken = useAuthStore.getState().token;

    if (!currentToken) {
      Alert.alert("Error", "Missing auth token");
      return;
    }

    setProcessing(true);

    try {
      console.log("🚗 Creating booking...");

      const result = await createBooking(currentToken);

      console.log("✅ Booking success:", result);

      Alert.alert(
        "Booking Confirmed! 🎉",
        "Your car has been successfully booked.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Home" as never),
          },
        ],
      );
    } catch (error: any) {
      console.error("❌ Booking failed:", error);

      Alert.alert(
        "Booking Failed",
        error.message || "Something went wrong. Try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  // Determine button state
  const getButtonState = () => {
    if (!isAuthenticated) return "login";
    if (checkingEligibility) return "checking";
    if (isEligible !== true) return "kyc";
    if (!agreedToTerms) return "disabled";
    return "ready";
  };

  const buttonState = getButtonState();

  if (!selectedCar) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.pickupLocationHeader}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.pickupLocationText} numberOfLines={1}>
              {pickupLocation?.city || "Pickup Location"}
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
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Booking Summary</Text>
        </View>

        {/* Car Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Selected Vehicle</Text>
          <View style={styles.carInfo}>
            <Text style={styles.carBrand}>{selectedCar.make}</Text>
            <Text style={styles.carName}>
              {selectedCar.model} {selectedCar.year}
            </Text>
            {selectedCar.capabilities && (
              <View style={styles.carSpecs}>
                {selectedCar.capabilities.seats && (
                  <View style={styles.specItem}>
                    <Ionicons
                      name="people-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.specText}>
                      {selectedCar.capabilities.seats} Seats
                    </Text>
                  </View>
                )}
                {selectedCar.capabilities.transmission && (
                  <View style={styles.specItem}>
                    <Ionicons
                      name="settings-outline"
                      size={14}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.specText}>
                      {selectedCar.capabilities.transmission}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <View style={styles.tripDetail}>
            <View style={styles.tripDetailRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
              <View style={styles.tripDetailText}>
                <Text style={styles.tripLabel}>Pickup</Text>
                <Text style={styles.tripValue}>
                  {formatDateTime(pickupDateTime)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.tripDetail}>
            <View style={styles.tripDetailRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={COLORS.primary}
              />
              <View style={styles.tripDetailText}>
                <Text style={styles.tripLabel}>Drop-off</Text>
                <Text style={styles.tripValue}>
                  {formatDateTime(dropoffDateTime)}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.durationText}>
              Duration: {calculateDuration()}
            </Text>
          </View>
        </View>

        {/* Zip Your Trip Options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zip Your Trip</Text>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Insure Trip</Text>
              <Text style={styles.optionSubtext}>
                Protect your journey with comprehensive coverage
              </Text>
            </View>
            <Switch
              value={insureTrip}
              onValueChange={setInsureTrip}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={insureTrip ? COLORS.background : COLORS.textSecondary}
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>PickUp/Drop Location</Text>
              <Text style={styles.optionSubtext}>
                Pick and Drop off at a your location
              </Text>
            </View>
            <Switch
              value={differentDropLocation}
              onValueChange={setDifferentDropLocation}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={
                differentDropLocation ? COLORS.background : COLORS.textSecondary
              }
            />
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Confirm Your Booking</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>CAR CHARGES:</Text>
            <Text style={styles.priceValue}>₹{carCharges}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>INSURANCE CHARGES:</Text>
            <Text style={styles.priceValue}>₹{insuranceCharges}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>PICK & DROP CHARGES:</Text>
            <Text style={styles.priceValue}>₹{pickDropCharges}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>GST:</Text>
            <Text style={styles.priceValue}>₹{gst}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL COST:</Text>
            <Text style={styles.totalValue}>₹{totalCost}</Text>
          </View>

          <View style={styles.paymentNote}>
            <Text style={styles.paymentNoteText}>
              Pay only <Text style={styles.paymentHighlight}>₹0 now</Text> and
              confirm your booking. Pay balance amount on car pickup.
            </Text>
          </View>

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && (
                <Ionicons
                  name="checkmark"
                  size={16}
                  color={COLORS.background}
                />
              )}
            </View>
            <Text style={styles.termsText}>
              You agree to{" "}
              <Text style={styles.termsLink}>terms & conditions</Text>,
              including the cancellation policy.
            </Text>
          </TouchableOpacity>

          {/* Pay Button - Dynamic based on state */}
          <TouchableOpacity
            style={[
              styles.payButton,
              buttonState === "disabled" && styles.payButtonDisabled,
            ]}
            onPress={handlePayNowClick}
            disabled={buttonState === "disabled" || buttonState === "checking"}
          >
            {buttonState === "checking" ? (
              <>
                <ActivityIndicator size="small" color={COLORS.background} />
                <Text style={styles.payButtonText}>Checking...</Text>
              </>
            ) : buttonState === "login" ? (
              <Text style={styles.payButtonText}>Login to Continue</Text>
            ) : buttonState === "kyc" ? (
              <Text style={styles.payButtonText}>Upload KYC Documents</Text>
            ) : processing ? (
              <>
                <ActivityIndicator size="small" color={COLORS.background} />
                <Text style={styles.payButtonText}>Processing...</Text>
              </>
            ) : (
              <Text style={styles.payButtonText}>CONFIRM & PAY NOW</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Check Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CHECK DETAILS</Text>

          {/* Pickup Location */}
          <View style={styles.checkDetail}>
            <View style={styles.checkIcon}>
              <Ionicons name="location" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.checkContent}>
              <Text style={styles.checkLabel}>CAR PICKUP LOCATION:</Text>
              <Text style={styles.checkValue}>
                {pickupLocation?.city || "Not set"}
              </Text>
            </View>
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.primary}
            />
          </View>

          {/* Documents/KYC Status */}
          <View style={styles.checkDetail}>
            <View style={styles.checkIcon}>
              <Ionicons
                name="document-text"
                size={24}
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
                      size={16}
                      color={COLORS.background}
                    />
                    <Text style={styles.uploadButtonText}>Login Now</Text>
                  </TouchableOpacity>
                </>
              ) : checkingEligibility ? (
                <Text style={styles.checkValue}>Checking KYC status...</Text>
              ) : isEligible ? (
                <Text style={[styles.checkValue, { color: COLORS.primary }]}>
                  ✓ YOUR DOCUMENTS ARE VERIFIED
                </Text>
              ) : (
                <>
                  <Text style={[styles.checkValue, { color: COLORS.error }]}>
                    ✗ KYC/Documents Not Verified
                  </Text>
                  {eligibilityReason && (
                    <Text style={styles.checkLabel}>
                      Reason: {eligibilityReason}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => setShowDocumentModal(true)}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={16}
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
              size={24}
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

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Document Upload Modal */}
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

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  pickupLocationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  pickupLocationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    maxWidth: 150,
  },
  profileButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  titleSection: {
    padding: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
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
  cardTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  carInfo: {
    gap: SPACING.xs,
  },
  carBrand: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
  },
  carName: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  carSpecs: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  specItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs / 2,
  },
  specText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  tripDetail: {
    marginBottom: SPACING.md,
  },
  tripDetailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  tripDetailText: {
    flex: 1,
  },
  tripLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  tripValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: "flex-start",
  },
  durationText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  optionInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  optionLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs / 2,
  },
  optionSubtext: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
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
  },
  priceValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
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
  },
  paymentNoteText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  paymentHighlight: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
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
  termsLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
  payButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.sm,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
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
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  checkContent: {
    flex: 1,
  },
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
});
