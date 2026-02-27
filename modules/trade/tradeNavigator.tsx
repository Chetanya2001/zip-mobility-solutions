import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TradeHomeScreen from "./screens/tradeHomeScreen";

const Stack = createNativeStackNavigator();

export default function TradeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TradeHome" component={TradeHomeScreen} />
    </Stack.Navigator>
  );
}
