import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
} from "../../../constants/theme";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Settings</Text>
      <Text style={styles.subtext}>Manage your account settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  text: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  subtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
