import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { COLORS } from "../constants/theme";

export default function HeaderRight() {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={openDrawer}
      activeOpacity={0.7}
    >
      <Ionicons
        name="person-circle-outline"
        size={32}
        color={COLORS.textPrimary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
});
