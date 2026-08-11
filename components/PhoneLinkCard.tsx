// components/PhoneLinkCard.tsx
//
// Self-contained phone link/change/remove flow, extracted out of
// app/account-settings.tsx so it can also be rendered from the post-signup
// phone prompt. Fetches its own current linked-phone state on mount and
// manages its own busy/step state — callers only get notified via the
// optional onLinked/onRemoved/onStatus callbacks.
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { hapticSuccess } from "../lib/haptics";
import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

function formatPhoneForSupabase(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

type InputProps = React.ComponentProps<typeof TextInput>;

function ThemedInput(props: InputProps & { disabled?: boolean }) {
  const disabled = !!props.disabled;
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
      editable={!disabled}
      style={{
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        backgroundColor: "transparent",
        color: colors.textPrimary,
        fontFamily: type.body.fontFamily,
        fontSize: 16,
        opacity: disabled ? 0.65 : 1,
      }}
      {...props}
    />
  );
}

function Card({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        ...shadows.card,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ gap: spacing.xs, flex: 1 }}>
          <Text style={type.sectionHeader}>{title}</Text>
          {subtitle ? (
            <Text style={[type.microcopyItalic, { fontSize: 16, lineHeight: 22 }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={{ paddingTop: 2 }}>{right}</View> : null}
      </View>
      {children}
    </View>
  );
}

function Pill({ label, tone }: { label: string; tone: "good" | "muted" }) {
  const bg = tone === "good" ? colors.highlight : colors.surface;
  const border = tone === "good" ? colors.accent : colors.divider;
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
      }}
    >
      <Text style={[type.microcopyItalic, { opacity: 0.9 }]}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>{label}</Text>
      <Text style={[type.body, { fontWeight: "900" }]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function ThemedButton({
  label,
  onPress,
  disabled,
  tone = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
  icon?: React.ReactNode;
}) {
  const bg =
    tone === "primary"
      ? colors.accent
      : tone === "danger"
      ? "transparent"
      : colors.surface;

  const borderWidth = tone === "primary" ? 0 : 1;
  const textColor = tone === "primary" ? colors.background : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        gap: 10,
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth,
        borderColor: colors.divider,
        opacity: disabled ? 0.5 : pressed ? 0.92 : 1,
      })}
    >
      {icon ? icon : null}
      <Text style={[type.button, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

type PhoneStep = "idle" | "enterPhone" | "enterOtp";

export default function PhoneLinkCard({
  onLinked,
  onRemoved,
  onStatus,
}: {
  onLinked?: (phone: string) => void;
  onRemoved?: () => void;
  onStatus?: (message: string) => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [linkedPhone, setLinkedPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("idle");
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;
      if (!uid) {
        setLoaded(true);
        return;
      }
      const { data: profileData } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", uid)
        .single();
      setLinkedPhone(profileData?.phone ?? "");
      setLoaded(true);
    })();
  }, []);

  /* ---- Phone linking: send OTP ---- */
  const sendPhoneLinkOtp = useCallback(async () => {
    if (busy) return;
    const formatted = formatPhoneForSupabase(phoneInput);

    if (formatted.length < 10) {
      return Alert.alert("Invalid number", "Please enter a valid US phone number.");
    }

    setBusy(true);

    const { error } = await supabase.auth.updateUser({ phone: formatted });

    setBusy(false);

    if (error) {
      const code = (error as any).code ?? "";
      const msg = error.message?.toLowerCase() ?? "";
      if (code === "23505" || msg.includes("duplicate") || msg.includes("unique")) {
        Alert.alert(
          "Phone Already Linked",
          "This phone number is already associated with another account. Sign in with your email instead."
        );
        setPhoneStep("idle");
        setPhoneInput("");
        return;
      }
      return Alert.alert("Error", error.message);
    }

    setPendingPhone(formatted);
    setPhoneOtp("");
    setPhoneStep("enterOtp");
  }, [busy, phoneInput]);

  /* ---- Phone linking: verify OTP ---- */
  const verifyPhoneLinkOtp = useCallback(async () => {
    if (busy) return;

    if (phoneOtp.length !== 6) {
      return Alert.alert("Invalid code", "Please enter the 6-digit code we sent you.");
    }

    setBusy(true);

    const { error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: phoneOtp,
      type: "phone_change",
    });

    setBusy(false);

    if (error) {
      return Alert.alert(
        "Incorrect code",
        "That code didn't match. Please check and try again."
      );
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (uid) {
      try {
        // phone_prompt_seen_at is set here too (not just on skip) so a phone
        // linked directly from Account Settings also resolves the post-signup
        // prompt — the two entry points share this one write.
        await supabase
          .from("profiles")
          .update({ phone: pendingPhone, phone_prompt_seen_at: new Date().toISOString() })
          .eq("id", uid);
      } catch (profileErr) {
        console.error("profiles.phone write failed after phone_change:", profileErr);
        Alert.alert(
          "Phone linked",
          "Your phone was verified, but we couldn't save it to your profile. Try again from Account Settings."
        );
      }
    }

    setLinkedPhone(pendingPhone);
    setPhoneStep("idle");
    setPhoneInput("");
    setPhoneOtp("");
    setPendingPhone("");
    onStatus?.("Phone number linked.");
    await hapticSuccess();
    onLinked?.(pendingPhone);
  }, [busy, phoneOtp, pendingPhone, onStatus, onLinked]);

  if (!loaded) return null;

  return (
    <Card
      title="Phone Number"
      subtitle={
        linkedPhone
          ? "Your phone number is linked. You can sign in with it anytime."
          : "Link your phone for faster sign-in — no password needed."
      }
      right={
        linkedPhone
          ? <Pill label="Linked" tone="good" />
          : <Pill label="Not linked" tone="muted" />
      }
    >
      {phoneStep === "enterPhone" ? (
        <View style={{ gap: spacing.md }}>
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
            Enter your US phone number. We'll send a verification code.
          </Text>
          {linkedPhone ? (
            <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
              This will replace your current linked number.
            </Text>
          ) : null}
          <ThemedInput
            placeholder="Phone number"
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={sendPhoneLinkOtp}
            disabled={busy}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <ThemedButton
                label="Cancel"
                onPress={() => {
                  setPhoneStep("idle");
                  setPhoneInput("");
                }}
                disabled={busy}
                tone="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedButton
                label={busy ? "Sending…" : "Send Code"}
                onPress={sendPhoneLinkOtp}
                disabled={busy}
                tone="primary"
              />
            </View>
          </View>
        </View>
      ) : phoneStep === "enterOtp" ? (
        <View style={{ gap: spacing.md }}>
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
            Enter the 6-digit code sent to {pendingPhone}.
          </Text>
          <ThemedInput
            placeholder="6-digit code"
            value={phoneOtp}
            onChangeText={(v) => setPhoneOtp(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            returnKeyType="done"
            onSubmitEditing={verifyPhoneLinkOtp}
            disabled={busy}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <ThemedButton
                label="Back"
                onPress={() => {
                  setPhoneStep("enterPhone");
                  setPhoneOtp("");
                }}
                disabled={busy}
                tone="secondary"
              />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedButton
                label={busy ? "Verifying…" : "Verify Code"}
                onPress={verifyPhoneLinkOtp}
                disabled={busy || phoneOtp.length !== 6}
                tone={phoneOtp.length === 6 ? "primary" : "secondary"}
              />
            </View>
          </View>
        </View>
      ) : linkedPhone ? (
        <View style={{ gap: spacing.md }}>
          <InfoRow
            label="Linked number"
            value={linkedPhone.replace(/^\+1/, "").replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")}
          />
          <ThemedButton
            label="Change"
            onPress={() => {
              setPhoneStep("enterPhone");
              setPhoneInput("");
            }}
            disabled={busy}
            tone="secondary"
            icon={<Ionicons name="create-outline" size={18} color={colors.textPrimary} />}
          />
          <ThemedButton
            label="Remove"
            onPress={() => {
              Alert.alert(
                "Remove phone number?",
                "You won't be able to sign in with this number anymore.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                      setBusy(true);
                      try {
                        const { data: sd } = await supabase.auth.getSession();
                        const uid = sd.session?.user?.id;
                        if (uid) await supabase.from("profiles").update({ phone: null }).eq("id", uid);
                        await supabase.auth.updateUser({ phone: "" });
                        setLinkedPhone("");
                        setPhoneStep("idle");
                        onStatus?.("Phone number removed.");
                        await hapticSuccess();
                        onRemoved?.();
                      } catch {
                        Alert.alert("Error", "Failed to remove phone number. Please try again.");
                      } finally {
                        setBusy(false);
                      }
                    },
                  },
                ]
              );
            }}
            disabled={busy}
            tone="danger"
            icon={<Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} />}
          />
        </View>
      ) : (
        <ThemedButton
          label="Add Phone Number"
          onPress={() => {
            setPhoneInput("");
            setPhoneStep("enterPhone");
          }}
          disabled={busy}
          tone="secondary"
          icon={<Ionicons name="phone-portrait-outline" size={18} color={colors.textPrimary} />}
        />
      )}
    </Card>
  );
}
