import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
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
  const { height: windowH } = useWindowDimensions();

  const maxSheetHeight = useMemo(() => {
    // Leave breathing room at the top, respect safe areas.
    return Math.max(320, Math.round(windowH - insets.top - 16));
  }, [windowH, insets.top]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        {/* Tap-catcher behind the sheet */}
        <Pressable
          onPress={onClose}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Sheet */}
        <View
          style={[
            {
              width: "100%",
              maxHeight: maxSheetHeight,
              paddingBottom: insets.bottom,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              backgroundColor: "#111111",
              overflow: "hidden",
            },
            containerStyle,
          ]}
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
                <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                  {title}
                </Text>
              )}
            </View>
          )}

          {/* Content */}
          <ScrollView
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

          {/* Footer */}
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
        </View>
      </View>
    </Modal>
  );
}