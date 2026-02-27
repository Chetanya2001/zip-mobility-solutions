export const COLORS = {
  // Primary Colors
  primary: "#01d28e",
  primaryDark: "#00b377",
  primaryLight: "#33dca5",

  // Background Colors
  background: "#0a1220",
  cardBackground: "#141d2e",
  cardBackgroundLight: "#1a2332",

  // Text Colors
  textPrimary: "#ffffff",
  textSecondary: "#8b92a8",
  textTertiary: "#5a6376",

  // Border Colors
  border: "#1a2332",
  borderLight: "#2a3342",

  // Status Colors
  success: "#01d28e",
  error: "#ff4757",
  warning: "#ffa502",
  info: "#3742fa",

  // Tab Colors
  tabActive: "#01d28e",
  tabInactive: "#8b92a8",
  tabBackground: "#0a1220",

  // Overlay
  overlay: "rgba(10, 18, 32, 0.8)",
  overlayLight: "rgba(10, 18, 32, 0.6)",
  surface: "#1a2332",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24, // ← add this
  full: 9999,
};
export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  hero: 32,
};

export const FONT_WEIGHTS = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const SHADOWS = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
