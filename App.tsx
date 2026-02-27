import "react-native-reanimated";
import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./navigation/RootNavigator";
import { useAuthStore } from "./store/auth.store";
export default function App() {
  const { isHydrated } = useAuthStore();
  if (!isHydrated) return null;
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
