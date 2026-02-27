import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
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
import { useAddCarStore } from "../../../../store/host/addCar.store";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../../constants/theme";

interface Step3InsuranceProps {
  onNext: (data: InsuranceData) => void;
  onBack: () => void;
  defaultValues?: Partial<InsuranceData>;
  carId: number;
}

interface InsuranceData {
  insuranceCompany: string;
  idvValue: string;
  expiryDate: string;
  insuranceImage?: any;
}

const INSURERS = [
  "ICICI Lombard",
  "HDFC ERGO",
  "Bajaj Allianz",
  "TATA AIG",
  "Reliance General Insurance",
  "National Insurance",
  "New India Assurance",
  "Oriental Insurance",
  "United India Insurance",
  "Digit Insurance",
  "Acko General Insurance",
  "Go Digit General Insurance",
  "Royal Sundaram",
  "Cholamandalam MS",
  "Future Generali",
  "Liberty General Insurance",
  "Shriram General Insurance",
  "Bharti AXA General Insurance",
  "Kotak Mahindra General Insurance",
  "Magma HDI General Insurance",
  "Raheja QBE General Insurance",
  "SBI General Insurance",
  "Universal Sompo General Insurance",
  "Iffco Tokio General Insurance",
  "Other",
];

const Step3Insurance: React.FC<Step3InsuranceProps> = ({
  onNext,
  onBack,
  defaultValues = {},
  carId,
}) => {
  const addInsurance = useAddCarStore((state: any) => state.addInsurance);
  const loading = useAddCarStore((state: any) => state.loading);

  const [insuranceCompany, setInsuranceCompany] = useState(
    defaultValues.insuranceCompany || "",
  );
  const [idvValue, setIdvValue] = useState(defaultValues.idvValue || "");
  const [expiryDate, setExpiryDate] = useState(defaultValues.expiryDate || "");
  const [insuranceImage, setInsuranceImage] = useState<any>(
    defaultValues.insuranceImage || null,
  );

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showInsurerModal, setShowInsurerModal] = useState(false);

  const pickImage = async () => {
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
        setInsuranceImage(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        setInsuranceImage(result.assets[0]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo.");
    }
  };

  const showImageOptions = () => {
    Alert.alert("Upload Insurance Document", "Choose an option", [
      { text: "Take Photo", onPress: () => takePhoto() },
      { text: "Choose from Gallery", onPress: () => pickImage() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed") {
      setShowDatePicker(Platform.OS === "ios");
      return;
    }
    const currentDate = selectedDate || date;
    setDate(currentDate);
    if (Platform.OS === "android") setShowDatePicker(false);
    setExpiryDate(currentDate.toISOString().split("T")[0]);
  };

  const closeDatePicker = () => setShowDatePicker(false);

  const handleNext = async () => {
    if (!insuranceCompany) {
      Alert.alert("Missing Fields", "Please select the insurance company.");
      return;
    }
    if (!expiryDate) {
      Alert.alert("Missing Fields", "Please select the valid till date.");
      return;
    }
    if (!insuranceImage) {
      Alert.alert(
        "Missing Images",
        "Please upload the insurance document image.",
      );
      return;
    }

    try {
      await addInsurance({
        car_id: carId,
        insurance_company: insuranceCompany,
        insurance_idv_value: idvValue ? parseInt(idvValue) : 0,
        insurance_valid_till: expiryDate,
        insurance_image: insuranceImage,
      });

      onNext({
        insuranceCompany,
        idvValue,
        expiryDate,
        insuranceImage,
      });
    } catch (error: any) {
      Alert.alert(
        "Upload Failed",
        error?.response?.data?.message || "Failed to upload insurance details.",
      );
    }
  };

  const isFormValid = Boolean(insuranceCompany && expiryDate && insuranceImage);

  return (
    <View style={[styles.container, { paddingTop: 16 }]}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Insurance Details</Text>
        <Text style={styles.subtitle}>
          Add your current insurance policy for verification.
        </Text>

        {/* Insurance Company */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Insurance Company *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowInsurerModal(true)}
            activeOpacity={0.7}
          >
            <Text
              style={
                insuranceCompany
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {insuranceCompany || "Select insurance company"}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* IDV Value */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>IDV Value (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 450000"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="numeric"
            value={idvValue}
            onChangeText={setIdvValue}
          />
        </View>

        {/* Valid Till */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Valid Till *</Text>
          <TouchableOpacity
            style={styles.datePickerContainer}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateInputWrapper}>
              <Text
                style={[
                  styles.dateInput,
                  !expiryDate && styles.datePlaceholder,
                ]}
              >
                {expiryDate || "Select Date (YYYY-MM-DD)"}
              </Text>
              <Text style={styles.calendarIcon}>📅</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Insurance Document Image */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Insurance Document Image *</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={showImageOptions}
            activeOpacity={0.7}
          >
            {insuranceImage ? (
              <View style={styles.uploadedContainer}>
                <Image
                  source={{ uri: insuranceImage.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedText}>✓ Image Uploaded</Text>
                </View>
              </View>
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Text style={styles.uploadIcon}>📄</Text>
                <Text style={styles.uploadText}>
                  Tap to upload insurance copy
                </Text>
                <Text style={styles.uploadSubtext}>
                  Clear photo of insurance document (front side)
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Buttons */}
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

      {/* Android Date Picker */}
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

      {/* iOS Date Picker */}
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

      {/* Insurer Modal */}
      <Modal
        visible={showInsurerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInsurerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowInsurerModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Insurance Company</Text>
              <TouchableOpacity onPress={() => setShowInsurerModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {INSURERS.map((insurer) => (
                <TouchableOpacity
                  key={insurer}
                  style={styles.modalItem}
                  onPress={() => {
                    setInsuranceCompany(insurer);
                    setShowInsurerModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalItemText}>{insurer}</Text>
                  {insuranceCompany === insurer && (
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, minHeight: "100%" },
  scrollContent: { paddingBottom: SPACING.xl, flexGrow: 1 },
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
    height: 200,
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
    maxHeight: "80%",
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
  iosDatePicker: { height: 200 },
});

export default Step3Insurance;
