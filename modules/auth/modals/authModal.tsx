import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

const API_BASE = "https://zipdrive.in/api";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
}

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const insets = useSafeAreaInsets();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  const validate = () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password required");
      return false;
    }

    if (!isLogin && (!name || !phone)) {
      Alert.alert("Error", "All fields required");
      return false;
    }

    if (!isLogin && phone.length !== 10) {
      Alert.alert("Error", "Phone must be 10 digits");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Invalid email");
      return false;
    }

    return true;
  };
  const decodeJWT = (token: string) => {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const endpoint = isLogin
        ? `${API_BASE}/users/login`
        : `${API_BASE}/users/register`;

      const body = isLogin
        ? { email, password }
        : { name, email, phone, password, role: "guest" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      if (!data.token) {
        throw new Error("Token missing from server response");
      }

      // ✅ Decode token → build user object
      const payload = decodeJWT(data.token);

      if (!payload) {
        throw new Error("Invalid token");
      }

      const user = {
        id: String(payload.id),
        email: payload.email,
        role: payload.role,
      };

      onSuccess(user, data.token);

      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert("Auth Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View
          style={[
            styles.modalContent,
            { paddingBottom: insets.bottom + SPACING.lg },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isLogin ? "Login to Continue" : "Create Account"}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              {isLogin
                ? "Login to verify documents and complete booking"
                : "Create account to book your ride"}
            </Text>

            {!isLogin && (
              <Input
                label="Full Name"
                icon="person-outline"
                value={name}
                onChangeText={setName}
              />
            )}

            <Input
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            {!isLogin && (
              <Input
                label="Phone"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                prefix="+91"
              />
            )}

            <Input
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              secure
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator color={COLORS.background} />
                  <Text style={styles.submitText}>Please wait...</Text>
                </>
              ) : (
                <Text style={styles.submitText}>
                  {isLogin ? "Login" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.toggle}>
              <Text style={styles.toggleText}>
                {isLogin ? "No account?" : "Already registered?"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsLogin(!isLogin);
                  resetForm();
                }}
              >
                <Text style={styles.toggleLink}>
                  {isLogin ? "Sign Up" : "Login"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* --- Input Component --- */

function Input({
  label,
  icon,
  value,
  onChangeText,
  keyboardType,
  secure,
  prefix,
}: any) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secure}
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>
    </View>
  );
}

/* --- Styles --- */

const styles = StyleSheet.create({
  modalOverlay: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  inputContainer: { marginBottom: SPACING.lg },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs,
    color: COLORS.textPrimary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingLeft: SPACING.sm,
    color: COLORS.textPrimary,
  },
  prefix: {
    marginLeft: SPACING.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  submitText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  disabled: { opacity: 0.6 },
  toggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  toggleText: { color: COLORS.textSecondary },
  toggleLink: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
