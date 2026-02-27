import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HostBookingsScreen from "./screens/hostBookingScreen";

const Stack = createNativeStackNavigator();

export default function HostBookingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostBookingsHome" component={HostBookingsScreen} />
    </Stack.Navigator>
  );
}
