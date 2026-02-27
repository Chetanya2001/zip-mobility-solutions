import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
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

interface Step5ImagesProps {
  onNext: (data: ImagesData) => void;
  onBack: () => void;
  defaultValues?: Partial<ImagesData>;
  carId: number;
}

interface ImagesData {
  images: any[];
}

const MAX_IMAGES = 10;
const MIN_IMAGES = 3;

const Step5Images: React.FC<Step5ImagesProps> = ({
  onNext,
  onBack,
  defaultValues = {},
  carId,
}) => {
  const addImage = useAddCarStore((state) => state.addImage);
  const [images, setImages] = useState<any[]>(defaultValues.images || []);
  const [loading, setLoading] = useState(false);

  const canAddMore = images.length < MAX_IMAGES;

  const pickMultipleImages = async () => {
    if (!canAddMore) {
      Alert.alert("Limit Reached", `Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
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
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [16, 9],
      });
      if (!result.canceled && result.assets.length > 0) {
        if (images.length + result.assets.length > MAX_IMAGES) {
          Alert.alert(
            "Too Many Images",
            `You can upload a maximum of ${MAX_IMAGES} images.`,
          );
          return;
        }
        setImages((prev) => [...prev, ...result.assets]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick images.");
    }
  };

  const takePhoto = async () => {
    if (!canAddMore) {
      Alert.alert("Limit Reached", `Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera access is needed.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [16, 9],
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0]) {
        setImages((prev) => [...prev, result.assets[0]]);
      }
    } catch {
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const pickSingleImage = async () => {
    if (!canAddMore) {
      Alert.alert("Limit Reached", `Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Grant photo permissions");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [16, 9],
      });
      if (!result.canceled && result.assets[0]) {
        setImages((prev) => [...prev, result.assets[0]]);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const removeImage = (index: number) => {
    Alert.alert("Remove Image", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setImages((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  };

  const handleNext = async () => {
    if (images.length < MIN_IMAGES) {
      Alert.alert(
        "Minimum Images Required",
        `Upload at least ${MIN_IMAGES} images.`,
      );
      return;
    }
    setLoading(true);
    try {
      await addImage({ car_id: carId, images });
      onNext({ images });
    } catch {
      Alert.alert("Upload Failed", "Failed to upload images.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = images.length >= MIN_IMAGES;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Vehicle Images</Text>
        <Text style={styles.subtitle}>
          Upload clear photos from different angles to attract more renters.
        </Text>

        {/* Counter badge */}
        <View style={styles.counterRow}>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              {images.length} / {MAX_IMAGES} images
            </Text>
          </View>
          <Text style={styles.counterHint}>
            {images.length < MIN_IMAGES
              ? `Need ${MIN_IMAGES - images.length} more`
              : "✓ Ready to continue"}
          </Text>
        </View>

        {/* Guidelines */}
        <View style={styles.fieldContainer}>
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>📸</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Image Guidelines</Text>
              <Text style={styles.infoText}>
                • Minimum {MIN_IMAGES} images, maximum {MAX_IMAGES}
                {"\n"}• Include interior & exterior shots{"\n"}• Good lighting
                recommended{"\n"}• First image will be used as cover photo
              </Text>
            </View>
          </View>
        </View>

        {/* Upload Buttons */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Add Images</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              !canAddMore && styles.uploadButtonDisabled,
            ]}
            onPress={takePhoto}
            disabled={!canAddMore}
            activeOpacity={0.7}
          >
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>📷</Text>
              <Text style={styles.uploadText}>Take Photo</Text>
              <Text style={styles.uploadSubtext}>
                Use camera to take a new photo
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              !canAddMore && styles.uploadButtonDisabled,
            ]}
            onPress={pickSingleImage}
            disabled={!canAddMore}
            activeOpacity={0.7}
          >
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>🖼️</Text>
              <Text style={styles.uploadText}>Add Single Image</Text>
              <Text style={styles.uploadSubtext}>Pick and crop one image</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.fieldContainer}>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              !canAddMore && styles.uploadButtonDisabled,
            ]}
            onPress={pickMultipleImages}
            disabled={!canAddMore}
            activeOpacity={0.7}
          >
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>📂</Text>
              <Text style={styles.uploadText}>Add Multiple Images</Text>
              <Text style={styles.uploadSubtext}>
                Select several photos at once
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Image Grid */}
        {images.length > 0 && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Uploaded Photos</Text>
            <View style={styles.imagesGrid}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageCard}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverBadgeText}>Cover</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

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
            style={[
              styles.nextButton,
              (!isFormValid || loading) && styles.nextButtonDisabled,
            ]}
            disabled={!isFormValid || loading}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {loading ? "Uploading..." : "Next Step →"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xxl,
  },
  counterBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  counterText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  counterHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  fieldContainer: { marginBottom: SPACING.xxl },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIcon: { fontSize: FONT_SIZES.xxl },
  infoTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
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
  uploadButtonDisabled: { opacity: 0.4 },
  uploadPlaceholder: { alignItems: "center", paddingVertical: SPACING.md },
  uploadIcon: { fontSize: 48, marginBottom: SPACING.md },
  uploadText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  uploadSubtext: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
  },
  imageCard: {
    width: "47%",
    aspectRatio: 16 / 9,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    backgroundColor: COLORS.cardBackgroundLight,
  },
  image: { width: "100%", height: "100%" },
  coverBadge: {
    position: "absolute",
    bottom: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  coverBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  removeBtn: {
    position: "absolute",
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.error,
    width: 26,
    height: 26,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: { color: "#fff", fontSize: 12, fontWeight: "bold" },
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
});

export default Step5Images;
