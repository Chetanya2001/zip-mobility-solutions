import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONT_SIZES, FONT_WEIGHTS } from "../constants/theme";
import HostedCarsNavigator from "../modules/host/hostCarNavigator";
import HostBookingsNavigator from "../modules/host/hostedBookingNavigator";
import EarningsNavigator from "../modules/host/earningNavigator";
import ProfileNavigator from "../modules/profile/profileNavigator";

const Tab = createBottomTabNavigator();

export default function HostNavigator() {
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
        name="HostedCars"
        component={HostedCarsNavigator}
        options={{
          title: "My Cars",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="HostBookings"
        component={HostBookingsNavigator}
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={EarningsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash" size={26} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={26} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
