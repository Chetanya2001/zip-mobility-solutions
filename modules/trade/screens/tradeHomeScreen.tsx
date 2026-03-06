import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { ParamListBase, useNavigation } from "@react-navigation/native";

import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";

import BuyRequestScreen from "./buyRequestScreen";
import SellCarScreen from "./sellCarScreen";

export default function TradeHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<ParamListBase>>();
  const [tab, setTab] = useState<"buy" | "sell">("buy");

  const openDrawer = () => {
    const parent =
      navigation.getParent() as DrawerNavigationProp<ParamListBase>;
    parent?.openDrawer();
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={openDrawer}>
          <Ionicons name="menu" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <Text style={s.headerTitle}>Zip Trade</Text>

        <TouchableOpacity>
          <Ionicons
            name="notifications-outline"
            size={26}
            color={COLORS.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={[s.tabBtn, tab === "buy" && s.tabBtnActive]}
          onPress={() => setTab("buy")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="search-outline"
            size={15}
            color={tab === "buy" ? COLORS.background : COLORS.textSecondary}
          />
          <Text style={[s.tabText, tab === "buy" && s.tabTextActive]}>
            Buy Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tabBtn, tab === "sell" && s.tabBtnActive]}
          onPress={() => setTab("sell")}
          activeOpacity={0.85}
        >
          <Ionicons
            name="pricetag-outline"
            size={15}
            color={tab === "sell" ? COLORS.background : COLORS.textSecondary}
          />
          <Text style={[s.tabText, tab === "sell" && s.tabTextActive]}>
            Sell My Car
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === "sell" ? (
        <SellCarScreen onSuccess={() => navigation.goBack()} />
      ) : (
        <BuyRequestScreen onSuccess={() => navigation.goBack()} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
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

  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  tabBar: {
    flexDirection: "row",
    marginHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.full,
    padding: 4,
  },

  tabBtn: {
    flex: 1,
    flexDirection: "row",
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },

  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
  },

  tabTextActive: {
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
