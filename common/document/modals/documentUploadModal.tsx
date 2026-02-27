// DocumentUploadModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { documentService } from "../../../common/document/document.service";

interface DocumentUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string;
}

interface DocState {
  uri?: string;
  status: "idle" | "uploading" | "uploaded" | "error";
  errorMsg?: string;
}

const REQUIRED_DOCUMENTS = [
  {
    id: "aadhar",
    label: "Aadhaar Card",
    icon: "card-outline",
    description: "Front side – clear & readable",
    doc_type: "Aadhaar",
  },
  {
    id: "driving_license",
    label: "Driving Licence",
    icon: "document-text-outline",
    description: "Both sides if applicable",
    doc_type: "Driver's License",
  },
  {
    id: "profile_photo",
    label: "Profile Photo",
    icon: "person-circle-outline",
    description: "Clear, recent photo (optional)",
    doc_type: null, // not used in eligibility
    optional: true,
  },
];

export default function DocumentUploadModal({
  visible,
  onClose,
  onSuccess,
  token,
}: DocumentUploadModalProps) {
  const insets = useSafeAreaInsets();

  const [docs, setDocs] = useState<Record<string, DocState>>(() =>
    REQUIRED_DOCUMENTS.reduce(
      (acc, d) => ({ ...acc, [d.id]: { status: "idle" } }),
      {} as Record<string, DocState>,
    ),
  );

  const [submitting, setSubmitting] = useState(false);

  // Optional: pre-load already uploaded documents (if you have getUserDocuments endpoint)
  useEffect(() => {
    if (visible && token) {
      loadExistingDocuments();
    }
  }, [visible, token]);

  const loadExistingDocuments = async () => {
    try {
      const existing = await documentService.getUserDocuments(token);
      const newState: Record<string, DocState> = { ...docs };

      existing.forEach((doc: any) => {
        const matching = REQUIRED_DOCUMENTS.find(
          (d) => d.doc_type === doc.doc_type,
        );
        if (matching) {
          newState[matching.id] = {
            uri: doc.image,
            status:
              doc.verification_status === "Verified" ? "uploaded" : "uploaded", // show as uploaded anyway
          };
        }
      });

      setDocs(newState);
    } catch (err) {
      console.log("Could not load existing documents", err);
    }
  };

  const hasAllRequired = () =>
    REQUIRED_DOCUMENTS.filter((d) => !d.optional).every(
      (d) => docs[d.id]?.status === "uploaded",
    );

  const pickImage = async (docId: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ← change here
      allowsEditing: true,
      quality: 0.82,
      aspect: docId === "profile_photo" ? [1, 1] : [4, 3],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await upload(docId, result.assets[0].uri);
    }
  };

  const takePhoto = async (docId: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.82,
      aspect: docId === "profile_photo" ? [1, 1] : [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      await upload(docId, result.assets[0].uri);
    }
  };

  const upload = async (docId: string, uri: string) => {
    const doc = REQUIRED_DOCUMENTS.find((d) => d.id === docId);
    if (!doc) return;

    setDocs((prev) => ({
      ...prev,
      [docId]: { uri, status: "uploading" },
    }));

    try {
      if (doc.id === "profile_photo") {
        await documentService.uploadProfilePic(token, uri);
      } else if (doc.doc_type) {
        await documentService.uploadDocument(token, uri, doc.doc_type);
      }

      setDocs((prev) => ({
        ...prev,
        [docId]: { uri, status: "uploaded" },
      }));
    } catch (err: any) {
      setDocs((prev) => ({
        ...prev,
        [docId]: {
          uri,
          status: "error",
          errorMsg: err.message || "Upload failed",
        },
      }));
      Alert.alert("Upload failed", err.message || "Please try again");
    }
  };

  const showOptions = (docId: string) =>
    Alert.alert("Upload", "Choose source", [
      { text: "Camera", onPress: () => takePhoto(docId) },
      { text: "Gallery", onPress: () => pickImage(docId) },
      { text: "Cancel", style: "cancel" },
    ]);

  const handleSubmit = async () => {
    if (!hasAllRequired()) {
      Alert.alert("Incomplete", "Please upload Aadhaar and Driving Licence.");
      return;
    }

    setSubmitting(true);

    try {
      const eligibility = await documentService.checkBookingEligibility(token);

      if (eligibility.eligible) {
        Alert.alert(
          "Success",
          "Documents are verified. You can now proceed with booking.",
          [
            {
              text: "Continue",
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ],
        );
      } else {
        Alert.alert(
          "Pending Review",
          eligibility.reason ||
            "Your documents are uploaded and under review. You'll be notified soon.",
          [{ text: "OK" }],
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not verify status");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.container,
            {
              paddingBottom: insets.bottom + SPACING.lg,
              paddingTop: insets.top,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>KYC Verification</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.subtitle}>
              Upload clear photos of your Aadhaar and Driving Licence to verify
              your identity. Profile photo is optional.
            </Text>

            {REQUIRED_DOCUMENTS.map((doc) => {
              const state = docs[doc.id] || { status: "idle" };

              return (
                <View key={doc.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Ionicons
                      size={32}
                      color={
                        state.status === "uploaded"
                          ? COLORS.success
                          : state.status === "error"
                            ? COLORS.error
                            : COLORS.primary
                      }
                      style={styles.icon}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>
                        {doc.label} {doc.optional && "(optional)"}
                      </Text>
                      <Text style={styles.desc}>{doc.description}</Text>
                    </View>

                    {state.status === "uploaded" && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.success}
                      />
                    )}
                    {state.status === "error" && (
                      <Ionicons
                        name="alert-circle"
                        size={24}
                        color={COLORS.error}
                      />
                    )}
                  </View>

                  {state.status === "uploading" ? (
                    <View style={styles.uploading}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.uploadingText}>Uploading...</Text>
                    </View>
                  ) : state.uri ? (
                    <View style={styles.previewRow}>
                      <Image
                        source={{ uri: state.uri }}
                        style={styles.preview}
                      />
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => showOptions(doc.id)}
                      >
                        <Text style={styles.changeText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => showOptions(doc.id)}
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={styles.uploadText}>Upload Photo</Text>
                    </TouchableOpacity>
                  )}

                  {state.errorMsg && (
                    <Text style={styles.errorText}>{state.errorMsg}</Text>
                  )}
                </View>
              );
            })}

            <View style={styles.note}>
              <Ionicons name="information" size={20} color={COLORS.primary} />
              <Text style={styles.noteText}>
                Documents are securely stored and typically verified within 24
                hours.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submit,
                (!hasAllRequired() || submitting) && styles.submitDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!hasAllRequired() || submitting}
            >
              {submitting ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.submitText}>Checking...</Text>
                </>
              ) : (
                <Text style={styles.submitText}>Submit Documents</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  overlay: { flex: 1 },
  backdrop: {
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    paddingHorizontal: SPACING.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  icon: { marginRight: SPACING.md },
  label: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  uploading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  uploadingText: { color: COLORS.primary, fontSize: FONT_SIZES.sm },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  changeBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  changeText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.sm,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  uploadText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  note: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  noteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  submit: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
} as const;
