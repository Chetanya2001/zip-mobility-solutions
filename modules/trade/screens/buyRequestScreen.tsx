import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useAddCarStore } from "../../../store/host/addCar.store";
import { useTradeStore } from "../../../store/tradeStore/trade.store";

type Make = { id: number; name: string };
type Model = { id: number; name: string; make_id?: number };

const { width } = Dimensions.get("window");

/* ── constants ───────────────────────────────────────────────────────────────── */

const CAR_TYPES = ["SUV", "Sedan", "Hatchback", "Luxury", "EV", "Coupe", "Van"];
const FUEL_TYPES = ["Any", "Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const TRANSMISSIONS = ["Any", "Manual", "Automatic", "CVT"];
const OWNER_OPTIONS = ["Any", "1st", "2nd", "3rd", "4th+"];
const AVAILABILITY = ["instock", "booked", "upcoming"];
const YEAR_OPTIONS = Array.from({ length: 25 }, (_, i) => String(2000 + i));
const SEAT_OPTIONS = ["Any", "2", "4", "5", "6", "7", "8+"];

/* ── types ───────────────────────────────────────────────────────────────────── */

type ChipProps = { label: string; active: boolean; onPress: () => void };
type DropdownProps = {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
};
type SectionHeaderProps = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};
type BuyRequestScreenProps = { onSuccess?: () => void };

/* ── sub-components ──────────────────────────────────────────────────────────── */

