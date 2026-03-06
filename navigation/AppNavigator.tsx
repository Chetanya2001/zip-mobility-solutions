import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useAuthStore } from "../store/auth.store";
import GuestNavigator from "./GuestNavigator";
import HostNavigator from "./HostNavigator";
import CustomDrawerContent from "../components/customDrawerContent";
import MyCarsScreen from "../modules/drawer/screens/myCarsScreen";
import MyBookingsScreen from "../modules/drawer/screens/myBookingScreen";
import PaymentHistoryScreen from "../modules/drawer/screens/paymentHistoryScreen";
import SettingsScreen from "../modules/drawer/screens/settingScreen";
import HelpScreen from "../modules/drawer/screens/helpScreen";
import { COLORS } from "../constants/theme";

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
  const user = useAuthStore((state) => state.user);

  // Use viewMode (set by switchRole) — falls back to role on first login
  const isHost = (user?.viewMode ?? user?.role) === "host";

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: "right",
        drawerType: "slide",
        drawerStyle: { backgroundColor: COLORS.background, width: 300 },
        overlayColor: COLORS.overlay,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={isHost ? HostNavigator : GuestNavigator}
        options={{ swipeEnabled: true }}
      />

      {/* Visible to both host and guest */}
      <Drawer.Screen name="MyCars" component={MyCarsScreen} />
      <Drawer.Screen name="MyBookings" component={MyBookingsScreen} />
      <Drawer.Screen name="PaymentHistory" component={PaymentHistoryScreen} />

      {/* Always registered */}
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      <Drawer.Screen name="Help" component={HelpScreen} />
    </Drawer.Navigator>
  );
}
