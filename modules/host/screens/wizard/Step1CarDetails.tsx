import React, { useState } from "react";
import {
  Modal,
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

interface Step1CarDetailsProps {
  onNext: (data: FormData) => void;
  defaultValues?: Partial<FormData>;
}

interface FormData {
  make_id: number | null;
  make_name: string;

  model_id: number | null;
  model_name: string;

  year: string;
  description: string;
}

const Step1CarDetails: React.FC<Step1CarDetailsProps> = ({
  onNext,
  defaultValues = {},
}) => {
  const { carMakes, carModels, fetchCarModels } = useAddCarStore();

  const [formData, setFormData] = useState<FormData>({
    make_id: null,
    make_name: "",

    model_id: null,
    model_name: "",

    year: "",
    description: "",
  });

  const [showMakeModal, setShowMakeModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    onNext(formData);
  };

  const isFormValid =
    formData.make_id && formData.model_id && formData.year.length === 4;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title */}
        <Text style={styles.title}>Tell us about your car</Text>
        <Text style={styles.subtitle}>
          Start by providing the basic details of your vehicle.
        </Text>

        {/* Make Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Make</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowMakeModal(true)}
          >
            <Text
              style={
                formData.make_name
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {formData.make_name || "Select Make"}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Model Field */}
        <View style={styles.fieldContainer}>
          <Text
            style={[styles.label, !formData.make_name && styles.labelDisabled]}
          >
            Model
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdown,
              !formData.make_name && styles.dropdownDisabled,
            ]}
            onPress={() => formData.make_name && setShowModelModal(true)}
            disabled={!formData.make_name}
          >
            <Text
              style={
                formData.model_name
                  ? styles.dropdownText
                  : styles.dropdownPlaceholder
              }
            >
              {formData.model_name || "Select Model"}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Year Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Year of Make</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Year"
            placeholderTextColor={COLORS.textSecondary}
            value={formData.year}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, "");
              updateField("year", numericText);
            }}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <View style={styles.descriptionHeader}>
            <Text style={styles.label}>Description</Text>
            <Text style={styles.charCount}>
              {formData.description.length}/200
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Describe your car's features and condition. (e.g., low mileage, new tires, non-smoker)."
            placeholderTextColor={COLORS.textSecondary}
            value={formData.description}
            onChangeText={(text) => {
              if (text.length <= 200) {
                updateField("description", text);
              }
            }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, !isFormValid && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!isFormValid}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Make Modal */}
      <Modal
        visible={showMakeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMakeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMakeModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Make</Text>
              <TouchableOpacity onPress={() => setShowMakeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {Array.isArray(carMakes) && carMakes.length === 0 && (
                <Text style={styles.emptyText}>No car makes available</Text>
              )}

              {carMakes.map((make: any) => (
                <TouchableOpacity
                  key={make.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      make_id: make.id,
                      make_name: make.name,
                      model_id: null,
                      model_name: "",
                    });

                    fetchCarModels(make.id);
                    setShowMakeModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{make.name}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Model Modal */}
      <Modal
        visible={showModelModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModelModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Model</Text>
              <TouchableOpacity onPress={() => setShowModelModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {carModels.map((model: any) => (
                <TouchableOpacity
                  key={model.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      model_id: model.id,
                      model_name: `${model.name} (${model.body_type})`,
                    });
                    setShowModelModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>
                    {model.name} ({model.body_type})
                  </Text>
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
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
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
  fieldContainer: {
    marginBottom: SPACING.xxl,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  labelDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6,
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
  dropdownDisabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  dropdownIcon: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
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
  descriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  charCount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  textArea: {
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 140,
  },
  nextButton: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
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
  modalList: {
    maxHeight: 400,
  },
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
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: SPACING.xl,
    fontSize: FONT_SIZES.md,
  },
});

export default Step1CarDetails;
