import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const scanLockedRef = useRef(false);

  if (!permission) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18 }}>Loading camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#111",
          justifyContent: "center",
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "700" }}>
          Camera access needed
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.84)", fontSize: 16, lineHeight: 24 }}>
          Allow camera access to scan a bottle barcode.
        </Text>

        <Pressable
          onPress={requestPermission}
          style={{
            backgroundColor: "#d6a84f",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111", fontSize: 16, fontWeight: "700" }}>
            Allow camera access
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={{
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.25)",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={
          hasScanned
            ? undefined
            : (result) => {
                if (scanLockedRef.current) return;
                scanLockedRef.current = true;

                const barcode = String(result?.data ?? "").trim();
                if (!barcode) {
                  scanLockedRef.current = false;
                  return;
                }

                setHasScanned(true);
                setScannedValue(barcode);
                console.log("SCANNED:", barcode);

                setTimeout(() => {
                  router.replace(`/log?barcode=${barcode}`);
                }, 500);
              }
        }
      />

      <View
        style={{
          position: "absolute",
          top: 60,
          left: 20,
          right: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
        </Pressable>

        {hasScanned ? (
          <Pressable
            onPress={() => {
              scanLockedRef.current = false;
              setHasScanned(false);
              setScannedValue(null);
            }}
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 999,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>Scan again</Text>
          </Pressable>
        ) : null}
      </View>

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: "86%",
            height: 180,
            borderWidth: 2,
            borderColor: "#fff",
            borderRadius: 16,
          }}
        />
      </View>

      <View
        style={{
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 28,
          backgroundColor: "rgba(0,0,0,0.55)",
          borderRadius: 16,
          padding: 16,
          gap: 8,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
          {hasScanned ? "Barcode captured" : "Scan bottle barcode"}
        </Text>

        <Text style={{ color: "rgba(255,255,255,0.84)", fontSize: 15, lineHeight: 22 }}>
          {hasScanned
            ? "Good — the scan registered."
            : "Line up the barcode inside the frame."}
        </Text>

        {scannedValue ? (
          <Text style={{ color: "#fff", fontSize: 14 }}>
            Scanned: {scannedValue}
          </Text>
        ) : null}
      </View>
    </View>
  );
}