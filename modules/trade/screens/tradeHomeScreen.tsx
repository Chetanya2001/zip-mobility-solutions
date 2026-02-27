import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS, SPACING, FONT_SIZES } from "../../../constants/theme";

export default function TradeHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.text}>Car Trade</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.getParent()?.getParent()?.openDrawer()}
        >
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.subtext}>Buy or Sell Cars - Coming Soon...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  content: {
    flex: 1,
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
  profileButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
