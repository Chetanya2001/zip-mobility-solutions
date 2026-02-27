import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SelfDriveHomeScreen from "./screens/selfDriveHomeScreen";
import CarDetailsScreen from "../../common/carDetails/carDetailsScreen";
import BookingSummaryScreen from "./screens/bookingScreen";
// import CarDetailsScreen from "../screens/CarDetailsScreen";

const Stack = createNativeStackNavigator();

export default function SelfDriveNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SelfDriveHome" component={SelfDriveHomeScreen} />
      <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
      <Stack.Screen name="BookingSummary" component={BookingSummaryScreen} />
    </Stack.Navigator>
  );
}
