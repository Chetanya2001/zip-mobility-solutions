import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONT_SIZES } from "../../../constants/theme";

export default function EditCarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Edit Car</Text>
      <Text style={styles.subtext}>Coming Soon...</Text>
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
    marginBottom: SPACING.sm,
  },
  subtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
