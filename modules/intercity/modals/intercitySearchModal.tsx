import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIntercityStore } from "../../../store/intercityStore/intercity.store";
import { searchLocations } from "../../../utils/locationIQ";
import { getRoadDistance } from "../../../utils/getRoadDistance"; // ← NEW
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// ── Static data — Noida only ───────────────────────────────────────────────────
const PICKUP_CITY = "Noida";

const NOIDA_STATIONS = [
  "Greater Noida Railway Station (GNO)",
  "Sahibabad Railway Station (SBB)",
  "Noida Sector 51 Metro Station",
];

const stationCoordinates: Record<string, { lat: number; lng: number }> = {
  "Greater Noida Railway Station (GNO)": { lat: 28.5076, lng: 77.5638 },
  "Sahibabad Railway Station (SBB)": { lat: 28.6739, lng: 77.3646 },
  "Noida Sector 51 Metro Station": { lat: 28.5857, lng: 77.3753 },
};

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function getTomorrowDefaults() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

export default function IntercitySearchModal({ visible, onClose }: Props) {
  const { setSearchFilters, searchCars, isSearching, searchError } =
    useIntercityStore();

  const defaults = getTomorrowDefaults();

  // ── Pickup ─────────────────────────────────────────────────────────────────
  const [pickupStation, setPickupStation] = useState("");
  const [showStationPicker, setShowStationPicker] = useState(false);

  // ── Date / time ────────────────────────────────────────────────────────────
  const [pickupDate, setPickupDate] = useState(defaults.date);
  const [pickupTime, setPickupTime] = useState(defaults.time);

  // ── Drop ───────────────────────────────────────────────────────────────────
  const [dropQuery, setDropQuery] = useState("");
  const [dropSuggestions, setDropSuggestions] = useState<any[]>([]);
  const [dropLocation, setDropLocation] = useState<any>(null);
  const [loadingDrop, setLoadingDrop] = useState(false);

  // ── PAX / luggage ──────────────────────────────────────────────────────────
  const [pax, setPax] = useState(1);
  const [luggage, setLuggage] = useState(0);

  // ── Distance calculation state ─────────────────────────────────────────────
  const [calculatingDistance, setCalculatingDistance] = useState(false);
  const [distanceResult, setDistanceResult] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  // ── Errors ─────────────────────────────────────────────────────────────────
  const [sameCityError, setSameCityError] = useState(false);

  // ── Drop autocomplete ──────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      if (dropQuery.length < 3) {
        setDropSuggestions([]);
        return;
      }
      setLoadingDrop(true);
      try {
        const results = await searchLocations(dropQuery);
        setDropSuggestions(results);
      } catch (e) {
        console.log("Location search failed:", e);
      }
      setLoadingDrop(false);
    };
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [dropQuery]);

  // ── Auto-calculate distance whenever station + drop are both set ───────────
  useEffect(() => {
    if (!pickupStation || !dropLocation) {
      // Reset distance when either side is cleared
      setDistanceResult(null);
      setDistanceError(null);
      return;
    }

    const coords = stationCoordinates[pickupStation];
    if (!coords) return;

    let cancelled = false;

    const calculate = async () => {
      setCalculatingDistance(true);
      setDistanceError(null);
      try {
        const result = await getRoadDistance(
          { lat: coords.lat, lng: coords.lng },
          { lat: dropLocation.lat, lng: dropLocation.lng },
        );
        if (!cancelled) {
          setDistanceResult(result);
          console.log(
            `✅ [DISTANCE] ${result.distanceKm} km, ~${result.durationMin} min`,
          );
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("❌ [DISTANCE] Failed:", e.message);
          setDistanceError("Could not calculate road distance.");
          setDistanceResult(null);
        }
      } finally {
        if (!cancelled) setCalculatingDistance(false);
      }
    };

    calculate();
    return () => {
      cancelled = true;
    };
  }, [pickupStation, dropLocation]);

  const handleSelectDrop = (item: any) => {
    const city =
      item.address?.city || item.address?.town || item.address?.state || "";

    if (city.toLowerCase() === PICKUP_CITY.toLowerCase()) {
      setSameCityError(true);
      setDropLocation(null);
      setDistanceResult(null);
      return;
    }

    setSameCityError(false);
    const loc = {
      address: item.display_name,
      city,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    };
    setDropLocation(loc);
    setDropQuery(loc.address);
    setDropSuggestions([]);
  };

  const handleSearch = async () => {
    console.log(pickupDate);
    if (!pickupStation) {
      Alert.alert("Missing Info", "Please select a pickup station.");
      return;
    }
    if (!dropLocation) {
      Alert.alert("Missing Info", "Please select a drop address.");
      return;
    }
    if (sameCityError) return;

    // Wait for distance if still calculating
    if (calculatingDistance) {
      Alert.alert("Please wait", "Calculating road distance...");
      return;
    }

    const coords = stationCoordinates[pickupStation];

    // If distance failed, try once more before proceeding
    let finalDistance = distanceResult;
    if (!finalDistance) {
      try {
        setCalculatingDistance(true);
        finalDistance = await getRoadDistance(
          { lat: coords.lat, lng: coords.lng },
          { lat: dropLocation.lat, lng: dropLocation.lng },
        );
        setDistanceResult(finalDistance);
      } catch {
        // Non-blocking — proceed with 0 and let booking screen handle it
        finalDistance = { distanceKm: 0, durationMin: 0 };
      } finally {
        setCalculatingDistance(false);
      }
    }

    const filters = {
      pickupCity: PICKUP_CITY,
      pickupStation,
      pickupLat: coords.lat,
      pickupLng: coords.lng,
      dropAddress: dropLocation.address,
      dropCity: dropLocation.city,
      dropLat: dropLocation.lat,
      dropLng: dropLocation.lng,
      pickupDate,
      pickupTime,
      pax,
      luggage,
      tripDistanceKm: finalDistance.distanceKm, // ← passed to booking screen
      durationMin: finalDistance.durationMin,
    };
    console.log("data" + filters);

    setSearchFilters(filters);
    await searchCars(filters);

    if (!searchError) {
      onClose();
    }
  };

  const isSearchDisabled =
    isSearching ||
    calculatingDistance ||
    !dropLocation ||
    !pickupStation ||
    sameCityError;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Intercity Search</Text>
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Pickup Section ── */}
            <Text style={styles.sectionLabel}>📍 Pickup</Text>

            {/* Pickup City — fixed */}
            <Text style={styles.label}>City</Text>
            <View style={styles.fixedField}>
              <Ionicons
                name="location"
                size={16}
                color={COLORS.primary}
                style={{ marginRight: SPACING.sm }}
              />
              <Text style={styles.fixedFieldText}>{PICKUP_CITY}</Text>
            </View>

            {/* Pickup Station */}
            <Text style={styles.label}>Station / Airport</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowStationPicker(true)}
              activeOpacity={0.8}
            >
              <Text
                style={
                  pickupStation
                    ? styles.dropdownText
                    : styles.dropdownPlaceholder
                }
                numberOfLines={1}
              >
                {pickupStation || "Select station"}
              </Text>
              <Ionicons
                name="chevron-down"
                size={18}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>

            {/* ── Drop Section ── */}
            <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>
              🏁 Drop
            </Text>

            <Text style={styles.label}>Drop Address</Text>
            <View style={styles.searchRow}>
              <Ionicons
                name="search-outline"
                size={18}
                color={COLORS.textSecondary}
                style={{ marginRight: SPACING.sm }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Type drop location..."
                placeholderTextColor={COLORS.textSecondary}
                value={dropQuery}
                onChangeText={(t) => {
                  setDropQuery(t);
                  if (dropLocation) {
                    setDropLocation(null);
                    setDistanceResult(null);
                  }
                  setSameCityError(false);
                }}
              />
              {dropQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setDropQuery("");
                    setDropLocation(null);
                    setDropSuggestions([]);
                    setDistanceResult(null);
                    setDistanceError(null);
                    setSameCityError(false);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Confirmed drop chip */}
            {dropLocation && (
              <View style={styles.selectedChip}>
                <Ionicons name="location" size={14} color={COLORS.primary} />
                <Text style={styles.selectedChipText} numberOfLines={2}>
                  {dropLocation.city ? `${dropLocation.city} — ` : ""}
                  {dropLocation.address}
                </Text>
              </View>
            )}

            {sameCityError && (
              <Text style={styles.errorText}>
                ⚠️ Pickup and drop city cannot be the same for intercity trips.
              </Text>
            )}

            {/* ── Distance Badge ─────────────────────────────────────────── */}
            {pickupStation && dropLocation && !sameCityError && (
              <View style={styles.distanceBadge}>
                {calculatingDistance ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color={COLORS.primary}
                      style={{ marginRight: SPACING.sm }}
                    />
                    <Text style={styles.distanceBadgeText}>
                      Calculating road distance...
                    </Text>
                  </>
                ) : distanceResult ? (
                  <>
                    <Ionicons
                      name="navigate"
                      size={16}
                      color={COLORS.primary}
                    />
                    <Text style={styles.distanceBadgeText}>
                      <Text style={styles.distanceBadgeHighlight}>
                        {distanceResult.distanceKm} km
                      </Text>
                      {"  ·  "}~{distanceResult.durationMin} min drive
                    </Text>
                  </>
                ) : distanceError ? (
                  <>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={COLORS.error}
                    />
                    <Text
                      style={[
                        styles.distanceBadgeText,
                        { color: COLORS.error },
                      ]}
                    >
                      {distanceError}
                    </Text>
                  </>
                ) : null}
              </View>
            )}
            {/* ───────────────────────────────────────────────────────────── */}

            {/* API error */}
            {searchError && (
              <Text style={styles.errorText}>⚠️ {searchError}</Text>
            )}

            {/* Autocomplete loading */}
            {loadingDrop && (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
                style={{ marginTop: SPACING.sm }}
              />
            )}

            {/* Autocomplete suggestions */}
            {dropSuggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {dropSuggestions.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.suggestionItem,
                      i === dropSuggestions.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => handleSelectDrop(item)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={COLORS.textSecondary}
                      style={{ marginRight: SPACING.sm, flexShrink: 0 }}
                    />
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* ── Date & Time ── */}
            <Text style={[styles.sectionLabel, { marginTop: SPACING.xl }]}>
              🗓️ Trip Details
            </Text>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Text style={styles.label}>Pickup Date</Text>
                <TextInput
                  style={styles.input}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Pickup Time</Text>
                <TextInput
                  style={styles.input}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* ── PAX & Luggage ── */}
            <View style={[styles.row, { marginTop: SPACING.sm }]}>
              <View style={{ flex: 1, marginRight: SPACING.sm }}>
                <Text style={styles.label}>Passengers</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setPax((p) => Math.max(1, p - 1))}
                  >
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{pax}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setPax((p) => Math.min(6, p + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Luggage</Text>
                <View style={styles.counter}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setLuggage((l) => Math.max(0, l - 1))}
                  >
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{luggage}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setLuggage((l) => Math.min(5, l + 1))}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Insurance ── */}
            <View style={styles.insuranceRow}>
              <Ionicons
                name="shield-checkmark"
                size={18}
                color={COLORS.primary}
              />
              <Text style={styles.insuranceText}>Trip Insurance</Text>
              <View style={styles.insuranceBadge}>
                <Text style={styles.insuranceBadgeText}>✓ Included</Text>
              </View>
            </View>

            {/* ── Search Button ── */}
            <TouchableOpacity
              style={[
                styles.searchBtn,
                isSearchDisabled && styles.searchBtnDisabled,
              ]}
              onPress={handleSearch}
              disabled={isSearchDisabled}
              activeOpacity={0.85}
            >
              {isSearching || calculatingDistance ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.searchBtnText}>
                    {calculatingDistance
                      ? "Calculating route..."
                      : "Searching..."}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#fff" />
                  <Text style={styles.searchBtnText}>Search Cars</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ── Station Picker Bottom Sheet ── */}
      <Modal
        visible={showStationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStationPicker(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowStationPicker(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sheetTitle}>
              Select Station in {PICKUP_CITY}
            </Text>
            {NOIDA_STATIONS.map((station) => (
              <TouchableOpacity
                key={station}
                style={styles.sheetItem}
                onPress={() => {
                  setPickupStation(station);
                  setShowStationPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.sheetItemText,
                    station === pickupStation && styles.sheetItemSelected,
                  ]}
                  numberOfLines={2}
                >
                  {station}
                </Text>
                {station === pickupStation && (
                  <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxxl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },

  scroll: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  sectionLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },

  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },

  // Fixed city field
  fixedField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  fixedFieldText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Dropdown
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  dropdownText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  dropdownPlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // Text input
  input: {
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },

  // Drop search bar
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },

  // Confirmed drop chip
  selectedChip: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: SPACING.sm,
    backgroundColor: COLORS.primary + "18",
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  selectedChipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    flex: 1,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: 20,
  },

  // ── Distance badge ────────────────────────────────────────────────────────
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  distanceBadgeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  distanceBadgeHighlight: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },

  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },

  // Suggestions
  suggestionBox: {
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackground,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    flex: 1,
    lineHeight: 20,
  },

  // Row layout
  row: {
    flexDirection: "row",
  },

  // Counter
  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackgroundLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
  },
  counterBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cardBackground,
  },
  counterBtnText: {
    fontSize: FONT_SIZES.xl,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  counterValue: {
    flex: 1,
    textAlign: "center",
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  // Insurance row
  insuranceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xl,
    backgroundColor: COLORS.primary + "10",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  insuranceText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  insuranceBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
  },
  insuranceBadgeText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Search button
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    color: "#fff",
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingBottom: SPACING.xxxl,
  },
  sheetTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  sheetItemText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    flex: 1,
  },
  sheetItemSelected: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
});
