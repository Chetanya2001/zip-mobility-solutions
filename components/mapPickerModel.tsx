import React, { useEffect, useState } from "react";
import { View, Modal, StyleSheet, Button } from "react-native";
import MapView, { Marker, UrlTile, Region } from "react-native-maps";
import * as Location from "expo-location";

interface MapPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (loc: {
    latitude: number;
    longitude: number;
    city?: string;
    address?: string;
  }) => void;
}

export default function MapPickerModal({
  visible,
  onClose,
  onConfirm,
}: MapPickerModalProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<Region | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      let r: Region;

      if (status !== "granted") {
        r = {
          latitude: 28.6139,
          longitude: 77.209,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
      } else {
        const loc = await Location.getCurrentPositionAsync({});

        r = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
      }

      setRegion(r);
      setMarker(r);
    })();
  }, []);

  const handlePress = (e: any) => {
    setMarker({
      ...e.nativeEvent.coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  if (!region) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={{ flex: 1 }}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={region}
          onPress={handlePress}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />

          {marker && <Marker coordinate={marker} />}
        </MapView>

        <View style={{ position: "absolute", bottom: 40, width: "100%" }}>
          <Button
            title="Confirm location"
            onPress={() => marker && onConfirm(marker)}
          />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
