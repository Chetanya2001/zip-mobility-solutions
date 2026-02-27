import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import { getCarLocation } from "../../../utils/locationIQ";
import {
  COLORS,
  SPACING,
  FONT_SIZES,
  FONT_WEIGHTS,
  BORDER_RADIUS,
} from "../../../constants/theme";
import { useAuthStore } from "../../../store/auth.store";

// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = "https://zipdrive.in/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface UserCar {
  car_id: number;
  make: string | null;
  model: string | null;
  year: number;
  rc_number: string | null;
  owner_name: string | null;
  registration_type: string | null;
  thumbnail: string | null;
}

interface ChecklistTemplate {
  id: number;
  title: string;
  plan_id: number;
}

interface ServicePlan {
  id: number;
  name: string;
  code: string;
  price: number | string;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  templates?: ChecklistTemplate[];
  ChecklistTemplates?: ChecklistTemplate[];
}

interface CarMake {
  id: number;
  name: string;
}
interface CarModel {
  id: number;
  name: string;
  make_id: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────
const apiGetUserCars = async (token: string | null): Promise<UserCar[]> => {
  const res = await fetch(`${BASE_URL}/cars/my-host-cars`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error("Failed to fetch cars");
  }
  const data = await res.json();
  return (data.cars ?? []).map((car: any) => ({
    car_id: car.id,
    make: car.make ?? null,
    model: car.model ?? null,
    year: car.year,
    rc_number: car.documents?.rc_number ?? null,
    owner_name: car.documents?.owner_name ?? null,
    registration_type: car.documents?.registration_type ?? null,
    thumbnail: car.photos?.[0] ?? null,
  }));
};

const apiGetMakes = async (): Promise<CarMake[]> => {
  const res = await fetch(`${BASE_URL}/car-makes`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch makes");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data ?? []);
};

const apiGetModels = async (make_id: number): Promise<CarModel[]> => {
  const res = await fetch(`${BASE_URL}/car-models?make_id=${make_id}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch models");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.data ?? []);
};

/**
 * POST /service/cars/add  — multipart/form-data
 * Fields: car_image (file), make_id, model_id, year,
 *         rc_number, owner_name, registration_type, hand_type,
 *         address, city, latitude, longitude
 */
const apiAddCarForService = async (
  token: string,
  payload: {
    imageUri: string;
    make_id: number;
    model_id: number;
    year: number;
    rc_number?: string;
    owner_name?: string;
    registration_type?: string;
    hand_type?: string;
    address?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<{ car_id: number; thumbnail: string }> => {
  const form = new FormData();

  // Image file
  const filename = payload.imageUri.split("/").pop() ?? "car.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  form.append("car_image", {
    uri: payload.imageUri,
    name: filename,
    type: mime,
  } as any);

  // Required
  form.append("make_id", String(payload.make_id));
  form.append("model_id", String(payload.model_id));
  form.append("year", String(payload.year));

  // Optional document fields
  if (payload.rc_number) form.append("rc_number", payload.rc_number);
  if (payload.owner_name) form.append("owner_name", payload.owner_name);
  if (payload.registration_type)
    form.append("registration_type", payload.registration_type);
  if (payload.hand_type) form.append("hand_type", payload.hand_type);

  // Optional location fields
  if (payload.address) form.append("address", payload.address);
  if (payload.city) form.append("city", payload.city);
  if (payload.latitude != null)
    form.append("latitude", String(payload.latitude));
  if (payload.longitude != null)
    form.append("longitude", String(payload.longitude));

  const res = await fetch(`${BASE_URL}/service/addCar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type — let fetch set boundary
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to add car");
  }
  return res.json(); // { car_id, thumbnail }
};

const apiGetServicePlans = async (): Promise<ServicePlan[]> => {
  const res = await fetch(`${BASE_URL}/service`, {
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }
  if (!res.ok) throw new Error(json?.message || "Server error");
  return json.data?.plans ?? json.data ?? json.plans ?? [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const PLAN_ICON: Record<string, string> = {
  zip_express: "flash-outline",
  zip_classic: "shield-checkmark-outline",
  zip_repair: "construct-outline",
  zip_equip: "hardware-chip-outline",
};

const formatPrice = (price: number | string) => {
  const n = Number(price);
  return !n ? "Custom Quote" : `₹${n.toLocaleString("en-IN")}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// AddCarModal
// ─────────────────────────────────────────────────────────────────────────────
function AddCarModal({
  visible,
  onClose,
  onCarAdded,
}: {
  visible: boolean;
  onClose: () => void;
  onCarAdded: (car: UserCar) => void;
}) {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();
  const slideAnim = useRef(new Animated.Value(700)).current;

  // Dropdowns
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedMake, setSelectedMake] = useState<CarMake | null>(null);
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [makeDropOpen, setMakeDropOpen] = useState(false);
  const [modelDropOpen, setModelDropOpen] = useState(false);

  // Fields
  const [year, setYear] = useState("");
  const [rcNumber, setRcNumber] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
      loadMakes();
    } else {
      Animated.timing(slideAnim, {
        toValue: 700,
        duration: 200,
        useNativeDriver: true,
      }).start();
      // Reset
      setSelectedMake(null);
      setSelectedModel(null);
      setYear("");
      setRcNumber("");
      setOwnerName("");
      setCity("");
      setAddress("");
      setImageUri(null);
      setLocationCoords(null);
      setModels([]);
      setMakeDropOpen(false);
      setModelDropOpen(false);
    }
  }, [visible]);

  const loadMakes = async () => {
    setLoadingMakes(true);
    try {
      setMakes(await apiGetMakes());
    } catch {
      Alert.alert("Error", "Failed to load car brands.");
    } finally {
      setLoadingMakes(false);
    }
  };

  const handleSelectMake = async (make: CarMake) => {
    setSelectedMake(make);
    setSelectedModel(null);
    setMakeDropOpen(false);
    setLoadingModels(true);
    try {
      setModels(await apiGetModels(make.id));
    } catch {
      Alert.alert("Error", "Failed to load models.");
    } finally {
      setLoadingModels(false);
    }
  };

  // ── Pick image from gallery ──────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to add a car image.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  // ── Take photo with camera ───────────────────────────────────────────────
  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert("Car Photo", "Choose how to add a photo", [
      { text: "Take Photo", onPress: handleTakePhoto },
      { text: "Choose from Gallery", onPress: handlePickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleUseMyLocation = async () => {
    setFetchingLocation(true);
    try {
      const result = await getCarLocation(); // uses LocationIQ reverse geocode
      if (!result) {
        Alert.alert(
          "Error",
          "Could not get your location. Please enter it manually.",
        );
        return;
      }
      setLocationCoords({ lat: result.latitude, lng: result.longitude });
      setCity(result.city ?? "");
      setAddress(result.address ?? "");
    } catch {
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setFetchingLocation(false); // ← always runs, even after early return
    }
  };
  const currentYear = new Date().getFullYear();
  const yearNum = Number(year);
  const canAdd =
    !!selectedMake &&
    !!selectedModel &&
    year.length === 4 &&
    !isNaN(yearNum) &&
    yearNum >= 1990 &&
    yearNum <= currentYear + 1 &&
    !!imageUri;

  const handleAdd = async () => {
    if (!canAdd || !token) return;
    setSubmitting(true);
    try {
      const result = await apiAddCarForService(token, {
        imageUri: imageUri!,
        make_id: selectedMake!.id,
        model_id: selectedModel!.id,
        year: yearNum,
        rc_number: rcNumber || undefined,
        owner_name: ownerName || undefined,
        address: address || undefined,
        city: city || undefined,
        latitude: locationCoords?.lat,
        longitude: locationCoords?.lng,
      });

      onCarAdded({
        car_id: result.car_id,
        make: selectedMake!.name,
        model: selectedModel!.name,
        year: yearNum,
        rc_number: rcNumber || null,
        owner_name: ownerName || null,
        registration_type: null,
        thumbnail: result.thumbnail ?? imageUri,
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to add car.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity
        style={ms.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* CHANGED: removed paddingBottom from here, sheet is now fixed height */}
      <Animated.View
        style={[ms.sheet, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* CHANGED: fixed header block — does not scroll */}
        <View style={ms.sheetHeader}>
          <View style={ms.handle} />
          <View style={ms.titleRow}>
            <Text style={ms.title}>Add Your Car</Text>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={ms.subtitle}>
            Fill in your car details to book a service
          </Text>
        </View>

        {/* CHANGED: flex:1 on KAV and ScrollView so they fill the space between header and footer */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={ms.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* ── Car Photo ── */}
            <Text style={ms.label}>Car Photo *</Text>
            <TouchableOpacity
              style={ms.imagePicker}
              onPress={showImageOptions}
              activeOpacity={0.85}
            >
              {imageUri ? (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={ms.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={ms.imageEditBadge}>
                    <Ionicons name="camera" size={14} color="#fff" />
                    <Text style={ms.imageEditText}>Change</Text>
                  </View>
                </>
              ) : (
                <View style={ms.imagePlaceholder}>
                  <Ionicons
                    name="camera-outline"
                    size={36}
                    color={COLORS.primary}
                  />
                  <Text style={ms.imagePlaceholderText}>
                    Tap to add car photo
                  </Text>
                  <Text style={ms.imagePlaceholderSub}>Gallery or Camera</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Brand ── */}
            <Text style={ms.label}>Car Brand *</Text>
            <TouchableOpacity
              style={ms.dropdown}
              onPress={() => {
                setMakeDropOpen((v) => !v);
                setModelDropOpen(false);
              }}
            >
              <Text style={[ms.dropdownVal, !selectedMake && ms.dropdownPh]}>
                {selectedMake?.name ?? "Select brand"}
              </Text>
              {loadingMakes ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={makeDropOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textSecondary}
                />
              )}
            </TouchableOpacity>
            {makeDropOpen && (
              <View style={ms.dropList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                  {makes.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        ms.dropItem,
                        selectedMake?.id === m.id && ms.dropItemActive,
                      ]}
                      onPress={() => handleSelectMake(m)}
                    >
                      <Text
                        style={[
                          ms.dropItemText,
                          selectedMake?.id === m.id && ms.dropItemTextActive,
                        ]}
                      >
                        {m.name}
                      </Text>
                      {selectedMake?.id === m.id && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Model ── */}
            <Text style={[ms.label, { marginTop: SPACING.lg }]}>
              Car Model *
            </Text>
            <TouchableOpacity
              style={[ms.dropdown, !selectedMake && ms.dropdownDisabled]}
              onPress={() => {
                if (!selectedMake) return;
                setModelDropOpen((v) => !v);
                setMakeDropOpen(false);
              }}
              disabled={!selectedMake}
            >
              <Text style={[ms.dropdownVal, !selectedModel && ms.dropdownPh]}>
                {selectedModel?.name ?? "Select model"}
              </Text>
              {loadingModels ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons
                  name={modelDropOpen ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={COLORS.textSecondary}
                />
              )}
            </TouchableOpacity>
            {modelDropOpen && models.length > 0 && (
              <View style={ms.dropList}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                  {models.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        ms.dropItem,
                        selectedModel?.id === m.id && ms.dropItemActive,
                      ]}
                      onPress={() => {
                        setSelectedModel(m);
                        setModelDropOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          ms.dropItemText,
                          selectedModel?.id === m.id && ms.dropItemTextActive,
                        ]}
                      >
                        {m.name}
                      </Text>
                      {selectedModel?.id === m.id && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={COLORS.primary}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Year ── */}
            <Text style={[ms.label, { marginTop: SPACING.lg }]}>Year *</Text>
            <TextInput
              style={ms.input}
              placeholder={`e.g. ${currentYear - 2}`}
              placeholderTextColor={COLORS.textSecondary}
              keyboardType="number-pad"
              maxLength={4}
              value={year}
              onChangeText={setYear}
            />

            {/* ── RC Number ── */}
            <Text style={[ms.label, { marginTop: SPACING.lg }]}>RC Number</Text>
            <TextInput
              style={ms.input}
              placeholder="e.g. HR26DN5106"
              placeholderTextColor={COLORS.textSecondary}
              autoCapitalize="characters"
              value={rcNumber}
              onChangeText={setRcNumber}
            />

            {/* ── Owner Name ── */}
            <Text style={[ms.label, { marginTop: SPACING.lg }]}>
              Owner Name
            </Text>
            <TextInput
              style={ms.input}
              placeholder="Name on RC"
              placeholderTextColor={COLORS.textSecondary}
              value={ownerName}
              onChangeText={setOwnerName}
            />

            {/* ── Location ── */}
            <View style={ms.locationHeader}>
              <Text style={ms.label}>Car Location</Text>
              <TouchableOpacity
                style={ms.gpsBtn}
                onPress={handleUseMyLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="locate-outline"
                      size={14}
                      color={COLORS.primary}
                    />
                    <Text style={ms.gpsBtnText}>Use My Location</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {locationCoords && (
              <View style={ms.coordsPill}>
                <Ionicons name="location" size={13} color={COLORS.primary} />
                <Text style={ms.coordsText}>
                  {locationCoords.lat.toFixed(5)},{" "}
                  {locationCoords.lng.toFixed(5)}
                </Text>
              </View>
            )}

            <TextInput
              style={ms.input}
              placeholder="City"
              placeholderTextColor={COLORS.textSecondary}
              value={city}
              onChangeText={setCity}
            />
            <TextInput
              style={[ms.input, { marginTop: SPACING.sm }]}
              placeholder="Address (optional)"
              placeholderTextColor={COLORS.textSecondary}
              value={address}
              onChangeText={setAddress}
            />

            {/* spacer so last field isn't flush against footer */}
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* CHANGED: submit button is now a fixed footer, always visible */}
        <View
          style={[
            ms.sheetFooter,
            { paddingBottom: insets.bottom + SPACING.md },
          ]}
        >
          <TouchableOpacity
            style={[ms.submitBtn, !canAdd && ms.submitDisabled]}
            disabled={!canAdd || submitting}
            onPress={handleAdd}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <>
                <Text style={ms.submitText}>Add Car</Text>
                <Ionicons
                  name="checkmark"
                  size={18}
                  color={COLORS.background}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceHomeScreen  (unchanged logic, uses new apiAddCarForService)
// ─────────────────────────────────────────────────────────────────────────────
export default function ServiceHomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { token } = useAuthStore();

  const [cars, setCars] = useState<UserCar[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showAddCar, setShowAddCar] = useState(false);

  const selectedCar = cars.find((c) => c.car_id === selectedCarId);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  useEffect(() => {
    if (!token) return;
    loadCars();
    loadPlans();
  }, [token]);

  const loadCars = async () => {
    setLoadingCars(true);
    try {
      const data = await apiGetUserCars(token);
      setCars(data);
      if (data.length > 0) setSelectedCarId(data[0].car_id);
    } catch {
      setCars([]);
    } finally {
      setLoadingCars(false);
    }
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const data = await apiGetServicePlans();
      const active = data.filter((p) => p.is_active !== false);
      setPlans(active);
      const def = active[1] ?? active[0];
      if (def) setSelectedPlanId(def.id);
    } catch {
      Alert.alert("Error", "Could not load service plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleCarAdded = useCallback((car: UserCar) => {
    setCars((prev) => [car, ...prev]);
    setSelectedCarId(car.car_id);
  }, []);

  const handleContinue = () => {
    if (!selectedCar || !selectedPlan) return;
    navigation.navigate("ServiceBookingConfirm", {
      car: selectedCar,
      plan: selectedPlan,
    });
  };

  const canContinue = !!selectedCarId && !!selectedPlanId;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 130 },
        ]}
      >
        {/* ── Car Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Your Car</Text>
            <TouchableOpacity onPress={() => setShowAddCar(true)}>
              <Text style={styles.linkText}>+ Add Car</Text>
            </TouchableOpacity>
          </View>

          {loadingCars ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading your cars...</Text>
            </View>
          ) : cars.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyBox}
              onPress={() => setShowAddCar(true)}
              activeOpacity={0.85}
            >
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name="car-sport-outline"
                  size={40}
                  color={COLORS.primary}
                />
              </View>
              <Text style={styles.emptyTitle}>No cars added yet</Text>
              <Text style={styles.emptySub}>
                Add your car to book a service
              </Text>
              <View style={styles.emptyBtn}>
                <Ionicons name="add" size={18} color={COLORS.background} />
                <Text style={styles.emptyBtnText}>Add Your Car</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carsRow}
            >
              {cars.map((car) => {
                const isSelected = car.car_id === selectedCarId;
                const label =
                  [car.make, car.model].filter(Boolean).join(" ") || "My Car";
                return (
                  <TouchableOpacity
                    key={car.car_id}
                    style={[
                      styles.carCard,
                      isSelected && styles.carCardSelected,
                    ]}
                    onPress={() => setSelectedCarId(car.car_id)}
                    activeOpacity={0.85}
                  >
                    {isSelected && (
                      <View style={styles.carTick}>
                        <Ionicons
                          name="checkmark"
                          size={11}
                          color={COLORS.background}
                        />
                      </View>
                    )}
                    {car.thumbnail ? (
                      <Image
                        source={{ uri: car.thumbnail }}
                        style={styles.carImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.carImageFallback}>
                        <Ionicons
                          name="car-outline"
                          size={34}
                          color={COLORS.textSecondary}
                        />
                      </View>
                    )}
                    <Text style={styles.carName} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text style={styles.carYear}>{car.year}</Text>
                    {car.rc_number ? (
                      <View style={styles.plateBadge}>
                        <Text style={styles.plateText}>{car.rc_number}</Text>
                      </View>
                    ) : (
                      <Text style={styles.plateNone}>No RC</Text>
                    )}
                    {car.registration_type ? (
                      <Text style={styles.carMeta}>
                        {car.registration_type}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.addCarTile}
                onPress={() => setShowAddCar(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addCarTileIcon}>
                  <Ionicons name="add" size={28} color={COLORS.primary} />
                </View>
                <Text style={styles.addCarTileText}>Add Car</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* ── Plans Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose a Service Plan</Text>
          {loadingPlans ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const isSelected = plan.id === selectedPlanId;
                const icon = PLAN_ICON[plan.code] ?? "star-outline";
                const checklist =
                  plan.templates ?? plan.ChecklistTemplates ?? [];
                return (
                  <TouchableOpacity
                    key={plan.id}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                    ]}
                    onPress={() => setSelectedPlanId(plan.id)}
                    activeOpacity={0.85}
                  >
                    {plan.code === "zip_classic" && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularText}>POPULAR</Text>
                      </View>
                    )}
                    <View style={styles.planHeader}>
                      <View style={styles.planIconBox}>
                        <Ionicons
                          name={icon as any}
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planPrice}>
                          {formatPrice(plan.price)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      >
                        {isSelected && (
                          <Ionicons
                            name="checkmark"
                            size={13}
                            color={COLORS.background}
                          />
                        )}
                      </View>
                    </View>
                    {plan.description ? (
                      <Text style={styles.planDesc}>{plan.description}</Text>
                    ) : null}
                    {Number(plan.duration_minutes) > 0 && (
                      <View style={styles.durationRow}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={COLORS.textSecondary}
                        />
                        <Text style={styles.durationText}>
                          ~{plan.duration_minutes} mins
                        </Text>
                      </View>
                    )}
                    {checklist.length > 0 && (
                      <View style={styles.featureList}>
                        {checklist.map((item) => (
                          <View key={item.id} style={styles.featureRow}>
                            <View style={styles.featureDot}>
                              <Ionicons
                                name="checkmark"
                                size={11}
                                color={COLORS.background}
                              />
                            </View>
                            <Text style={styles.featureText}>{item.title}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {Number(plan.price) === 0 && (
                      <Text style={styles.customNote}>
                        💬 Price based on inspection
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      {!loadingCars && cars.length > 0 && (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          {selectedCar && selectedPlan && (
            <View style={styles.footerMeta}>
              <View style={{ flex: 1 }}>
                <Text style={styles.footerCarName} numberOfLines={1}>
                  {[selectedCar.make, selectedCar.model]
                    .filter(Boolean)
                    .join(" ")}{" "}
                  · {selectedCar.year}
                </Text>
                {selectedCar.rc_number ? (
                  <Text style={styles.footerRc}>{selectedCar.rc_number}</Text>
                ) : null}
              </View>
              <Text style={styles.footerPrice}>
                {formatPrice(selectedPlan.price)}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.continueBtn, !canContinue && styles.btnDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.continueBtnText}>Continue to Booking</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={COLORS.background}
            />
          </TouchableOpacity>
        </View>
      )}

      <AddCarModal
        visible={showAddCar}
        onClose={() => setShowAddCar(false)}
        onCarAdded={handleCarAdded}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal styles
// ─────────────────────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  // CHANGED: height (not maxHeight) so flex children can measure correctly
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    height: "92%",
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
  },
  // CHANGED: new fixed header block
  sheetHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  closeBtn: { padding: SPACING.sm },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  // CHANGED: form now has horizontal padding (since sheet no longer does) and no submitBtn
  form: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },

  // Image picker
  imagePicker: {
    width: "100%",
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.cardBackground,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: SPACING.lg,
  },
  imagePreview: { width: "100%", height: "100%" },
  imageEditBadge: {
    position: "absolute",
    bottom: SPACING.sm,
    right: SPACING.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  imageEditText: {
    fontSize: FONT_SIZES.xs,
    color: "#fff",
    fontWeight: FONT_WEIGHTS.semibold,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
  },
  imagePlaceholderText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  imagePlaceholderSub: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },

  // Dropdowns
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownDisabled: { opacity: 0.5 },
  dropdownVal: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  dropdownPh: { color: COLORS.textSecondary },
  dropList: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    overflow: "hidden",
  },
  dropItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropItemActive: { backgroundColor: COLORS.cardBackgroundLight },
  dropItemText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  dropItemTextActive: { color: COLORS.primary, fontWeight: FONT_WEIGHTS.bold },

  // Inputs
  input: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Location
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary + "18",
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
  },
  gpsBtnText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  coordsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "12",
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
    alignSelf: "flex-start",
  },
  coordsText: { fontSize: FONT_SIZES.xs, color: COLORS.primary },

  // CHANGED: new fixed footer containing the submit button
  sheetFooter: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  // Submit
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  submitDisabled: { opacity: 0.45 },
  submitText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main screen styles (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  scroll: { padding: SPACING.xl },
  section: { marginBottom: SPACING.xxxl },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: SPACING.xl,
  },
  loadingText: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary },
  emptyBox: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    padding: SPACING.xxxl,
    alignItems: "center",
    gap: SPACING.md,
  },
  emptyIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.md,
  },
  emptyBtnText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
  carsRow: { gap: SPACING.md, paddingRight: SPACING.md },
  carCard: {
    width: 162,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
    padding: SPACING.sm,
    overflow: "hidden",
  },
  carCardSelected: { borderColor: COLORS.primary },
  carTick: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  carImage: {
    width: "100%",
    height: 96,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    marginBottom: SPACING.sm,
  },
  carImageFallback: {
    width: "100%",
    height: 96,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    marginBottom: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  carName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  carYear: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  plateBadge: {
    backgroundColor: COLORS.cardBackgroundLight,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 3,
  },
  plateText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  plateNone: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginBottom: 3,
  },
  carMeta: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  addCarTile: {
    width: 112,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  addCarTileIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  addCarTileText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.primary,
  },
  plansContainer: { gap: SPACING.md },
  planCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.cardBackground,
    overflow: "hidden",
  },
  planCardSelected: { borderColor: COLORS.primary },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  popularText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.xs,
  },
  planIconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.cardBackgroundLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  planName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  planPrice: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  planDesc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  durationText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  featureList: { gap: SPACING.sm, marginTop: SPACING.xs },
  featureRow: { flexDirection: "row", alignItems: "center", gap: SPACING.sm },
  featureDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  featureText: { fontSize: FONT_SIZES.md, color: COLORS.textPrimary, flex: 1 },
  customNote: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerCarName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  footerRc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  footerPrice: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  btnDisabled: { opacity: 0.45 },
  continueBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
});
