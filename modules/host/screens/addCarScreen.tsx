// src/screens/host/AddCarScreen.tsx  (or similar path)
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import AddCarWizard from "../screens/wizard/addCarWizard"; // adjust path
import { COLORS } from "../../../constants/theme";

interface AddCarScreenProps {
  navigation: any;
}

export default function AddCarScreen({ navigation }: AddCarScreenProps) {
  const [wizardStarted, setWizardStarted] = useState(false);

  // Auto-start wizard right after screen mounts (small delay optional for animation feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setWizardStarted(true);
    }, 300); // ← optional tiny delay so screen fade-in feels natural

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Optional: Show a brief header/title before wizard takes over */}
      {!wizardStarted ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.title}>Adding New Car...</Text>
        </View>
      ) : (
        <>
          {/* You can keep a small header if you want */}

          <AddCarWizard navigation={navigation} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    padding: 16,
    textAlign: "center",
    // or put in a custom header component
  },
});
