import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import AuthModal from "../modules/auth/modals/authModal";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../constants/theme";
import { useAuthStore } from "../store/auth.store";

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: string;
}

export default function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const switchRole = useAuthStore((s) => s.switchRole);
  const logout = useAuthStore((s) => s.logout);
  const getProfile = useAuthStore((s) => s.getProfile);

  const [modalVisible, setModalVisible] = useState(false);
  const [startWithLogin, setStartWithLogin] = useState(true);

  React.useEffect(() => {
    if (isAuthenticated) getProfile();
  }, [isAuthenticated]);

  const isHost = user?.viewMode === "host";

  const handleRoleSwitch = (value: boolean) => {
    switchRole(value ? "host" : "guest");
    props.navigation.navigate("MainTabs");
    props.navigation.closeDrawer();
  };

  const openModal = (isLoginMode: boolean) => {
    setStartWithLogin(isLoginMode);
    setModalVisible(true);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  const handleNavigation = (screen: string) => {
    props.navigation.navigate(screen);
    props.navigation.closeDrawer();
  };

  const authenticatedMenuItems: MenuItem[] = isHost
    ? []
    : [
        {
          id: "1",
          icon: "car-sport-outline",
          label: "My Cars",
          onPress: () => handleNavigation("MyCars"),
        },
        {
          id: "2",
          icon: "calendar-outline",
          label: "Bookings",
          onPress: () => handleNavigation("MyBookings"),
        },
        {
          id: "3",
          icon: "card-outline",
          label: "Payment History",
          onPress: () => handleNavigation("PaymentHistory"),
        },
      ];

  // ── Renderers ─────────────────────────────────────────────────────────────
  const renderUnauthenticatedHeader = () => (
    <View style={styles.unauthHeader}>
      <View style={styles.unauthIconContainer}>
        <Ionicons
          name="person-circle-outline"
          size={64}
          color={COLORS.textSecondary}
        />
      </View>
      <Text style={styles.unauthTitle}>Welcome!</Text>
      <Text style={styles.unauthSubtitle}>Sign in to access your account</Text>
      <View style={styles.authButtons}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => openModal(true)}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => openModal(false)}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAuthenticatedHeader = () => (
    <View style={styles.authHeader}>
      <Image
        source={{
          uri:
            user?.avatar ||
            `https://ui-avatars.com/api/?name=${user?.name}&background=01d28e&color=fff`,
        }}
        style={styles.avatar}
      />
      <Text style={styles.userName}>{user?.name || "User"}</Text>
      <Text style={{ color: COLORS.textSecondary }}>{user?.email}</Text>

      <View style={[styles.roleBadge, isHost && styles.roleBadgeHost]}>
        <Ionicons
          name={isHost ? "star" : "person"}
          size={12}
          color={COLORS.primary}
        />
        <Text style={styles.roleText}>
          {isHost ? "Host Mode" : "Guest Mode"}
        </Text>
      </View>
    </View>
  );

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemIcon}>
        <Ionicons name={item.icon} size={22} color={COLORS.textPrimary} />
      </View>
      <Text style={styles.menuItemText}>{item.label}</Text>
      {item.badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  // CHANGED: removed isHostAccount guard — toggle visible to ALL authenticated users
  const renderRoleSwitcher = () => (
    <View style={styles.switchContainer}>
      <View style={styles.switchInfo}>
        <Ionicons
          name={isHost ? "business-outline" : "person-outline"}
          size={22}
          color={COLORS.textPrimary}
        />
        <Text style={styles.switchLabel}>
          {isHost ? "Switch to Guest Mode" : "Switch to Host Mode"}
        </Text>
      </View>
      <Switch
        value={isHost}
        onValueChange={handleRoleSwitch}
        trackColor={{ false: COLORS.border, true: `${COLORS.primary}80` }}
        thumbColor={isHost ? COLORS.primary : COLORS.textSecondary}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );

  return (
    <>
      <DrawerContentScrollView
        {...props}
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          {isAuthenticated
            ? renderAuthenticatedHeader()
            : renderUnauthenticatedHeader()}

          {/* My Account menu (mode-aware) */}
          {isAuthenticated && authenticatedMenuItems.length > 0 && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>MY ACCOUNT</Text>
              {authenticatedMenuItems.map(renderMenuItem)}
            </View>
          )}

          {/* Role switcher — all authenticated users */}
          {isAuthenticated && (
            <View style={styles.menuSection}>
              <Text style={styles.sectionTitle}>PREFERENCES</Text>
              {renderRoleSwitcher()}
            </View>
          )}

          {/* App */}
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>APP</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation("Settings")}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="settings-outline"
                  size={22}
                  color={COLORS.textPrimary}
                />
              </View>
              <Text style={styles.menuItemText}>Settings</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigation("Help")}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemIcon}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={COLORS.textPrimary}
                />
              </View>
              <Text style={styles.menuItemText}>Help & Support</Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          {isAuthenticated && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </DrawerContentScrollView>

      <AuthModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={(user: any, token: any) => {
          useAuthStore.getState().setAuthData(user, token);
          setModalVisible(false);
          props.navigation.closeDrawer();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  drawerContent: { flex: 1 },
  container: { flex: 1, backgroundColor: COLORS.background },

  // Unauthenticated header
  unauthHeader: {
    padding: SPACING.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  unauthIconContainer: { marginBottom: SPACING.md },
  unauthTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  unauthSubtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  authButtons: { width: "100%", gap: SPACING.md },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
  signupButton: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signupButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Authenticated header
  authHeader: {
    padding: SPACING.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
  },
  userName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs,
  },
  roleBadgeHost: { backgroundColor: `${COLORS.primary}25` },
  roleText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Menu
  menuSection: { marginBottom: SPACING.xl, paddingHorizontal: SPACING.xl },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  badge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.sm,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Role switcher
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  switchLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: `${COLORS.error}15`,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  logoutText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  version: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
});
