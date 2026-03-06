import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  KeyboardTypeOptions,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import {
  useTradeStore,
  type CreateListingPayload,
} from "../../../store/tradeStore/trade.store";
import { useAddCarStore } from "../../../store/host/addCar.store";

const { width } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type CarDocuments = {
  city_of_registration?: string | null;
  fastag_image?: string | null;
  insurance_company?: string | null;
  insurance_idv_value?: string | number | null;
  insurance_image?: string | null;
  insurance_valid_till?: string | null;
  owner_name?: string | null;
  rc_image_back?: string | null;
  rc_image_front?: string | null;
  rc_number?: string | null;
  rc_valid_till?: string | null;
  trip_end_balance?: string | number | null;
  trip_start_balance?: string | number | null;
};

type StoreCar = {
  id: number | string;
  make?: string | null;
  model?: string | null;
  variant_name?: string | null;
  year?: number | null;
  kms_driven?: number | null;
  fuel?: string | null;
  body_type?: string | null;
  seats?: number | null;
  transmission?: string | null;
  car_mode?: string | null;
  price_per_hour?: number | null;
  price_per_km?: number | null;
  available_from?: string | null;
  available_till?: string | null;
  is_visible?: boolean;
  photos?: string[] | null;
  documents?: CarDocuments | null;
};

type StepIndicatorProps = { currentStep: number; totalSteps?: number };
type CarSelectCardProps = {
  car: StoreCar;
  selected: boolean;
  onPress: () => void;
};
type PhotoGridProps = {
  photos: (string | undefined)[];
  onAdd: (i: number) => void;
  onRemove: (i: number) => void;
};
type FieldLabelProps = { label: string; required?: boolean };
type ChipRowProps = {
  options: string[];
  value: string;
  onChange: (v: string) => void;
};
type InputFieldProps = {
  label: string;
  required?: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: KeyboardTypeOptions;
  prefix?: string;
  suffix?: string;
};
type DocRowProps = {
  icon: string;
  label: string;
  value?: string | number | null;
};
type DocImageProps = { label: string; uri?: string | null };
type SellCarScreenProps = { onSuccess?: () => void };

// ─── Constants ────────────────────────────────────────────────────────────────

const FUEL_TYPES: string[] = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"];
const OWNER_OPTIONS: string[] = ["1st Owner", "2nd Owner", "3rd Owner", "4th+"];

const ownerMap: Record<string, string> = {
  "1st Owner": "first",
  "2nd Owner": "second",
  "3rd Owner": "third",
  "4th+": "fourth_or_more",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCarThumbnail(car: StoreCar): string {
  if (!car.photos || car.photos.length === 0) return "";
  return car.photos[0] ?? "";
}

function getCarLabel(car: StoreCar): string {
  const parts: string[] = [];
  if (car.make) parts.push(car.make);
  if (car.variant_name) parts.push(car.variant_name);
  return parts.length > 0 ? parts.join(" ") : `Car #${car.id}`;
}

function formatIDV(val?: string | number | null): string {
  if (val == null) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN")}`;
}

function formatDate(val?: string | null): string {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps = 2 }: StepIndicatorProps) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View key={i} style={styles.stepRow}>
          <View
            style={[
              styles.stepDot,
              i < currentStep && styles.stepDotDone,
              i === currentStep && styles.stepDotActive,
            ]}
          >
            {i < currentStep ? (
              <Ionicons name="checkmark" size={10} color="#fff" />
            ) : (
              <Text style={styles.stepNum}>{i + 1}</Text>
            )}
          </View>
          {i < totalSteps - 1 && (
            <View
              style={[styles.stepLine, i < currentStep && styles.stepLineDone]}
            />
          )}
        </View>
      ))}
    </View>
  );
}

