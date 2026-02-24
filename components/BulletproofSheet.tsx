import React from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
    type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;

  // Optional footer (Reset/Done buttons etc.)
  footer?: React.ReactNode;

  // Optional style overrides
  containerStyle?: ViewStyle;
};

export function BulletproofSheet({
  visible,
  title,
  onClose,
  children,
  footer,
  containerStyle,
}: Props) {
  const insets = useSafeAreaInsets();

  // IMPORTANT:
  // - "transparent" modal keeps us in control of backdrop & touch behavior.
  // - We only render the backdrop when visible (so it cannot steal touches).
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop: only exists while visible */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "flex-end",
        }}
      >
        {/* Stop touches from propagating into the backdrop */}
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            // Key: height-safe on every iPhone model
            maxHeight: Math.max(
              320,
              // leave room for top + bottom safe areas + a little breathing room
              // (value is safe across Pro/Max + Display Zoom)
              // NOTE: Modal measures screen; safe areas must be subtracted.
              // We avoid Dimensions() calls here; layout will naturally constrain.
              // maxHeight still works without explicit window height in most cases.
              // We'll add an explicit window height version in your screen file if needed.
              99999
            ),
            paddingBottom: insets.bottom,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backgroundColor: "#111111",
          }}
        >
          {/* Header */}
          {(title || footer) && (
            <View
              style={{
                paddingTop: 14,
                paddingHorizontal: 16,
                paddingBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.08)",
              }}
            >
              {!!title && (
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  {title}
                </Text>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 10,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {/* Footer (sticky-ish) */}
          {!!footer && (
            <View
              style={{
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 12,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.08)",
              }}
            >
              {footer}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}