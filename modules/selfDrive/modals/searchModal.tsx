import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { getCarLocation } from "../../../utils/locationIQ";

import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useSelfDriveStore } from "../../../store/selfDriveStore/selfDrive.store";

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SearchModal({ visible, onClose }: SearchModalProps) {
  console.log("📦 [MODAL] Rendered");
  console.log("📦 [MODAL] Visible:", visible);
  const [isPickupPickerVisible, setPickupPickerVisible] = useState(false);
  const [isDropoffPickerVisible, setDropoffPickerVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const searchFilters = useSelfDriveStore((s) => s.searchFilters);
  const setSearchFilters = useSelfDriveStore((s) => s.setSearchFilters);
  const searchCars = useSelfDriveStore((s) => s.searchCars);
  const isSearching = useSelfDriveStore((s) => s.isSearching);

  const [gettingLocation, setGettingLocation] = useState(false);

  // ────────────────────────────────────────────────
  //  Date/Time Pickers (Platform-aware)
  // ────────────────────────────────────────────────
  const handlePickupConfirm = (date: Date) => {
    setSearchFilters({ pickupDateTime: date });
    setPickupPickerVisible(false);
  };

  const handleDropoffConfirm = (date: Date) => {
    setSearchFilters({ dropoffDateTime: date });
    setDropoffPickerVisible(false);
  };
  const showPickupDateTimePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: searchFilters.pickupDateTime || new Date(),
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            // After picking date → open time picker
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: "time",
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type === "set" && selectedTime) {
                  const finalDate = new Date(selectedDate);
                  finalDate.setHours(selectedTime.getHours());
                  finalDate.setMinutes(selectedTime.getMinutes());
                  setSearchFilters({ pickupDateTime: finalDate });
                }
              },
              is24Hour: false,
            });
          }
        },
        mode: "date",
        minimumDate: new Date(),
      });
    } else {
      // iOS: we can still use declarative picker
      DateTimePickerAndroid.open({
        value: searchFilters.pickupDateTime || new Date(),
        mode: "time",
        minimumDate: new Date(),
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setSearchFilters({ pickupDateTime: selectedDate });
          }
        },
      });
    }
  };

  const showDropoffDateTimePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value:
          searchFilters.dropoffDateTime ||
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        onChange: (event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: "time",
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type === "set" && selectedTime) {
                  const finalDate = new Date(selectedDate);
                  finalDate.setHours(selectedTime.getHours());
                  finalDate.setMinutes(selectedTime.getMinutes());
                  setSearchFilters({ dropoffDateTime: finalDate });
                }
              },
              is24Hour: false,
            });
          }
        },
        mode: "date",
        minimumDate: searchFilters.pickupDateTime || new Date(),
      });
    } else {
      DateTimePickerAndroid.open({
        value:
          searchFilters.dropoffDateTime ||
          new Date(Date.now() + 24 * 60 * 60 * 1000),
        mode: "time",
        minimumDate: searchFilters.pickupDateTime || new Date(),
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setSearchFilters({ dropoffDateTime: selectedDate });
          }
        },
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setGettingLocation(true);

    try {
      console.log("📦 [MODAL] Getting location...");

      const location = await getCarLocation();

      if (!location) {
        console.log("📦 [MODAL] Location failed");
        return;
      }

      console.log("📦 [MODAL] Location result:", location);

      const { latitude, longitude, address, city } = location;

      setSearchFilters({
        pickupLocation: {
          latitude,
          longitude,
          address,
          city,
        },
        pickupAddress: address,
      });

      Alert.alert("Location Set", address);
    } catch (err) {
      console.error("📦 [MODAL] Location error:", err);
      Alert.alert("Error", "Unable to fetch location");
    } finally {
      setGettingLocation(false);
    }
  };

  const handleSearch = async () => {
    console.log("📦 [MODAL] Search Clicked");
    console.log("📦 [MODAL] Current Filters:", searchFilters);

    await searchCars(searchFilters);

    console.log("📦 [MODAL] Search Finished");

    // Close modal after search completes (success or not)
    onClose();
  };
  const formatDateTime = (date: Date | null) => {
    if (!date) return "Select date & time";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { paddingTop: insets.top + SPACING.lg }]}
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Search Cars</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Pickup Location */}
            <View style={styles.section}>
              <Text style={styles.label}>Pickup Location</Text>
              <View style={styles.input}>
                <Ionicons name="location" size={20} color={COLORS.primary} />
                <Text style={styles.inputText}>
                  {searchFilters.pickupAddress || "Tap below to set location"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleUseCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="navigate" size={18} color={COLORS.primary} />
                )}
                <Text style={styles.secondaryButtonText}>
                  {gettingLocation
                    ? "Getting location..."
                    : "Use Current Location"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pickup Date & Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Pickup Date & Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={showPickupDateTimePicker}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.inputText}>
                  {formatDateTime(searchFilters.pickupDateTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Drop-off Date & Time */}
            <View style={styles.section}>
              <Text style={styles.label}>Drop-off Date & Time</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={showDropoffDateTimePicker}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.inputText}>
                  {formatDateTime(searchFilters.dropoffDateTime)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={[
                styles.searchButton,
                isSearching && styles.searchButtonDisabled,
              ]}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.background} />
                  <Text style={styles.searchButtonText}>Searching...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={20} color={COLORS.background} />
                  <Text style={styles.searchButtonText}>Search Cars</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  inputText: {
    marginLeft: SPACING.sm,
    color: COLORS.textPrimary,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  secondaryButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.primary,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.primary + "80",
  },
  searchButtonText: {
    marginLeft: SPACING.xs,
    color: COLORS.background,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
