import React, { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  // 👆 END AUTO-LOGIN

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="App" component={AppNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
    </Stack.Navigator>
  );
}
