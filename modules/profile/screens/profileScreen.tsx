import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
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
} from "../../../constants/theme";
import { useAuthStore } from "../../../store/auth.store";

interface MenuItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action: () => void;
  showChevron?: boolean;
  color?: string;
}

export default function ProfileScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { user, switchRole, logout } = useAuthStore();
  const isHost = user?.role === "host";

  const handleRoleSwitch = () => {
    Alert.alert(
      isHost ? "Switch to Guest Mode?" : "Switch to Host Mode?",
      isHost
        ? "You will be able to browse and rent cars"
        : "You will be able to list your cars and manage bookings",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Switch",
          onPress: () => switchRole(isHost ? "guest" : "host"),
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: logout,
      },
    ]);
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: "1",
      icon: "person-outline",
      title: "Edit Profile",
      subtitle: "Update your personal information",
      action: () => {},
      showChevron: true,
    },
    {
      id: "2",
      icon: "card-outline",
      title: "Payment Methods",
      subtitle: "Manage your payment options",
      action: () => {},
      showChevron: true,
    },
    {
      id: "3",
      icon: "location-outline",
      title: "Saved Addresses",
      subtitle: "Your frequently used locations",
      action: () => {},
      showChevron: true,
    },
  ];

  const appMenuItems: MenuItem[] = [
    {
      id: "4",
      icon: "notifications-outline",
      title: "Notifications",
      subtitle: "Manage notification preferences",
      action: () => {},
      showChevron: true,
    },
    {
      id: "5",
      icon: "shield-checkmark-outline",
      title: "Privacy & Security",
      subtitle: "Control your data and security",
      action: () => {},
      showChevron: true,
    },
    {
      id: "6",
      icon: "help-circle-outline",
      title: "Help & Support",
      subtitle: "Get help with your account",
      action: () => {},
      showChevron: true,
    },
  ];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity style={styles.settingsButton}>
        <Ionicons
          name="settings-outline"
          size={24}
          color={COLORS.textPrimary}
        />
      </TouchableOpacity>
    </View>
  );

  const renderProfileCard = () => (
    <View style={styles.profileCard}>
      <Image
        source={{
          uri:
            user?.avatar ||
            "https://ui-avatars.com/api/?name=Alex&background=c29958&color=fff",
        }}
        style={styles.profileImage}
      />
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{user?.name || "Alex Johnson"}</Text>
        <Text style={styles.profileEmail}>
          {user?.email || "alex@example.com"}
        </Text>
        <View style={styles.roleBadge}>
          <Ionicons
            name={isHost ? "star" : "person"}
            size={14}
            color={COLORS.primary}
          />
          <Text style={styles.roleBadgeText}>
            {isHost ? "Host Account" : "Guest Account"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderRoleSwitcher = () => (
    <TouchableOpacity
      style={styles.roleSwitcher}
      onPress={handleRoleSwitch}
      activeOpacity={0.7}
    >
      <View style={styles.roleSwitcherIcon}>
        <Ionicons
          name={isHost ? "person" : "business"}
          size={24}
          color={COLORS.primary}
        />
      </View>
      <View style={styles.roleSwitcherInfo}>
        <Text style={styles.roleSwitcherTitle}>
          {isHost ? "Switch to Guest Mode" : "Become a Host"}
        </Text>
        <Text style={styles.roleSwitcherSubtitle}>
          {isHost
            ? "Browse and rent cars from other hosts"
            : "List your car and start earning"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  const renderMenuSection = (title: string, items: MenuItem[]) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={item.action}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemIcon}>
            <Ionicons
              name={item.icon}
              size={22}
              color={item.color || COLORS.textPrimary}
            />
          </View>
          <View style={styles.menuItemContent}>
            <Text
              style={[
                styles.menuItemTitle,
                item.color && { color: item.color },
              ]}
            >
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          {item.showChevron && (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textSecondary}
            />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xxxl },
        ]}
      >
        {renderProfileCard()}
        {renderRoleSwitcher()}
        {renderMenuSection("Account", accountMenuItems)}
        {renderMenuSection("App Settings", appMenuItems)}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.cardBackgroundLight,
  },
  profileInfo: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  profileName: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs / 2,
  },
  profileEmail: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs / 2,
  },
  roleBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Role Switcher
  roleSwitcher: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xxl,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  roleSwitcherIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  roleSwitcherInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  roleSwitcherTitle: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
    marginBottom: SPACING.xs / 2,
  },
  roleSwitcherSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },

  // Menu Section
  menuSection: {
    marginBottom: SPACING.xl,
  },
  menuSectionTitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  menuItemTitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  menuItemSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.error}15`,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  logoutButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.error,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Version
  versionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
});
