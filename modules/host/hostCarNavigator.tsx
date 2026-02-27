import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HostedCarsScreen from "./screens/hostedCarScreen";
import AddCarScreen from "./screens/addCarScreen";
import EditCarScreen from "./screens/EditCarScreen";

const Stack = createNativeStackNavigator();

export default function HostedCarsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HostedCarsHome" component={HostedCarsScreen} />
      <Stack.Screen name="AddCar" component={AddCarScreen} />
      <Stack.Screen name="EditCar" component={EditCarScreen} />
    </Stack.Navigator>
  );
}
