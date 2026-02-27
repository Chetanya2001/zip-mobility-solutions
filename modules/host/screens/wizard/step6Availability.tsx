import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getCarLocation } from "../../../../utils/locationIQ";
import { useAddCarStore } from "../../../../store/host/addCar.store";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../../constants/theme";

interface Step6AvailabilityProps {
  onSuccess: () => void;
  onBack: () => void;
  defaultValues?: any;
  carId: number;
}

type ServiceType = "self-drive" | "intercity" | "both";
type DropOffPolicy = "flexible" | "no-service";

const Step6Availability: React.FC<Step6AvailabilityProps> = ({
  onSuccess,
  onBack,
  defaultValues = {},
  carId,
}) => {
  const uploadAvailability = useAddCarStore(
    (state: any) => state.uploadAvailability,
  );

  const [serviceType, setServiceType] = useState<ServiceType>(
    defaultValues?.serviceType || "self-drive",
  );
  const [expectedHourlyRent, setExpectedHourlyRent] = useState<string>(
    defaultValues?.expectedHourlyRent?.toString() || "",
  );
  const [availabilityFrom, setAvailabilityFrom] = useState<string>(
    defaultValues?.availabilityFrom || "",
  );
  const [availabilityTill, setAvailabilityTill] = useState<string>(
    defaultValues?.availabilityTill || "",
  );
  const [selfDriveDropOffPolicy, setSelfDriveDropOffPolicy] =
    useState<DropOffPolicy>(
      defaultValues?.selfDriveDropOffPolicy || "flexible",
    );
  const [flexibleDropOffRate, setFlexibleDropOffRate] = useState<string>(
    defaultValues?.flexibleDropOffRate?.toString() || "",
  );
  const [intercityPricePerKm, setIntercityPricePerKm] = useState<string>(
    defaultValues?.intercityPricePerKm?.toString() || "",
  );
  const [carLocation, setCarLocation] = useState<string>(
    defaultValues?.carLocation?.address || "",
  );
  const [locationDetails, setLocationDetails] = useState({
    lat: defaultValues?.carLocation?.lat || 0,
    lng: defaultValues?.carLocation?.lng || 0,
    address: defaultValues?.carLocation?.address || "",
    city: defaultValues?.carLocation?.city || "",
  });

  const [dateFrom, setDateFrom] = useState<Date>(new Date());
  const [dateTill, setDateTill] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<"from" | "till" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (defaultValues.availabilityFrom) {
      try {
        setDateFrom(new Date(defaultValues.availabilityFrom));
      } catch {}
    }
    if (defaultValues.availabilityTill) {
      try {
        setDateTill(new Date(defaultValues.availabilityTill));
      } catch {}
    }
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(null);
      return;
    }
    if (!selectedDate || !showDatePicker) return;
    if (Platform.OS === "android") setShowDatePicker(null);

    const formatted = selectedDate.toISOString().split("T")[0];
    if (showDatePicker === "from") {
      setDateFrom(selectedDate);
      setAvailabilityFrom(formatted);
    } else {
      setDateTill(selectedDate);
      setAvailabilityTill(formatted);
    }
  };

  const handleFinish = async () => {
    if (!availabilityFrom || !availabilityTill) {
      Alert.alert("Missing Fields", "Please select availability dates");
      return;
    }
    if (!carLocation) {
      Alert.alert(
        "Missing Fields",
        "Please set car location using current location",
      );
      return;
    }
    if (
      (serviceType === "self-drive" || serviceType === "both") &&
      !expectedHourlyRent
    ) {
      Alert.alert("Missing Fields", "Please enter hourly rent");
      return;
    }
    if (
      (serviceType === "intercity" || serviceType === "both") &&
      !intercityPricePerKm
    ) {
      Alert.alert("Missing Fields", "Please enter intercity price per km");
      return;
    }
    if (
      serviceType !== "intercity" &&
      selfDriveDropOffPolicy === "flexible" &&
      !flexibleDropOffRate
    ) {
      Alert.alert("Missing Fields", "Please enter flexible drop-off rate");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        car_id: carId,
        car_mode: serviceType === "self-drive" ? "selfdrive" : serviceType,
        available_from: availabilityFrom,
        available_till: availabilityTill,
        price_per_hour:
          serviceType === "self-drive" || serviceType === "both"
            ? parseFloat(expectedHourlyRent)
            : null,
        price_per_km:
          serviceType === "intercity" || serviceType === "both"
            ? parseFloat(intercityPricePerKm)
            : null,
        selfdrive_drop_policy:
          serviceType === "self-drive" || serviceType === "both"
            ? selfDriveDropOffPolicy === "flexible"
              ? "flexible"
              : "not_available"
            : "not_available",
        selfdrive_drop_amount:
          selfDriveDropOffPolicy === "flexible"
            ? parseFloat(flexibleDropOffRate)
            : null,
        car_location: {
          address: carLocation,
          city: locationDetails.city || "Faridabad",
          lat: locationDetails.lat,
          lng: locationDetails.lng,
        },
      };

      await uploadAvailability(payload);
      onSuccess();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to save availability");
    } finally {
      setSubmitting(false);
    }
  };

  const showSelfDrive = serviceType === "self-drive" || serviceType === "both";
  const showIntercity = serviceType === "intercity" || serviceType === "both";

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Availability & Pricing</Text>
        <Text style={styles.subtitle}>
          Set when your car is available and how much you'd like to charge.
        </Text>

        {/* Service Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Service Type</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                serviceType === "self-drive" && styles.toggleButtonActive,
              ]}
              onPress={() => setServiceType("self-drive")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  serviceType === "self-drive" && styles.toggleButtonTextActive,
                ]}
              >
                Self Drive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                serviceType === "intercity" && styles.toggleButtonActive,
              ]}
              onPress={() => setServiceType("intercity")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  serviceType === "intercity" && styles.toggleButtonTextActive,
                ]}
              >
                Intercity
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                serviceType === "both" && styles.toggleButtonActive,
              ]}
              onPress={() => setServiceType("both")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  serviceType === "both" && styles.toggleButtonTextActive,
                ]}
              >
                Both
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Car Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Car Location</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={async () => {
              try {
                const location = await getCarLocation();
                if (location) {
                  setCarLocation(location.address);
                  setLocationDetails({
                    lat: location.latitude,
                    lng: location.longitude,
                    address: location.address,
                    city: location.city || "Faridabad",
                  });
                } else {
                  Alert.alert(
                    "Location unavailable",
                    "Could not detect current location",
                  );
                }
              } catch {
                Alert.alert("Error", "Failed to get location");
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>📍 Use Current Location</Text>
            <Text style={styles.dropdownIcon}>→</Text>
          </TouchableOpacity>
          {carLocation ? (
            <View style={styles.selectedLocation}>
              <Text style={styles.selectedAddress}>{carLocation}</Text>
            </View>
          ) : null}
        </View>

        {/* Self-Drive Settings */}
        {showSelfDrive && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>🚗 Self-Drive Settings</Text>

            <View style={styles.subSection}>
              <Text style={styles.subLabel}>DROP-OFF POLICY</Text>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSelfDriveDropOffPolicy("flexible")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selfDriveDropOffPolicy === "flexible" &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {selfDriveDropOffPolicy === "flexible" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.radioText}>Flexible (amount per km)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setSelfDriveDropOffPolicy("no-service")}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.radioCircle,
                    selfDriveDropOffPolicy === "no-service" &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {selfDriveDropOffPolicy === "no-service" && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.radioText}>No drop-off service</Text>
              </TouchableOpacity>

              {selfDriveDropOffPolicy === "flexible" && (
                <View style={styles.nestedField}>
                  <Text style={styles.subLabel}>Drop-off Amount (₹ / km)</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.inputWithSymbol}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textSecondary}
                      value={flexibleDropOffRate}
                      onChangeText={(t) =>
                        setFlexibleDropOffRate(t.replace(/[^0-9.]/g, ""))
                      }
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.unitText}>/ km</Text>
                  </View>
                </View>
              )}

              <View style={styles.nestedField}>
                <Text style={styles.subLabel}>Price Per Hour (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.inputWithSymbol}
                    placeholder="e.g. 1200"
                    placeholderTextColor={COLORS.textSecondary}
                    value={expectedHourlyRent}
                    onChangeText={(t) =>
                      setExpectedHourlyRent(t.replace(/[^0-9.]/g, ""))
                    }
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.unitText}>/ hr</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Intercity Settings */}
        {showIntercity && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>🗺️ Intercity Pricing</Text>
            <View style={styles.subSection}>
              <Text style={styles.subLabel}>Price Per Km (₹)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.inputWithSymbol}
                  placeholder="e.g. 18"
                  placeholderTextColor={COLORS.textSecondary}
                  value={intercityPricePerKm}
                  onChangeText={(t) =>
                    setIntercityPricePerKm(t.replace(/[^0-9.]/g, ""))
                  }
                  keyboardType="decimal-pad"
                />
                <Text style={styles.unitText}>/ km</Text>
              </View>
            </View>
          </View>
        )}

        {/* Dates */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.label}>Available From</Text>
            <TouchableOpacity
              style={styles.datePickerContainer}
              onPress={() => setShowDatePicker("from")}
              activeOpacity={0.7}
            >
              <View style={styles.dateInputWrapper}>
                <Text
                  style={[
                    styles.dateInput,
                    !availabilityFrom && styles.datePlaceholder,
                  ]}
                >
                  {availabilityFrom || "yyyy-mm-dd"}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.label}>Available Till</Text>
            <TouchableOpacity
              style={styles.datePickerContainer}
              onPress={() => setShowDatePicker("till")}
              activeOpacity={0.7}
            >
              <View style={styles.dateInputWrapper}>
                <Text
                  style={[
                    styles.dateInput,
                    !availabilityTill && styles.datePlaceholder,
                  ]}
                >
                  {availabilityTill || "yyyy-mm-dd"}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextButton, submitting && styles.nextButtonDisabled]}
            onPress={handleFinish}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {submitting ? "Saving..." : "Finish & List Car"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={showDatePicker === "from" ? dateFrom : dateTill}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(2030, 11, 31)}
        />
      )}

      {/* iOS Date Picker */}
      {showDatePicker && Platform.OS === "ios" && (
        <Modal transparent visible={!!showDatePicker} animationType="slide">
          <TouchableOpacity
            style={styles.iosDatePickerOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.iosDatePickerContainer}
            >
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.iosCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosDatePickerTitle}>
                  Select {showDatePicker === "from" ? "Start" : "End"} Date
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                  <Text style={styles.iosDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={showDatePicker === "from" ? dateFrom : dateTill}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(2030, 11, 31)}
                textColor={COLORS.textPrimary}
                style={styles.iosDatePicker}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl, paddingHorizontal: SPACING.lg },
  title: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xxxl,
    lineHeight: 24,
  },
  fieldContainer: { marginBottom: SPACING.xxl },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subSection: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    letterSpacing: 0.5,
  },
  nestedField: { marginTop: SPACING.lg },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackgroundLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
    gap: SPACING.xs,
  },
  toggleButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
  },
  toggleButtonActive: { backgroundColor: COLORS.primary },
  toggleButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  toggleButtonTextActive: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  dropdownText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  dropdownIcon: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  selectedLocation: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackgroundLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectedAddress: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: { borderColor: COLORS.primary },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  radioText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
  },
  currencySymbol: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  inputWithSymbol: {
    flex: 1,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  unitText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  dateRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.xxl,
  },
  dateField: { flex: 1 },
  datePickerContainer: {
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.lg,
  },
  dateInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  datePlaceholder: { color: COLORS.textSecondary },
  calendarIcon: { fontSize: 24, marginLeft: SPACING.sm },
  buttonContainer: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  backButton: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  backButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  nextButton: {
    flex: 2,
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.background,
  },
  iosDatePickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.overlay,
  },
  iosDatePickerContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xl,
  },
  iosDatePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iosDatePickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  iosCancelText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  iosDoneText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  iosDatePicker: { height: 220 },
});

export default Step6Availability;
