// components/PhonePromptModal.tsx
//
// One-time post-signup prompt asking a fresh account to link a phone number.
// Gated by lib/phonePrompt.ts's shouldShowPhonePrompt (profiles.phone_prompt_seen_at
// IS NULL AND profiles.phone IS NULL) and only ever rendered from a real
// sign-in completion (see finishSignIn() in app/sign-in.tsx and the
// non-recovery branch of app/auth/callback.tsx) — never from a cold-start
// session restore.
import React from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { spacing } from "../lib/spacing";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";
import PhoneLinkCard from "./PhoneLinkCard";

export default function PhonePromptModal({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const skip = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (uid) {
        await supabase
          .from("profiles")
          .update({ phone_prompt_seen_at: new Date().toISOString() })
          .eq("id", uid);
      }
    } catch (e) {
      console.error("phone_prompt_seen_at skip write failed (non-fatal):", e);
    }
    onDone();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.88)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Text style={type.screenTitle}>Add your phone?</Text>
          <Text style={[type.body, { opacity: 0.85, lineHeight: 22 }]}>
            Link a phone number for faster sign-in — no password needed. You can
            always do this later from Account Settings.
          </Text>

          <PhoneLinkCard onLinked={onDone} />

          <Pressable
            onPress={skip}
            style={({ pressed }) => ({
              alignSelf: "center",
              opacity: pressed ? 0.7 : 1,
              paddingVertical: 10,
            })}
          >
            <Text style={[type.microcopyItalic, { color: colors.accent }]}>
              Skip for now
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
