import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../../constants/theme";
import { useAddCarStore } from "../../../../store/host/addCar.store";

interface Step2RegistrationProps {
  onNext: (data: RegistrationData) => void;
  onBack: () => void;
  defaultValues?: Partial<RegistrationData>;
  carId: number;
}

interface RegistrationData {
  ownerName: string;
  registrationNo: string;
  cityOfRegistration: string;
  rcValidTill: string;
  handType: "First" | "Second";
  registrationType: "Private" | "Commercial";
  rcFrontFile?: any;
  rcBackFile?: any;
}

const Step2Registration: React.FC<Step2RegistrationProps> = ({
  onNext,
  onBack,
  defaultValues = {},
  carId,
}) => {
  const uploadRC = useAddCarStore((state) => state.uploadRC);

  const [formData, setFormData] = useState<RegistrationData>({
    ownerName: defaultValues.ownerName || "",
    registrationNo: defaultValues.registrationNo || "",
    cityOfRegistration: defaultValues.cityOfRegistration || "",
    rcValidTill: defaultValues.rcValidTill || "",
    handType: defaultValues.handType || "First",
    registrationType: defaultValues.registrationType || "Private",
    rcFrontFile: defaultValues.rcFrontFile,
    rcBackFile: defaultValues.rcBackFile,
  });

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showRegistrationTypeModal, setShowRegistrationTypeModal] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const cities = [
    "Delhi",
    "Agra",
    "Noida",
    "Meerut",
    "Gurgaon",
    "Faridabad",
    "Ghaziabad",
  ];

  useEffect(() => {
    if (defaultValues.rcValidTill) {
      try {
        setDate(new Date(defaultValues.rcValidTill));
      } catch (error) {
        console.error("Invalid date:", error);
      }
    }
  }, [defaultValues.rcValidTill]);

  const updateField = (field: keyof RegistrationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async (type: "front" | "back") => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload images",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        const field = type === "front" ? "rcFrontFile" : "rcBackFile";
        updateField(field, result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const onDatePress = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(Platform.OS === "ios");
      return;
    }

    const currentDate = selectedDate || date;
    setDate(currentDate);

    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    const formattedDate = currentDate.toISOString().split("T")[0];
    updateField("rcValidTill", formattedDate);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const handleNext = async () => {
    if (
      !formData.ownerName ||
      !formData.registrationNo ||
      !formData.cityOfRegistration ||
      !formData.rcValidTill
    ) {
      Alert.alert("Missing Fields", "Please fill all required fields");
      return;
    }

    if (!formData.rcFrontFile || !formData.rcBackFile) {
      Alert.alert(
        "Missing Images",
        "Please upload both RC front and back images",
      );
      return;
    }

    setLoading(true);
    try {
      const response = await uploadRC({ car_id: carId, ...formData });
      console.log("✅ RC Upload Success:", response);
      onNext(formData);
    } catch (error: any) {
      console.error("❌ RC Upload Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to upload RC details.";

      if (
        errorMessage.toLowerCase().includes("duplicate") ||
        errorMessage.includes("unique")
      ) {
        Alert.alert(
          "Duplicate Registration",
          `Registration number "${formData.registrationNo}" already exists in the system.`,
        );
      } else {
        Alert.alert("Upload Failed", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.ownerName &&
    formData.registrationNo &&
    formData.cityOfRegistration &&
    formData.rcValidTill &&
    formData.rcFrontFile &&
    formData.rcBackFile;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Registration Details</Text>
        <Text style={styles.subtitle}>
          Provide your vehicle's registration information.
        </Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Owner Name (as in RC)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter owner name"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.ownerName}
            onChangeText={(text) => updateField("ownerName", text)}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Registration Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., UP80EL9999"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.registrationNo}
            onChangeText={(text) =>
              updateField("registrationNo", text.toUpperCase())
            }
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Car Location</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowCityModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                formData.cityOfRegistration
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {formData.cityOfRegistration || "Select City"}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>RC Valid Till</Text>
          <TouchableOpacity
            style={styles.datePickerContainer}
            onPress={onDatePress}
            activeOpacity={0.7}
          >
            <View style={styles.dateInputWrapper}>
              <Text
                style={[
                  styles.dateInput,
                  !formData.rcValidTill && styles.datePlaceholder,
                ]}
              >
                {formData.rcValidTill || "Select Date (YYYY-MM-DD)"}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Car Hand Type</Text>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.handType === "First" && styles.toggleButtonActive,
              ]}
              onPress={() => updateField("handType", "First")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  formData.handType === "First" &&
                    styles.toggleButtonTextActive,
                ]}
              >
                First Hand
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.handType === "Second" && styles.toggleButtonActive,
              ]}
              onPress={() => updateField("handType", "Second")}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  formData.handType === "Second" &&
                    styles.toggleButtonTextActive,
                ]}
              >
                Second Hand
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Registration Type</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowRegistrationTypeModal(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{formData.registrationType}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* RC Front Upload */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Upload RC Front</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage("front")}
            activeOpacity={0.7}
          >
            {formData.rcFrontFile ? (
              <View style={styles.uploadedContainer}>
                <Image
                  source={{ uri: formData.rcFrontFile.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedText}>
                    ✓ Front Image Uploaded
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Tap to upload RC front</Text>
                <Text style={styles.uploadSubtext}>
                  Clear photo of RC front side
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* RC Back Upload */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Upload RC Back</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => pickImage("back")}
            activeOpacity={0.7}
          >
            {formData.rcBackFile ? (
              <View style={styles.uploadedContainer}>
                <Image
                  source={{ uri: formData.rcBackFile.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedText}>✓ Back Image Uploaded</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Tap to upload RC back</Text>
                <Text style={styles.uploadSubtext}>
                  Clear photo of RC back side
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
          >
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
              {loading ? "Uploading..." : "Next Step →"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Pickers */}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
          maximumDate={new Date(2040, 11, 31)}
        />
      )}

      {showDatePicker && Platform.OS === "ios" && (
        <Modal
          transparent
          visible={showDatePicker}
          animationType="slide"
          onRequestClose={closeDatePicker}
        >
          <TouchableOpacity
            style={styles.iosDatePickerOverlay}
            activeOpacity={1}
            onPress={closeDatePicker}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.iosDatePickerContainer}
            >
              <View style={styles.iosDatePickerHeader}>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.iosCancelText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.iosDatePickerTitle}>Select Date</Text>
                <TouchableOpacity onPress={closeDatePicker}>
                  <Text style={styles.iosDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                minimumDate={new Date()}
                maximumDate={new Date(2040, 11, 31)}
                textColor={COLORS.textPrimary}
                style={styles.iosDatePicker}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCityModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {cities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField("cityOfRegistration", city);
                    setShowCityModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{city}</Text>
                  {formData.cityOfRegistration === city && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Registration Type Modal */}
      <Modal
        visible={showRegistrationTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegistrationTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRegistrationTypeModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registration Type</Text>
              <TouchableOpacity
                onPress={() => setShowRegistrationTypeModal(false)}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {["Private", "Commercial"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalItem}
                  onPress={() => {
                    updateField(
                      "registrationType",
                      type as "Private" | "Commercial",
                    );
                    setShowRegistrationTypeModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{type}</Text>
                  {formData.registrationType === type && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
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
  uploadedContainer: { alignItems: "center" },
  uploadedImage: {
    width: "100%",
    height: 180,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  uploadedBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  uploadedText: {
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
  modalItemText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  checkmark: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
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
  iosDatePicker: {
    height: 200,
  },
});

export default Step2Registration;
