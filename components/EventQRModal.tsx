import { Ionicons } from "@expo/vector-icons";
import * as MediaLibrary from "expo-media-library";
import React, { useRef } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";

import { radii } from "../lib/radii";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

type Props = {
  visible: boolean;
  joinCode: string;
  onClose: () => void;
};

export function EventQRModal({ visible, joinCode, onClose }: Props) {
  const qrRef = useRef<View>(null);
  const qrValue = `https://neatnotesapp.com/event/join?code=${joinCode}`;

  async function handleSave() {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera roll access is required to save the QR code.");
      return;
    }
    try {
      const uri = await captureRef(qrRef, { format: "png", quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Saved", "QR code saved to your camera roll.");
    } catch (e: any) {
      Alert.alert("Error", String(e?.message ?? e));
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
            paddingTop: spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
          }}
        >
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>Share Event</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({ padding: 4, opacity: pressed ? 0.7 : 1 })}
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Content */}
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            gap: spacing.xl,
            paddingHorizontal: spacing.xl,
          }}
        >
          {/* QR code with capturable ref */}
          <View
            ref={qrRef}
            collapsable={false}
            style={{
              backgroundColor: colors.surface,
              padding: spacing.lg,
              borderRadius: radii.lg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCode
              value={qrValue}
              size={240}
              backgroundColor={colors.surface}
              color={colors.accent}
              ecl="H"
              logo={require("../assets/images/NN_Icon_Transparent.png")}
              logoSize={48}
              logoBackgroundColor="transparent"
            />
          </View>

          {/* Join code */}
          <View style={{ alignItems: "center", gap: spacing.xs }}>
            <Text style={[type.caption, { color: colors.textSecondary, letterSpacing: 0.5, textTransform: "uppercase" }]}>
              Join code
            </Text>
            <Text
              style={{
                fontFamily: "Montserrat_500Medium",
                fontSize: 28,
                letterSpacing: 8,
                color: colors.textPrimary,
              }}
            >
              {joinCode.toUpperCase()}
            </Text>
          </View>

          {/* Save button */}
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xl,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.borderStrong,
              backgroundColor: pressed ? colors.accentSoft : "transparent",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="download-outline" size={18} color={colors.textSecondary} />
            <Text style={[type.button, { color: colors.textSecondary }]}>Save to Camera Roll</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
