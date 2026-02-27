import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import EarningsScreen from "./screens/earningScreen";

const Stack = createNativeStackNavigator();

export default function EarningsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EarningsHome" component={EarningsScreen} />
    </Stack.Navigator>
  );
}