function Chip({ label, active, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[st.chip, active && st.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[st.chipText, active && st.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InlineDropdown({ label, options, value, onChange }: DropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: SPACING.xl }}>
      <Text style={st.label}>{label}</Text>
      <TouchableOpacity
        style={st.dropTrigger}
        onPress={() => setOpen((v) => !v)}
      >
        <Text style={st.dropValue}>{value || "Select"}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
      {open && (
        <View style={st.dropMenu}>
          {options.map((o) => (
            <TouchableOpacity
              key={o}
              style={[st.dropItem, value === o && st.dropItemActive]}
              onPress={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              <Text
                style={[st.dropItemText, value === o && st.dropItemTextActive]}
              >
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

function SectionHeader({ title, icon }: SectionHeaderProps) {
  return (
    <View style={st.sectionHeader}>
      <Ionicons name={icon} size={16} color={COLORS.primary} />
      <Text style={st.sectionTitle}>{title}</Text>
    </View>
  );
}

/* ── formatPrice helper ──────────────────────────────────────────────────────── */

const formatPrice = (v: number) =>
  v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v / 1000}k`;

/* ── formatKms helper ────────────────────────────────────────────────────────── */

const formatKms = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k km` : `${v} km`;

/* ───────────────────────────────────────────────────────────────────────────── */
/* MAIN SCREEN                                                                   */
/* ───────────────────────────────────────────────────────────────────────────── */

export default function BuyRequestScreen({ onSuccess }: BuyRequestScreenProps) {
  const { createRequest, isLoading } = useTradeStore();
  const { carMakes, carModels, fetchCarMakes, fetchCarModels } =
    useAddCarStore();

  const makeOptions = ["Any", ...carMakes.map((m: Make) => m.name)];
  const modelOptions = ["Any", ...carModels.map((m: Model) => m.name)];

  /* ── form state ── */
  const [bodyTypes, setBodyTypes] = useState<string[]>([]);
  const [make, setMake] = useState("Any");
  const [model, setModel] = useState("Any");
  const [minYear, setMinYear] = useState("2018");
  const [maxYear, setMaxYear] = useState("2024");
  const [priceRange, setPriceRange] = useState([300000, 2000000]);
  const [kmsRange, setKmsRange] = useState([0, 100000]);
  const [fuelType, setFuelType] = useState("Any");
  const [transmission, setTransmission] = useState("Any");
  const [color, setColor] = useState("");
  const [seats, setSeats] = useState("Any");
  const [owner, setOwner] = useState("Any");
  const [availability, setAvailability] = useState("instock");
  const [features, setFeatures] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchCarMakes();
  }, []);

  /* ── helpers ── */
  const toggleType = (t: string) =>
    setBodyTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const toNullable = (v: string, nullVal = "Any") =>
    v === nullVal || v === "" ? null : v;
  const toInt = (v: string) => (v === "" ? null : parseInt(v));
  const ownerMap: Record<string, string> = {
    "1st": "first",
    "2nd": "second",
    "3rd": "third",
    "4th+": "fourth_or_more",
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!city.trim())
      return Alert.alert("Validation", "Please enter your city.");

    const payload = {
      preferred_make: toNullable(make),
      preferred_model: toNullable(model),
      min_year: toInt(minYear),
      max_year: toInt(maxYear),
      min_amount: priceRange[0],
      max_amount: priceRange[1],
      min_kms_driven: kmsRange[0],
      max_kms_driven: kmsRange[1],
      fuel_type: toNullable(fuelType)?.toLowerCase() ?? null,
      body_type: bodyTypes.length ? bodyTypes[0].toLowerCase() : null,
      transmission: toNullable(transmission)?.toLowerCase() ?? null,
      color: color.trim() || null,
      seats: toNullable(seats) ? parseInt(seats) : null,
      owner: toNullable(owner) ? (ownerMap[owner] ?? null) : null,
      availability,
      features: features.trim()
        ? features
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
        : [],
      city: city.trim(),
      notes: notes.trim() || null,
    };

    try {
      await createRequest(payload);
      Alert.alert("✅ Success", "Your buy request has been submitted!");
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  /* ── UI ── */
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={st.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── BODY TYPE ── */}
      <SectionHeader title="BODY TYPE" icon="car-outline" />
      <View style={st.chipWrap}>
        {CAR_TYPES.map((t) => (
          <Chip
            key={t}
            label={t}
            active={bodyTypes.includes(t)}
            onPress={() => toggleType(t)}
          />
        ))}
      </View>

      {/* ── BRAND & MODEL ── */}
      <SectionHeader title="BRAND & MODEL" icon="business-outline" />
      <InlineDropdown
        label="Preferred Brand"
        options={makeOptions}
        value={make}
        onChange={(selected) => {
          setMake(selected);
          setModel("Any");
          const found = carMakes.find((m: Make) => m.name === selected);
          if (found) fetchCarModels(found.id);
        }}
      />
      <InlineDropdown
        label="Model"
        options={modelOptions}
        value={model}
        onChange={setModel}
      />

      {/* ── YEAR RANGE ── */}
      <SectionHeader title="YEAR RANGE" icon="calendar-outline" />
      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <InlineDropdown
            label="Min Year"
            options={YEAR_OPTIONS}
            value={minYear}
            onChange={setMinYear}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InlineDropdown
            label="Max Year"
            options={YEAR_OPTIONS}
            value={maxYear}
            onChange={setMaxYear}
          />
        </View>
      </View>

      {/* ── BUDGET ── */}
      <SectionHeader title="BUDGET" icon="cash-outline" />
      <View style={st.sliderContainer}>
        <View style={st.rangeLabelRow}>
          <View>
            <Text style={st.rangeLabel}>Min Budget</Text>
            <Text style={st.rangeValue}>{formatPrice(priceRange[0])}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={st.rangeLabel}>Max Budget</Text>
            <Text style={st.rangeValue}>
              {formatPrice(priceRange[1])}
              {priceRange[1] === 5000000 ? "+" : ""}
            </Text>
          </View>
        </View>
        <MultiSlider
          values={priceRange}
          sliderLength={width - SPACING.xl * 2 - 40}
          onValuesChange={setPriceRange}
          min={30000}
          max={5000000}
          step={10000}
          allowOverlap={false}
          snapped
          selectedStyle={{ backgroundColor: COLORS.primary, height: 6 }}
          unselectedStyle={{ backgroundColor: COLORS.border, height: 6 }}
          containerStyle={{ height: 40 }}
          trackStyle={{ height: 6, borderRadius: 3 }}
          markerStyle={st.sliderMarker}
          pressedMarkerStyle={st.sliderMarkerPressed}
        />
      </View>

      {/* ── KMS DRIVEN ── */}
      <SectionHeader title="KMS DRIVEN" icon="speedometer-outline" />
      <View style={st.sliderContainer}>
        <View style={st.rangeLabelRow}>
          <View>
            <Text style={st.rangeLabel}>Min Kms</Text>
            <Text style={st.rangeValue}>{formatKms(kmsRange[0])}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={st.rangeLabel}>Max Kms</Text>
            <Text style={st.rangeValue}>
              {formatKms(kmsRange[1])}
              {kmsRange[1] === 200000 ? "+" : ""}
            </Text>
          </View>
        </View>
        <MultiSlider
          values={kmsRange}
          sliderLength={width - SPACING.xl * 2 - 40}
          onValuesChange={setKmsRange}
          min={0}
          max={200000}
          step={5000}
          allowOverlap={false}
          snapped
          selectedStyle={{ backgroundColor: COLORS.primary, height: 6 }}
          unselectedStyle={{ backgroundColor: COLORS.border, height: 6 }}
          containerStyle={{ height: 40 }}
          trackStyle={{ height: 6, borderRadius: 3 }}
          markerStyle={st.sliderMarker}
          pressedMarkerStyle={st.sliderMarkerPressed}
        />
      </View>

      {/* ── FUEL TYPE ── */}
      <SectionHeader title="FUEL TYPE" icon="flame-outline" />
      <View style={st.chipWrap}>
        {FUEL_TYPES.map((f) => (
          <Chip
            key={f}
            label={f}
            active={fuelType === f}
            onPress={() => setFuelType(f)}
          />
        ))}
      </View>

      {/* ── TRANSMISSION ── */}
      <SectionHeader title="TRANSMISSION" icon="git-branch-outline" />
      <View style={st.chipWrap}>
        {TRANSMISSIONS.map((t) => (
          <Chip
            key={t}
            label={t}
            active={transmission === t}
            onPress={() => setTransmission(t)}
          />
        ))}
      </View>

      {/* ── SEATS & OWNER ── */}
      <SectionHeader title="SEATS & OWNERSHIP" icon="people-outline" />
      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <InlineDropdown
            label="Seats"
            options={SEAT_OPTIONS}
            value={seats}
            onChange={setSeats}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InlineDropdown
            label="Owner"
            options={OWNER_OPTIONS}
            value={owner}
            onChange={setOwner}
          />
        </View>
      </View>

      {/* ── COLOR ── */}
      <SectionHeader title="COLOR PREFERENCE" icon="color-palette-outline" />
      <TextInput
        style={[st.input, { marginBottom: SPACING.xl }]}
        value={color}
        onChangeText={setColor}
        placeholder="e.g. White, Black, Any"
        placeholderTextColor={COLORS.textSecondary}
      />

      {/* ── AVAILABILITY ── */}
      <SectionHeader title="AVAILABILITY" icon="time-outline" />
      <View style={st.chipWrap}>
        {AVAILABILITY.map((a) => (
          <Chip
            key={a}
            label={a.charAt(0).toUpperCase() + a.slice(1)}
            active={availability === a}
            onPress={() => setAvailability(a)}
          />
        ))}
      </View>

      {/* ── FEATURES ── */}
      <SectionHeader title="FEATURES" icon="list-outline" />
      <TextInput
        style={[st.input, { marginBottom: SPACING.xl }]}
        value={features}
        onChangeText={setFeatures}
        placeholder="e.g. Sunroof, Apple CarPlay, Reverse Camera"
        placeholderTextColor={COLORS.textSecondary}
      />

      {/* ── LOCATION ── */}
      <SectionHeader title="LOCATION" icon="location-outline" />
      <TextInput
        style={[st.input, { marginBottom: SPACING.xl }]}
        value={city}
        onChangeText={setCity}
        placeholder="Enter city *"
        placeholderTextColor={COLORS.textSecondary}
      />

      {/* ── NOTES ── */}
      <SectionHeader title="NOTES" icon="document-text-outline" />
      <TextInput
        style={[st.input, st.textArea, { marginBottom: SPACING.xl }]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any extra requirements..."
        placeholderTextColor={COLORS.textSecondary}
        multiline
      />

      {/* ── SUBMIT ── */}
      <TouchableOpacity
        style={[st.submitBtn, isLoading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-circle" size={18} color={COLORS.background} />
        <Text style={st.submitText}>
          {isLoading ? "Submitting..." : "Submit Request"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ── styles ──────────────────────────────────────────────────────────────────── */

const st = StyleSheet.create({
  scroll: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 120,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1.2,
  },

  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },

  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },

  row: { flexDirection: "row", gap: SPACING.md },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chipTextActive: { color: COLORS.background, fontWeight: FONT_WEIGHTS.bold },

  dropTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropValue: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  dropMenu: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    zIndex: 99,
  },
  dropItem: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md },
  dropItemActive: { backgroundColor: COLORS.primary + "20" },
  dropItemText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  dropItemTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  sliderContainer: { marginBottom: SPACING.xl },
  rangeLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
  },
  rangeLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  rangeValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  sliderMarker: {
    backgroundColor: COLORS.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  sliderMarkerPressed: { backgroundColor: COLORS.primary, opacity: 0.8 },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg + 2,
    marginTop: SPACING.sm,
  },
  submitText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
});
