import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import IntercityHomeScreen from "./screens/intercityHomeScreen";
import IntercityBookingSummaryScreen from "./screens/bookingScreen";

const Stack = createNativeStackNavigator();

export default function IntercityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="IntercityHome" component={IntercityHomeScreen} />
      <Stack.Screen
        name="BookingSummary"
        component={IntercityBookingSummaryScreen}
      />
    </Stack.Navigator>
  );
}
