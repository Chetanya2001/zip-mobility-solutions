import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from "../constants/theme";
import HomeNavigator from "../modules/home/homeNavigator";
import SelfDriveNavigator from "../modules/selfDrive/selfDriveNavigator";
import IntercityNavigator from "../modules/intercity/intercityNavigator";
import ServiceNavigator from "../modules/service/serviceNavigator";
import TradeNavigator from "../modules/trade/tradeNavigator";

const Tab = createBottomTabNavigator();

export default function GuestNavigator() {
  const insets = useSafeAreaInsets();

  const dynamicBottom = insets.bottom > 0 ? insets.bottom + 8 : 12;
  const dynamicHeight = 64 + (insets.bottom > 0 ? insets.bottom : 0);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarStyle: {
          backgroundColor: COLORS.tabBackground,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: dynamicHeight,
          paddingBottom: dynamicBottom,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontWeight: FONT_WEIGHTS.semibold,
        },
        lazy: true,
      }}
    >
      <Tab.Screen
        name="SelfDrive"
        component={SelfDriveNavigator}
        options={{
          title: "SELF-DRIVE",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Intercity"
        component={IntercityNavigator}
        options={{
          title: "INTERCITY",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={24} color={color} />
          ),
        }}
      />

      {/* CENTER HOME BUTTON */}
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          title: "HOME",
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <View
                style={[
                  styles.centerButtonInner,
                  focused && styles.centerButtonActive,
                ]}
              >
                <Ionicons
                  name="home"
                  size={28}
                  color={focused ? COLORS.background : COLORS.textPrimary}
                />
              </View>
            </View>
          ),
          tabBarLabel: () => null, // Hide label for center button
        }}
      />

      <Tab.Screen
        name="Service"
        component={ServiceNavigator}
        options={{
          title: "SERVICE",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="build" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trade"
        component={TradeNavigator}
        options={{
          title: "TRADE",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sync" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerButton: {
    position: "absolute",
    top: -30,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  centerButtonActive: {
    backgroundColor: COLORS.primary,
    transform: [{ scale: 1.05 }],
  },
});
