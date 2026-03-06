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

type Role = "guest" | "host";

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (user: any, token: string) => void;
  initialMode?: "login" | "signup";
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable field
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  value,
  onChangeText,
  keyboardType,
  secure,
  prefix,
  placeholder,
  autoCapitalize,
}: any) {
  const [showPass, setShowPass] = useState(false);

  return (
    <View style={st.field}>
      <Text style={st.fieldLabel}>{label}</Text>
      <View style={st.fieldRow}>
        <Ionicons name={icon} size={18} color={COLORS.textSecondary} />
        {prefix && <Text style={st.prefix}>{prefix}</Text>}
        <TextInput
          style={st.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? "default"}
          secureTextEntry={secure && !showPass}
          placeholderTextColor={COLORS.textSecondary}
          placeholder={placeholder ?? ""}
          autoCapitalize={autoCapitalize ?? "none"}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
            <Ionicons
              name={showPass ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Role picker
// ─────────────────────────────────────────────────────────────────────────────
function RolePicker({
  value,
  onChange,
}: {
  value: Role;
  onChange: (r: Role) => void;
}) {
  const options: {
    role: Role;
    icon: any;
    title: string;
    sub: string;
    color: string;
  }[] = [
    {
      role: "guest",
      icon: "person-outline",
      title: "Rent a Car",
      sub: "Book rides as guest",
      color: COLORS.primary,
    },
    {
      role: "host",
      icon: "car-outline",
      title: "List My Car",
      sub: "Earn by hosting",
      color: "#8B5CF6",
    },
  ];

  return (
    <View style={st.field}>
      <Text style={st.fieldLabel}>I want to</Text>
      <View style={st.roleRow}>
        {options.map((opt) => {
          const active = value === opt.role;
          return (
            <TouchableOpacity
              key={opt.role}
              style={[
                st.roleCard,
                active && {
                  borderColor: opt.color,
                  backgroundColor: opt.color + "0D",
                },
              ]}
              onPress={() => onChange(opt.role)}
              activeOpacity={0.8}
            >
              {/* check */}
              {active && (
                <View style={[st.roleCheck, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}

              <View
                style={[
                  st.roleIconCircle,
                  active && { backgroundColor: opt.color },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={active ? "#fff" : COLORS.textSecondary}
                />
              </View>
              <Text style={[st.roleTitle, active && { color: opt.color }]}>
                {opt.title}
              </Text>
              <Text style={st.roleSub}>{opt.sub}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification success screen
// ─────────────────────────────────────────────────────────────────────────────
function VerificationSent({
  email,
  onGoToLogin,
}: {
  email: string;
  onGoToLogin: () => void;
}) {
  return (
    <View style={st.verifyWrap}>
      {/* icon */}
      <View style={st.verifyIconBg}>
        <Ionicons name="mail" size={44} color={COLORS.primary} />
      </View>

      <Text style={st.verifyTitle}>Check your inbox</Text>

      <Text style={st.verifySub}>
        We sent a verification link to{"\n"}
        <Text style={st.verifyEmail}>{email}</Text>
      </Text>

      <Text style={st.verifyHint}>
        Open the email and tap the link to activate your account. Once verified,
        come back here and log in.
      </Text>

      {/* steps */}
      {[
        { n: "1", text: "Open your email app" },
        { n: "2", text: 'Find the email from "Zip Drive Support Team"' },
        { n: "3", text: "Tap Verify Account" },
        { n: "4", text: "Return here and log in" },
      ].map((step) => (
        <View key={step.n} style={st.step}>
          <View style={st.stepBadge}>
            <Text style={st.stepNum}>{step.n}</Text>
          </View>
          <Text style={st.stepText}>{step.text}</Text>
        </View>
      ))}

      <TouchableOpacity style={st.verifyBtn} onPress={onGoToLogin}>
        <Ionicons name="log-in-outline" size={20} color={COLORS.background} />
        <Text style={st.verifyBtnText}>Go to Login</Text>
      </TouchableOpacity>

      <Text style={st.verifyNote}>
        Didn't receive it? Check your spam folder or contact support.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthModal({
  visible,
  onClose,
  onSuccess,
  initialMode = "login",
}: AuthModalProps) {
  const insets = useSafeAreaInsets();

  // view state — sync to initialMode whenever modal opens
  const [mode, setMode] = useState<"login" | "signup" | "verified">(
    initialMode as any,
  );
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible) setMode(initialMode as any);
  }, [visible, initialMode]);

  // login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // signup
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [role, setRole] = useState<Role>("guest");

  // ── helpers ──────────────────────────────────────────────────────────────
  const resetAll = () => {
    setLoginEmail("");
    setLoginPassword("");
    setFirstName("");
    setLastName("");
    setSignupEmail("");
    setPhone("");
    setSignupPassword("");
    setConfirmPass("");
    setRole("guest");
  };

  const handleClose = () => {
    resetAll();
    setMode("login");
    onClose();
  };

  const decodeJWT = (token: string) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  // ── validation ───────────────────────────────────────────────────────────
  const validateLogin = () => {
    if (!loginEmail.trim() || !loginPassword) {
      Alert.alert("Missing fields", "Email and password are required.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const validateSignup = () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "First name is required.");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Last name is required.");
      return false;
    }
    if (
      !signupEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)
    ) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length !== 10) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit mobile number.");
      return false;
    }
    if (signupPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return false;
    }
    if (signupPassword !== confirmPass) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return false;
    }
    return true;
  };

  // ── submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (mode === "login") {
      if (!validateLogin()) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/users/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: loginEmail.trim(),
            password: loginPassword,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        if (!data.token) throw new Error("No token received from server");

        const payload = decodeJWT(data.token);
        if (!payload) throw new Error("Invalid token received");

        onSuccess(
          {
            id: String(payload.id),
            email: payload.email,
            role: payload.role,
            viewMode: payload.role === "host" ? "host" : "guest",
          },
          data.token,
        );
        resetAll();
        onClose();
      } catch (err: any) {
        Alert.alert("Login failed", err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // signup
      if (!validateSignup()) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/users/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: signupEmail.trim().toLowerCase(),
            phone: phone.replace(/\D/g, ""),
            password: signupPassword,
            role,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        // Backend sends 201 + message (no token) — show verification screen
        setMode("verified");
      } catch (err: any) {
        Alert.alert("Registration failed", err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* tap outside to close */}
        <TouchableOpacity
          style={st.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={[st.sheet, { paddingBottom: insets.bottom + SPACING.lg }]}>
          {/* drag handle */}
          <View style={st.handle} />

          {/* ── Verification success ─────────────────────────────────── */}
          {mode === "verified" ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <VerificationSent
                email={signupEmail}
                onGoToLogin={() => {
                  resetAll();
                  setMode("login");
                }}
              />
            </ScrollView>
          ) : (
            <>
              {/* header */}
              <View style={st.sheetHeader}>
                <View>
                  <Text style={st.sheetTitle}>
                    {mode === "login" ? "Welcome back 👋" : "Create account"}
                  </Text>
                  <Text style={st.sheetSub}>
                    {mode === "login"
                      ? "Sign in to continue to ZipDrive"
                      : "Join ZipDrive — takes under a minute"}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose} style={st.closeBtn}>
                  <Ionicons name="close" size={26} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {mode === "login" ? (
                  /* ── LOGIN ─────────────────────────────────────────── */
                  <>
                    <Field
                      label="Email"
                      icon="mail-outline"
                      value={loginEmail}
                      onChangeText={setLoginEmail}
                      keyboardType="email-address"
                      placeholder="you@example.com"
                    />
                    <Field
                      label="Password"
                      icon="lock-closed-outline"
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      secure
                      placeholder="Your password"
                    />
                  </>
                ) : (
                  /* ── SIGNUP ─────────────────────────────────────────── */
                  <>
                    {/* role first — intent upfront */}
                    <RolePicker value={role} onChange={setRole} />

                    {/* name row */}
                    <View style={st.nameRow}>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="First Name"
                          icon="person-outline"
                          value={firstName}
                          onChangeText={setFirstName}
                          placeholder="John"
                          autoCapitalize="words"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Last Name"
                          icon="person-outline"
                          value={lastName}
                          onChangeText={setLastName}
                          placeholder="Doe"
                          autoCapitalize="words"
                        />
                      </View>
                    </View>

                    <Field
                      label="Email"
                      icon="mail-outline"
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      keyboardType="email-address"
                      placeholder="you@example.com"
                    />
                    <Field
                      label="Mobile Number"
                      icon="call-outline"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      prefix="+91"
                      placeholder="10-digit number"
                    />
                    <Field
                      label="Password"
                      icon="lock-closed-outline"
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      secure
                      placeholder="Min 6 characters"
                    />
                    <Field
                      label="Confirm Password"
                      icon="lock-closed-outline"
                      value={confirmPass}
                      onChangeText={setConfirmPass}
                      secure
                      placeholder="Re-enter password"
                    />

                    {/* role summary pill */}
                    <View
                      style={[
                        st.roleSummary,
                        role === "host"
                          ? st.roleSummaryHost
                          : st.roleSummaryGuest,
                      ]}
                    >
                      <Ionicons
                        name={
                          role === "host" ? "car-outline" : "person-outline"
                        }
                        size={14}
                        color={role === "host" ? "#8B5CF6" : COLORS.primary}
                      />
                      <Text
                        style={[
                          st.roleSummaryText,
                          {
                            color: role === "host" ? "#8B5CF6" : COLORS.primary,
                          },
                        ]}
                      >
                        Signing up as{" "}
                        {role === "host"
                          ? "Host — list & earn"
                          : "Guest — rent cars"}
                      </Text>
                    </View>
                  </>
                )}

                {/* submit */}
                <TouchableOpacity
                  style={[st.submitBtn, loading && st.submitDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color={COLORS.background} />
                      <Text style={st.submitText}>Please wait…</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name={
                          mode === "login"
                            ? "log-in-outline"
                            : "person-add-outline"
                        }
                        size={20}
                        color={COLORS.background}
                      />
                      <Text style={st.submitText}>
                        {mode === "login"
                          ? "Login"
                          : "Create Account & Send Verification Email"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* toggle */}
                <View style={st.toggleRow}>
                  <Text style={st.toggleText}>
                    {mode === "login"
                      ? "Don't have an account?"
                      : "Already registered?"}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      resetAll();
                      setMode(mode === "login" ? "signup" : "login");
                    }}
                  >
                    <Text style={st.toggleLink}>
                      {mode === "login" ? "Sign Up" : "Login"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)" },

  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    maxHeight: "94%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },

  // Header
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xl,
  },
  sheetTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sheetSub: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  closeBtn: { padding: SPACING.xs },

  // Field
  field: { marginBottom: SPACING.lg },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  fieldInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  prefix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Name row
  nameRow: { flexDirection: "row", gap: SPACING.md },

  // Role picker
  roleRow: { flexDirection: "row", gap: SPACING.md },
  roleCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 4,
    overflow: "hidden",
  },
  roleCheck: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  roleIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  roleTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  roleSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
  },

  // Role summary pill
  roleSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.lg,
  },
  roleSummaryGuest: { backgroundColor: COLORS.primary + "12" },
  roleSummaryHost: { backgroundColor: "#8B5CF620" },
  roleSummaryText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  submitText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  submitDisabled: { opacity: 0.6 },

  // Toggle
  toggleRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xl,
  },
  toggleText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  toggleLink: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },

  // Verification screen
  verifyWrap: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  verifyIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.xl,
  },
  verifyTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  verifySub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.sm,
  },
  verifyEmail: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.bold },
  verifyHint: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    width: "100%",
    marginBottom: SPACING.md,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  stepText: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    width: "100%",
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  verifyBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
  verifyNote: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
});
