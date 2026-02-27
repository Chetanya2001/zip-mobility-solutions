import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAddCarStore } from "../../../../store/host/addCar.store";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../../constants/theme";

interface Step4FeaturesProps {
  onNext: (data: CarStandardsAndFeatures) => void;
  onBack: () => void;
  defaultValues?: Partial<CarStandardsAndFeatures>;
  carId: number;
}

export interface CarStandards {
  car_id: number;
  seats: number;
  fuel: string;
  mileage?: number;
  car_range?: number;
}

export interface CarFeatures {
  car_id: number;
  airconditions: boolean;
  child_seat: boolean;
  gps: boolean;
  luggage: boolean;
  music: boolean;
  seat_belt: boolean;
  sleeping_bed: boolean;
  water: boolean;
  bluetooth: boolean;
  onboard_computer: boolean;
  audio_input: boolean;
  long_term_trips: boolean;
  car_kit: boolean;
  remote_central_locking: boolean;
  climate_control: boolean;
}

export interface CarStandardsAndFeatures extends CarStandards, CarFeatures {}

type FeatureKey = keyof Omit<CarFeatures, "car_id">;

interface FeatureItem {
  key: FeatureKey;
  label: string;
  icon: string;
}

const FEATURES: FeatureItem[] = [
  { key: "airconditions", label: "Air Conditioning", icon: "❄️" },
  { key: "child_seat", label: "Child Seat", icon: "👶" },
  { key: "gps", label: "GPS Navigation", icon: "📍" },
  { key: "luggage", label: "Luggage Space", icon: "🧳" },
  { key: "music", label: "Music System", icon: "🎵" },
  { key: "seat_belt", label: "Seat Belt", icon: "🔒" },
  { key: "sleeping_bed", label: "Sleeping Bed", icon: "🛏️" },
  { key: "water", label: "Water", icon: "💧" },
  { key: "bluetooth", label: "Bluetooth", icon: "📱" },
  { key: "onboard_computer", label: "Onboard Computer", icon: "💻" },
  { key: "audio_input", label: "Audio Input", icon: "🎧" },
  { key: "long_term_trips", label: "Long Term Trips", icon: "🚗" },
  { key: "car_kit", label: "Car Kit", icon: "🧰" },
  {
    key: "remote_central_locking",
    label: "Remote Central Locking",
    icon: "🔑",
  },
  { key: "climate_control", label: "Climate Control", icon: "🌡️" },
];

const FUEL_TYPES = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const SEAT_OPTIONS = ["2", "4", "5", "6", "7", "8"];

