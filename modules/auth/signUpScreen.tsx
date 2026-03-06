import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../constants/theme";

const API_BASE = "https://zipdrive.in/api";
type Role = "guest" | "host";

// ─────────────────────────────────────────────────────────────────────────────
// Field component
// ─────────────────────────────────────────────────────────────────────────────
function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secure,
  prefix,
  autoCapitalize,
}: any) {
  const [show, setShow] = useState(false);
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <Ionicons name={icon} size={20} color={COLORS.textSecondary} />
        {prefix && <Text style={s.prefix}>{prefix}</Text>}
        <TextInput
          style={s.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          keyboardType={keyboardType ?? "default"}
          secureTextEntry={secure && !show}
          autoCapitalize={autoCapitalize ?? "none"}
        />
        {secure && (
          <TouchableOpacity onPress={() => setShow((v) => !v)}>
            <Ionicons
              name={show ? "eye-off-outline" : "eye-outline"}
              size={20}
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
  const options = [
    {
      role: "guest" as Role,
      icon: "person-outline" as const,
      title: "Rent a Car",
      sub: "Book rides as guest",
      color: COLORS.primary,
    },
    {
      role: "host" as Role,
      icon: "car-outline" as const,
      title: "List My Car",
      sub: "Earn by hosting",
      color: "#8B5CF6",
    },
  ];

  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>I want to</Text>
      <View style={s.roleRow}>
        {options.map((opt) => {
          const active = value === opt.role;
          return (
            <TouchableOpacity
              key={opt.role}
              style={[
                s.roleCard,
                active && {
                  borderColor: opt.color,
                  backgroundColor: opt.color + "0D",
                },
              ]}
              onPress={() => onChange(opt.role)}
              activeOpacity={0.8}
            >
              {active && (
                <View style={[s.roleCheck, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}
              <View
                style={[
                  s.roleIconCircle,
                  active && { backgroundColor: opt.color },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={24}
                  color={active ? "#fff" : COLORS.textSecondary}
                />
              </View>
              <Text style={[s.roleTitle, active && { color: opt.color }]}>
                {opt.title}
              </Text>
              <Text style={s.roleSub}>{opt.sub}</Text>
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
    <View style={s.verifyWrap}>
      <View style={s.verifyIconBg}>
        <Ionicons name="mail" size={52} color={COLORS.primary} />
      </View>
      <Text style={s.verifyTitle}>Check your inbox</Text>
      <Text style={s.verifySub}>
        We sent a verification link to{"\n"}
        <Text style={s.verifyEmail}>{email}</Text>
      </Text>
      <Text style={s.verifyHint}>
        Open the email and tap the link to activate your account. Once verified,
        come back and log in.
      </Text>

      {[
        { n: "1", text: "Open your email app" },
        { n: "2", text: 'Find email from "Zip Drive Support Team"' },
        { n: "3", text: "Tap Verify Account" },
        { n: "4", text: "Return here and log in" },
      ].map((step) => (
        <View key={step.n} style={s.step}>
          <View style={s.stepBadge}>
            <Text style={s.stepNum}>{step.n}</Text>
          </View>
          <Text style={s.stepText}>{step.text}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.verifyBtn} onPress={onGoToLogin}>
        <Ionicons name="log-in-outline" size={20} color={COLORS.background} />
        <Text style={s.verifyBtnText}>Go to Login</Text>
      </TouchableOpacity>

      <Text style={s.verifyNote}>
        Didn't receive it? Check your spam folder.
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────────────────
export default function SignupScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [role, setRole] = useState<Role>("guest");

  // ── validation ──────────────────────────────────────────────────────────
  const validate = () => {
    if (!firstName.trim()) {
      Alert.alert("Required", "First name is required.");
      return false;
    }
    if (!lastName.trim()) {
      Alert.alert("Required", "Last name is required.");
      return false;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Enter a valid email address.");
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, "").length !== 10) {
      Alert.alert("Invalid phone", "Enter a valid 10-digit mobile number.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPass) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return false;
    }
    return true;
  };

  // ── submit ──────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    if (!validate()) return;
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
          email: email.trim().toLowerCase(),
          phone: phone.replace(/\D/g, ""),
          password,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      setVerified(true);
    } catch (err: any) {
      Alert.alert("Registration failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── verified screen ─────────────────────────────────────────────────────
  if (verified) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <VerificationSent
            email={email}
            onGoToLogin={() => navigation.goBack()}
          />
        </ScrollView>
      </View>
    );
  }

  // ── form ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + SPACING.md },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* back */}
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {/* header */}
        <View style={s.header}>
          <View style={s.logoCircle}>
            <Ionicons name="car-sport" size={36} color={COLORS.primary} />
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Join ZipDrive — takes under a minute</Text>
        </View>

        {/* Role picker — first so intent is clear */}
        <RolePicker value={role} onChange={setRole} />

        {/* name row */}
        <View style={s.nameRow}>
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
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
        />

        <Field
          label="Mobile Number"
          icon="call-outline"
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit number"
          keyboardType="phone-pad"
          prefix="+91"
        />

        <Field
          label="Password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          secure
        />

        <Field
          label="Confirm Password"
          icon="lock-closed-outline"
          value={confirmPass}
          onChangeText={setConfirmPass}
          placeholder="Re-enter password"
          secure
        />

        {/* role summary pill */}
        <View
          style={[
            s.roleSummary,
            role === "host" ? s.roleSummaryHost : s.roleSummaryGuest,
          ]}
        >
          <Ionicons
            name={role === "host" ? "car-outline" : "person-outline"}
            size={14}
            color={role === "host" ? "#8B5CF6" : COLORS.primary}
          />
          <Text
            style={[
              s.roleSummaryText,
              { color: role === "host" ? "#8B5CF6" : COLORS.primary },
            ]}
          >
            Signing up as{" "}
            {role === "host" ? "Host — list & earn" : "Guest — rent cars"}
          </Text>
        </View>

        {/* submit */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <>
              <ActivityIndicator color={COLORS.background} />
              <Text style={s.submitText}>Creating account…</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="person-add-outline"
                size={20}
                color={COLORS.background}
              />
              <Text style={s.submitText}>
                Create Account & Send Verification Email
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* login link */}
        <View style={s.loginRow}>
          <Text style={s.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={s.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },

  // Back
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },

  // Header
  header: { alignItems: "center", marginBottom: SPACING.xl },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.hero ?? 28,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  subtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },

  // Field
  fieldWrap: { marginBottom: SPACING.lg },
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
    height: 52,
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
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

  // Role summary
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    height: 56,
    marginBottom: SPACING.xl,
  },
  submitText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  submitDisabled: { opacity: 0.6 },

  // Login row
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  loginText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  loginLink: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Verification screen
  verifyWrap: { alignItems: "center", paddingVertical: SPACING.xl },
  verifyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + "15",
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
  },
});