function CarSelectCard({ car, selected, onPress }: CarSelectCardProps) {
  const thumbnail = getCarThumbnail(car);
  const label = getCarLabel(car);
  return (
    <TouchableOpacity
      style={[styles.carCard, selected && styles.carCardSelected]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {thumbnail !== "" ? (
        <Image source={{ uri: thumbnail }} style={styles.carCardImg} />
      ) : (
        <View style={[styles.carCardImg, styles.carCardImgPlaceholder]}>
          <Ionicons name="car-outline" size={36} color={COLORS.textTertiary} />
        </View>
      )}

      <View style={styles.carCardOverlay} />

      {selected && (
        <View style={styles.selectedBadge}>
          <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
        </View>
      )}

      <View style={styles.carCardInfo}>
        <Text style={styles.carMake}>{car.make ?? "Unknown"}</Text>
        <Text style={styles.carModel}>{car.model ?? "Unknown"}</Text>
        <View style={styles.carMeta}>
          {car.year != null && (
            <View style={styles.carMetaPill}>
              <Ionicons name="calendar-outline" size={10} color="#fff" />
              <Text style={styles.carMetaText}>{car.year}</Text>
            </View>
          )}
          {car.fuel != null && (
            <View style={styles.carMetaPill}>
              <Ionicons name="flash-outline" size={10} color="#fff" />
              <Text style={styles.carMetaText}>{car.fuel}</Text>
            </View>
          )}
          {car.kms_driven != null && car.kms_driven > 0 && (
            <View style={styles.carMetaPill}>
              <Ionicons name="speedometer-outline" size={10} color="#fff" />
              <Text style={styles.carMetaText}>
                {car.kms_driven.toLocaleString()} km
              </Text>
            </View>
          )}
        </View>
      </View>

      {selected && <View style={styles.selectedRing} />}
    </TouchableOpacity>
  );
}

function PhotoGrid({ photos, onAdd, onRemove }: PhotoGridProps) {
  return (
    <View style={styles.photoGrid}>
      {photos.map((uri, i) => (
        <View key={i} style={styles.photoCell}>
          {uri != null ? (
            <TouchableOpacity
              style={styles.photoFilled}
              onPress={() => onRemove(i)}
              activeOpacity={0.85}
            >
              <Image source={{ uri }} style={styles.photoFilledImg} />
              <View style={styles.photoRemoveBtn}>
                <Ionicons name="trash-outline" size={13} color="#fff" />
              </View>
              {i === 0 && (
                <View style={styles.photoCoverBadge}>
                  <Text style={styles.photoCoverText}>COVER</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.photoEmpty, i === 0 && styles.photoEmptyMain]}
              onPress={() => onAdd(i)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={i === 0 ? "camera" : "add"}
                size={i === 0 ? 28 : 22}
                color={i === 0 ? COLORS.primary : COLORS.textTertiary}
              />
              <Text
                style={[
                  styles.photoEmptyLabel,
                  i === 0 && { color: COLORS.primary, fontWeight: "600" },
                ]}
              >
                {i === 0 ? "Main Photo" : `Photo ${i + 1}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );
}

function DocRow({ icon, label, value }: DocRowProps) {
  const display =
    value != null && String(value).trim() !== "" ? String(value) : "—";
  return (
    <View style={styles.docRow}>
      <Ionicons
        name={icon as "document-outline"}
        size={14}
        color={COLORS.textSecondary}
      />
      <Text style={styles.docLabel}>{label}</Text>
      <Text style={styles.docValue} numberOfLines={1}>
        {display}
      </Text>
    </View>
  );
}

function DocImage({ label, uri }: DocImageProps) {
  return (
    <View style={styles.docImageWrap}>
      {uri != null && uri !== "" ? (
        <Image source={{ uri }} style={styles.docImage} resizeMode="cover" />
      ) : (
        <View style={styles.docImagePlaceholder}>
          <Ionicons
            name="image-outline"
            size={22}
            color={COLORS.textTertiary}
          />
        </View>
      )}
      <Text style={styles.docImageLabel}>{label}</Text>
    </View>
  );
}

function FieldLabel({ label, required }: FieldLabelProps) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {required === true && <Text style={styles.required}>*</Text>}
    </View>
  );
}

function ChipRow({ options, value, onChange }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chipScroll}
    >
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.chip, value === opt && styles.chipActive]}
          onPress={() => onChange(value === opt ? "" : opt)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.chipText, value === opt && styles.chipTextActive]}
          >
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function InputField({
  label,
  required,
  placeholder,
  value,
  onChange,
  keyboardType,
  prefix,
  suffix,
}: InputFieldProps) {
  return (
    <View style={styles.inputGroup}>
      <FieldLabel label={label} required={required} />
      <View style={styles.inputWrapper}>
        {prefix != null ? (
          <Text style={styles.inputAffix}>{prefix}</Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            prefix != null ? { paddingLeft: 8 } : undefined,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType ?? "default"}
        />
        {suffix != null ? (
          <Text style={styles.inputAffix}>{suffix}</Text>
        ) : null}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SellCarScreen({ onSuccess }: SellCarScreenProps) {
  // Typed directly against the updated store — no cast needed
  const { createListing, isLoading } = useTradeStore();
  const { cars, loading, fetchMyCars } = useAddCarStore();

  const [step, setStep] = useState<number>(0);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [kmsDriven, setKmsDriven] = useState<string>("");
  const [expectedPrice, setExpectedPrice] = useState<string>("");
  const [fuelType, setFuelType] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [owner, setOwner] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [photos, setPhotos] = useState<(string | undefined)[]>(
    Array(5).fill(undefined),
  );

  useEffect(() => {
    fetchMyCars();
  }, []);

  const filledPhotos = photos.filter(Boolean).length;

  const goToStep = (nextStep: number): void => {
    Animated.timing(slideAnim, {
      toValue: nextStep === 1 ? -width : 0,
      duration: 320,
      useNativeDriver: true,
    }).start(() => setStep(nextStep));
  };

  const pickPhoto = async (index: number): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) {
      const updated = [...photos];
      updated[index] = result.assets[0].uri;
      setPhotos(updated);
    }
  };

  const removePhoto = (index: number): void => {
    const updated = [...photos];
    updated[index] = undefined;
    setPhotos(updated);
  };

  const handleSelectCar = (carItem: StoreCar): void => {
    setSelectedCar(String(carItem.id));
    setKmsDriven(carItem.kms_driven != null ? String(carItem.kms_driven) : "");
    setFuelType(carItem.fuel ?? "");
    setCity(carItem.documents?.city_of_registration ?? "");
    if (carItem.photos && carItem.photos.length > 0) {
      const mapped = carItem.photos.slice(0, 5);
      setPhotos([
        ...mapped,
        ...Array<undefined>(5 - mapped.length).fill(undefined),
      ]);
    } else {
      setPhotos(Array<undefined>(5).fill(undefined));
    }
  };

  const handleNext = (): void => {
    if (!selectedCar) {
      Alert.alert("Select a car", "Please choose a car to list for sale.");
      return;
    }
    goToStep(1);
  };

  const handleSubmit = async (): Promise<void> => {
    // ── client-side validation ─────────────────────────────────────────────
    if (!kmsDriven) return void Alert.alert("Required", "Enter KMs driven.");
    if (!expectedPrice)
      return void Alert.alert("Required", "Enter expected price.");
    if (!city.trim()) return void Alert.alert("Required", "Enter your city.");
    if (filledPhotos < 3)
      return void Alert.alert("Photos", "Please upload at least 3 photos.");
    if (!selectedCar) return void Alert.alert("Error", "No car selected.");

    const kms = parseInt(kmsDriven, 10);
    const price = parseFloat(expectedPrice);

    if (isNaN(kms) || kms < 0)
      return void Alert.alert("Invalid", "KMs driven must be a valid number.");
    if (isNaN(price) || price <= 0)
      return void Alert.alert(
        "Invalid",
        "Expected price must be a valid number.",
      );

    // ── build typed payload — exactly what the backend expects ─────────────
    const payload: CreateListingPayload = {
      car_id: selectedCar, // backend: car_id
      kms_driven: kms, // backend: Car.kms_driven updated
      expected_price: price, // backend: → asking_price
      fuel_type: fuelType.trim() ? fuelType.toLowerCase() : null,
      color: color.trim() ? color.trim() : null,
      owner: owner ? (ownerMap[owner] ?? null) : null,
      city: city.trim(), // backend: city
      notes: notes.trim() ? notes.trim() : null, // backend: → description
      photos: photos.filter((p): p is string => p !== undefined),
    };

    try {
      await createListing(payload);
      Alert.alert("🎉 Listed!", "Your car has been submitted for sale.");
      onSuccess?.();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      Alert.alert("Error", message);
    }
  };

  const selectedCarData: StoreCar | undefined = (cars as StoreCar[]).find(
    (c) => String(c.id) === selectedCar,
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderCarList = (): React.ReactNode => {
    if (loading && (!cars || cars.length === 0)) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your cars...</Text>
        </View>
      );
    }
    if (!cars || cars.length === 0) {
      return (
        <View style={styles.emptyBox}>
          <Ionicons name="car-outline" size={56} color={COLORS.textTertiary} />
          <Text style={styles.emptyTitle}>No cars found</Text>
          <Text style={styles.emptySubtitle}>
            Add a car to your account first before listing it for sale.
          </Text>
        </View>
      );
    }
    return (cars as StoreCar[]).map((carItem) => (
      <CarSelectCard
        key={String(carItem.id)}
        car={carItem}
        selected={selectedCar === String(carItem.id)}
        onPress={() => handleSelectCar(carItem)}
      />
    ));
  };

  const renderDocumentsSection = (doc: CarDocuments): React.ReactNode => (
    <View style={styles.section}>
      {/* RC Details */}
      <View style={styles.sectionHeader}>
        <Ionicons name="card-outline" size={15} color={COLORS.primary} />
        <Text style={styles.sectionTitle}>RC DETAILS</Text>
      </View>
      <DocRow
        icon="document-text-outline"
        label="RC Number"
        value={doc.rc_number}
      />
      <DocRow icon="person-outline" label="Owner Name" value={doc.owner_name} />
      <DocRow
        icon="location-outline"
        label="Registered City"
        value={doc.city_of_registration}
      />
      <DocRow
        icon="calendar-outline"
        label="RC Valid Till"
        value={formatDate(doc.rc_valid_till)}
      />
      <View style={styles.docImagesRow}>
        <DocImage label="RC Front" uri={doc.rc_image_front} />
        <DocImage label="RC Back" uri={doc.rc_image_back} />
      </View>

      <View style={styles.divider} />

      {/* Insurance Details */}
      <View style={[styles.sectionHeader, { marginTop: SPACING.sm }]}>
        <Ionicons
          name="shield-checkmark-outline"
          size={15}
          color={COLORS.primary}
        />
        <Text style={styles.sectionTitle}>INSURANCE DETAILS</Text>
      </View>
      <DocRow
        icon="business-outline"
        label="Company"
        value={doc.insurance_company}
      />
      <DocRow
        icon="cash-outline"
        label="IDV Value"
        value={formatIDV(doc.insurance_idv_value)}
      />
      <DocRow
        icon="calendar-outline"
        label="Valid Till"
        value={formatDate(doc.insurance_valid_till)}
      />
      <View style={[styles.docImagesRow, { marginTop: SPACING.md }]}>
        <DocImage label="Insurance Copy" uri={doc.insurance_image} />
      </View>
    </View>
  );

  // ── JSX ────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        {step === 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => goToStep(0)}>
            <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {step === 0 ? "My Cars" : "List for Sale"}
          </Text>
          <Text style={styles.headerSub}>
            {step === 0 ? "Choose a car to sell" : "Add details & photos"}
          </Text>
        </View>
        <StepIndicator currentStep={step} totalSteps={2} />
      </View>

      {/* ── STEP 0 ── */}
      {step === 0 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.stepBanner}>
            <Ionicons name="car-sport" size={18} color={COLORS.primary} />
            <Text style={styles.stepBannerText}>
              Select the car you want to trade
            </Text>
          </View>

          {renderCarList()}

          <TouchableOpacity style={styles.addCarCard} activeOpacity={0.8}>
            <View style={styles.addCarIcon}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addCarTitle}>Add a new car</Text>
              <Text style={styles.addCarSub}>
                Register another vehicle to your account
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textTertiary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              !selectedCar && styles.primaryBtnDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selected car preview */}
          {selectedCarData !== undefined && (
            <View style={styles.selectedCarPreview}>
              {getCarThumbnail(selectedCarData) !== "" ? (
                <Image
                  source={{ uri: getCarThumbnail(selectedCarData) }}
                  style={styles.previewImg}
                />
              ) : (
                <View style={[styles.previewImg, styles.previewImgPlaceholder]}>
                  <Ionicons
                    name="car-outline"
                    size={20}
                    color={COLORS.textTertiary}
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.previewMake}>
                  {selectedCarData.make ?? "Unknown"}
                </Text>
                <Text style={styles.previewModel}>
                  {getCarLabel(selectedCarData)}
                  {selectedCarData.year != null
                    ? ` · ${selectedCarData.year}`
                    : ""}
                </Text>
              </View>
              <TouchableOpacity onPress={() => goToStep(0)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Photos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="images-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>PHOTOS</Text>
              <Text style={styles.sectionCount}>{filledPhotos}/5 · min 3</Text>
            </View>
            <Text style={styles.sectionHint}>
              First photo will be used as cover image
            </Text>
            <PhotoGrid
              photos={photos}
              onAdd={pickPhoto}
              onRemove={removePhoto}
            />
          </View>

          {/* Pricing */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="pricetag-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>PRICING & MILEAGE</Text>
            </View>
            <InputField
              label="Expected Price"
              required
              placeholder="0"
              value={expectedPrice}
              onChange={setExpectedPrice}
              keyboardType="numeric"
              prefix="₹"
            />
            <InputField
              label="KMs Driven"
              required
              placeholder="e.g. 25000"
              value={kmsDriven}
              onChange={setKmsDriven}
              keyboardType="numeric"
              suffix="km"
            />
          </View>

          {/* Car Details */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={15} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>CAR DETAILS</Text>
            </View>
            <View style={styles.inputGroup}>
              <FieldLabel label="Fuel Type" />
              <ChipRow
                options={FUEL_TYPES}
                value={fuelType}
                onChange={setFuelType}
              />
            </View>
            <View style={styles.inputGroup}>
              <FieldLabel label="Ownership" />
              <ChipRow
                options={OWNER_OPTIONS}
                value={owner}
                onChange={setOwner}
              />
            </View>
            <InputField
              label="Color"
              placeholder="e.g. Midnight Black"
              value={color}
              onChange={setColor}
            />
          </View>

          {/* Location & Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="location-outline"
                size={15}
                color={COLORS.primary}
              />
              <Text style={styles.sectionTitle}>LOCATION & NOTES</Text>
            </View>
            <InputField
              label="City"
              required
              placeholder="e.g. Mumbai"
              value={city}
              onChange={setCity}
            />
            <View style={styles.inputGroup}>
              <FieldLabel label="Additional Notes" />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mention any modifications, service history, reason for selling..."
                placeholderTextColor={COLORS.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* RC + Insurance */}
          {selectedCarData?.documents != null &&
            renderDocumentsSection(selectedCarData.documents)}

          <TouchableOpacity
            style={[styles.primaryBtn, isLoading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>
              {isLoading ? "Submitting..." : "List My Car"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your listing will be reviewed within 24 hours before going live.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === "ios" ? 56 : 20,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  headerSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 1,
  },

  stepIndicator: { flexDirection: "row", alignItems: "center", gap: 2 },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cardBackground,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepDotActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "20",
  },
  stepDotDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum: { fontSize: 9, color: COLORS.textSecondary, fontWeight: "700" },
  stepLine: {
    width: 16,
    height: 1.5,
    backgroundColor: COLORS.border,
    marginHorizontal: 2,
  },
  stepLineDone: { backgroundColor: COLORS.primary },

  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: 100,
  },

  stepBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  stepBannerText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
  },

  loadingBox: {
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
    gap: SPACING.md,
  },
  loadingText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  emptyBox: {
    alignItems: "center",
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  carCard: {
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: SPACING.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.border,
    height: 160,
    position: "relative",
  },
  carCardSelected: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  carCardImg: { width: "100%", height: "100%", position: "absolute" },
  carCardImgPlaceholder: {
    backgroundColor: COLORS.cardBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  carCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  selectedBadge: {
    position: "absolute",
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xl,
  },
  carCardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    paddingTop: 32,
  },
  carMake: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: "#fff",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  carModel: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: "#fff",
    marginBottom: SPACING.sm,
  },
  carMeta: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  carMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  carMetaText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: "#fff",
  },

  addCarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  addCarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  addCarTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  addCarSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  primaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.lg,
    marginTop: SPACING.sm,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: "#fff",
    letterSpacing: 0.3,
  },

  selectedCarPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImg: {
    width: 64,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  previewImgPlaceholder: { justifyContent: "center", alignItems: "center" },
  previewMake: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  previewModel: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  changeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },

  section: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    flex: 1,
  },
  sectionCount: { fontSize: FONT_SIZES.xs, color: COLORS.textTertiary },
  sectionHint: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },

  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  docLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, flex: 1 },
  docValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    maxWidth: "52%",
    textAlign: "right",
  },

  docImagesRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  docImageWrap: { flex: 1, alignItems: "center", gap: SPACING.xs },
  docImage: {
    width: "100%",
    height: 90,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.border,
  },
  docImagePlaceholder: {
    width: "100%",
    height: 90,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  docImageLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: FONT_WEIGHTS.medium,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.lg,
  },

  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  photoCell: {
    width: (width - SPACING.xl * 2 - SPACING.lg * 2 - SPACING.sm * 4) / 3,
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "visible",
  },
  photoFilled: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    position: "relative",
  },
  photoFilledImg: { width: "100%", height: "100%" },
  photoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  photoCoverBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCoverText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  photoEmpty: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  photoEmptyMain: {
    borderColor: COLORS.primary + "60",
    backgroundColor: COLORS.primary + "08",
  },
  photoEmptyLabel: {
    fontSize: 9,
    color: COLORS.textTertiary,
    textAlign: "center",
    fontWeight: "500",
  },

  inputGroup: { marginTop: SPACING.md },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  required: { color: COLORS.primary, marginLeft: 2, fontSize: 14 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  inputAffix: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  textArea: {
    height: 90,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },

  chipScroll: { marginTop: 4 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHTS.medium,
  },
  chipTextActive: { color: "#fff", fontWeight: FONT_WEIGHTS.semibold },

  disclaimer: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: SPACING.lg,
    lineHeight: 18,
  },
});
