import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ServiceHomeScreen from "./screens/serviceHomeScreen";
import ServiceBookingConfirmScreen from "./screens/bookingScreen";
import ServiceBookingSuccessScreen from "./screens/ServiceBookingSuccess";

const Stack = createNativeStackNavigator();

export default function ServiceNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ServiceHome" component={ServiceHomeScreen} />
      <Stack.Screen
        name="ServiceBookingConfirm"
        component={ServiceBookingConfirmScreen}
      />
      <Stack.Screen
        name="ServiceBookingSuccess" // ← must match exactly
        component={ServiceBookingSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }} // prevent swipe-back
      />
    </Stack.Navigator>
  );
}