const Step4Features: React.FC<Step4FeaturesProps> = ({
  onNext,
  onBack,
  defaultValues = {},
  carId,
}) => {
  const addCarFeatures = useAddCarStore((s) => s.addCarFeatures);

  // UI-only state (not sent to API)
  const [seats, setSeats] = useState<string>(
    String(defaultValues.seats ?? "5"),
  );
  const [fuel, setFuel] = useState<string>(defaultValues.fuel ?? "");
  const [mileage, setMileage] = useState<string>(
    defaultValues.mileage !== undefined ? String(defaultValues.mileage) : "",
  );
  const [carRange, setCarRange] = useState<string>(
    defaultValues.car_range !== undefined
      ? String(defaultValues.car_range)
      : "",
  );

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showSeatsModal, setShowSeatsModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    airconditions: defaultValues.airconditions || false,
    child_seat: defaultValues.child_seat || false,
    gps: defaultValues.gps || false,
    luggage: defaultValues.luggage || false,
    music: defaultValues.music || false,
    seat_belt: defaultValues.seat_belt || false,
    sleeping_bed: defaultValues.sleeping_bed || false,
    water: defaultValues.water || false,
    bluetooth: defaultValues.bluetooth || false,
    onboard_computer: defaultValues.onboard_computer || false,
    audio_input: defaultValues.audio_input || false,
    long_term_trips: defaultValues.long_term_trips || false,
    car_kit: defaultValues.car_kit || false,
    remote_central_locking: defaultValues.remote_central_locking || false,
    climate_control: defaultValues.climate_control || false,
  });

  const toggleFeature = (key: FeatureKey) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCount = FEATURES.filter((f) => features[f.key]).length;

  const filteredFeatures = FEATURES.filter((f) =>
    f.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleNext = async () => {
    if (selectedCount === 0) {
      Alert.alert(
        "No Features Selected",
        "Please select at least one feature.",
      );
      return;
    }

    setLoading(true);
    try {
      const carFeaturesData: CarFeatures = { car_id: carId, ...features };

      const featuresRes = await addCarFeatures(carFeaturesData);
      if (!featuresRes || featuresRes.error) {
        Alert.alert("Error", "Failed to save car features.");
        return;
      }

      // Pass UI-only standards + saved features to onNext
      onNext({
        seats: Number(seats),
        fuel,
        mileage: mileage !== "" ? Number(mileage) : undefined,
        car_range: carRange !== "" ? Number(carRange) : undefined,
        ...carFeaturesData,
      });
    } catch (err) {
      Alert.alert("Error", "Something went wrong while saving car features.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = selectedCount > 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Vehicle Standards & Features</Text>
        <Text style={styles.subtitle}>
          Provide basic specifications and features available in your vehicle.
        </Text>

        {/* Seats — UI only */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Number of Seats</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSeatsModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{seats} Seats</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Fuel Type — UI only */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Fuel Type</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowFuelModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={fuel ? styles.dropdownText : styles.dropdownPlaceholder}
            >
              {fuel || "Select fuel type"}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Mileage — UI only */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Mileage (km/litre)</Text>
          <TextInput
            style={styles.input}
            value={mileage}
            placeholder="e.g. 15"
            placeholderTextColor={COLORS.textSecondary}
            onChangeText={(t) => setMileage(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Range — UI only */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Range (km, full tank/charge)</Text>
          <TextInput
            style={styles.input}
            value={carRange}
            placeholder="e.g. 500"
            placeholderTextColor={COLORS.textSecondary}
            onChangeText={(t) => setCarRange(t.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Features */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Vehicle Features ({selectedCount} selected)
          </Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setShowFeaturesModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>✨</Text>
              <Text style={styles.uploadText}>
                {selectedCount === 0
                  ? "Tap to select features"
                  : `${selectedCount} feature${selectedCount !== 1 ? "s" : ""} selected`}
              </Text>
              <Text style={styles.uploadSubtext}>
                Tap to add or modify selection
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Selected Pills */}
        {selectedCount > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Selected Features</Text>
            <View style={styles.pillsContainer}>
              {FEATURES.filter((f) => features[f.key]).map((feature) => (
                <TouchableOpacity
                  key={feature.key}
                  style={styles.pill}
                  onPress={() => toggleFeature(feature.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pillIcon}>{feature.icon}</Text>
                  <Text style={styles.pillText}>{feature.label}</Text>
                  <Text style={styles.pillRemove}>✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!isFormValid || loading) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={!isFormValid || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {loading ? "Saving..." : "Next Step →"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fuel Modal */}
      <Modal
        visible={showFuelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFuelModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFuelModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Fuel Type</Text>
              <TouchableOpacity onPress={() => setShowFuelModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {FUEL_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalItem}
                  onPress={() => {
                    setFuel(type);
                    setShowFuelModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      fuel === type && styles.modalItemTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                  {fuel === type && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Seats Modal */}
      <Modal
        visible={showSeatsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSeatsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSeatsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Number of Seats</Text>
              <TouchableOpacity onPress={() => setShowSeatsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {SEAT_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.modalItem}
                  onPress={() => {
                    setSeats(s);
                    setShowSeatsModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      seats === s && styles.modalItemTextSelected,
                    ]}
                  >
                    {s} Seats
                  </Text>
                  {seats === s && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Features Modal */}
      <Modal
        visible={showFeaturesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeaturesModal(false)}
      >
        <View style={styles.featuresOverlay}>
          <View style={styles.featuresContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Features</Text>
              <TouchableOpacity onPress={() => setShowFeaturesModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search features..."
                placeholderTextColor={COLORS.textSecondary}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.selectedCountText}>
              {selectedCount} features selected
            </Text>

            <ScrollView>
              {filteredFeatures.map((feature) => {
                const isSelected = features[feature.key];
                return (
                  <TouchableOpacity
                    key={feature.key}
                    style={[
                      styles.featureItem,
                      isSelected && styles.featureItemSelected,
                    ]}
                    onPress={() => toggleFeature(feature.key)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Text style={styles.checkboxCheck}>✓</Text>
                      )}
                    </View>
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.modalItemText}>{feature.label}</Text>
                  </TouchableOpacity>
                );
              })}

              {filteredFeatures.length === 0 && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No features found</Text>
                  <Text style={styles.uploadSubtext}>
                    Try a different search term
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.featureFooter}>
              <TouchableOpacity
                style={[styles.nextButton, { flex: 0 }]}
                onPress={() => setShowFeaturesModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>
                  Done ({selectedCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  input: {
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
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
  dropdownPlaceholder: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  dropdownIcon: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  uploadButton: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    backgroundColor: COLORS.cardBackgroundLight,
    overflow: "hidden",
  },
  uploadPlaceholder: { alignItems: "center", paddingVertical: SPACING.md },
  uploadIcon: { fontSize: 48, marginBottom: SPACING.md },
  uploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  uploadSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  pillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackgroundLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    gap: SPACING.xs,
  },
  pillIcon: { fontSize: FONT_SIZES.sm },
  pillText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  pillRemove: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
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
  nextButtonDisabled: { opacity: 0.5, backgroundColor: COLORS.cardBackground },
  nextButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.background,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: COLORS.overlay,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  modalClose: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.regular,
  },
  modalList: { maxHeight: 400 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  modalItemTextSelected: { fontWeight: FONT_WEIGHTS.semibold },
  checkmark: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  featuresOverlay: { flex: 1, backgroundColor: COLORS.overlay },
  featuresContent: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    marginTop: 60,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackgroundLight,
    margin: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { fontSize: FONT_SIZES.md, marginRight: SPACING.sm },
  searchInput: { flex: 1, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  searchClear: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
  },
  selectedCountText: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featureItemSelected: { backgroundColor: COLORS.cardBackgroundLight },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheck: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  featureIcon: { fontSize: FONT_SIZES.lg },
  noResults: { padding: SPACING.xxxl, alignItems: "center" },
  noResultsText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.sm,
  },
  featureFooter: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export default Step4Features;
