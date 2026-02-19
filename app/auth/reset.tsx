import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

/* ---------- UI helpers ---------- */

function ThemedInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = "none",
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!!secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
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
      }}
    />
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accent,
        opacity: disabled ? 0.65 : pressed ? 0.92 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.background }]}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
        opacity: disabled ? 0.65 : pressed ? 0.92 : 1,
      })}
    >
      <Text style={[type.button, { color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function LinkButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        alignSelf: "flex-start",
        opacity: disabled ? 0.6 : pressed ? 0.75 : 1,
        paddingVertical: 6,
      })}
    >
      <Text style={[type.microcopyItalic, { color: colors.accent }]}>{label}</Text>
    </Pressable>
  );
}

/* -------------------- Screen -------------------- */

export default function ResetPasswordScreen() {
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [prepError, setPrepError] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);

  const passwordsOk = useMemo(() => {
    const a = pw1.trim();
    const b = pw2.trim();
    if (a.length < 8) return false;
    if (a !== b) return false;
    return true;
  }, [pw1, pw2]);

  const checkSession = useCallback(async () => {
    setChecking(true);
    setReady(false);
    setPrepError("");

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      const ok = !!data.session?.user;

      if (ok) {
        setReady(true);
        setPrepError("");
      } else {
        setReady(false);
        setPrepError(
          "No reset session was detected. Please request a new reset email, then open the link on this same phone."
        );
      }
    } catch (e: any) {
      setReady(false);
      setPrepError(String(e?.message ?? e));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 1) Initial check
    checkSession();

    // 2) Auth change (callback often finishes moments later)
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      if (cancelled) return;
      checkSession();
    });

    // 3) App active (email → app)
    const onAppState = (state: AppStateStatus) => {
      if (cancelled) return;
      if (state === "active") checkSession();
    };

    const appStateSub = AppState.addEventListener("change", onAppState);

    return () => {
      cancelled = true;
      authSub.subscription.unsubscribe();
      // @ts-ignore
      appStateSub?.remove?.();
    };
  }, [checkSession]);

  const onSave = async () => {
    if (busy) return;

    if (!ready) {
      return Alert.alert(
        "Not ready yet",
        "We couldn’t detect a secure reset session. Please request a new reset email and try again."
      );
    }

    const a = pw1.trim();
    const b = pw2.trim();

    if (a.length < 8) {
      return Alert.alert("Password", "Please use a password with at least 8 characters.");
    }
    if (a !== b) {
      return Alert.alert("Passwords", "Those passwords do not match.");
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: a });
    setBusy(false);

    if (error) {
      return Alert.alert("Update failed", error.message);
    }

    Alert.alert("Password updated", "You’re all set.");
    router.replace("/(tabs)/home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.xl, gap: spacing.xl }}>
        <Text style={type.screenTitle}>Reset Password</Text>

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
          {!ready ? (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
                <ActivityIndicator />
                <Text style={[type.body, { opacity: 0.85 }]}>
                  {checking ? "Preparing secure reset…" : "Not ready yet"}
                </Text>
              </View>

              {prepError ? (
                <Text style={[type.microcopyItalic, { opacity: 0.9, lineHeight: 20 }]}>
                  {prepError}
                </Text>
              ) : (
                <Text style={[type.microcopyItalic, { opacity: 0.75, lineHeight: 20 }]}>
                  If this takes more than a few seconds, request a new reset email from the Sign In
                  screen.
                </Text>
              )}

              <SecondaryButton
                label={checking ? "Checking…" : "Try again"}
                onPress={checkSession}
                disabled={busy || checking}
              />

              <LinkButton
                label="Back to Sign In"
                onPress={() => router.replace("/sign-in")}
                disabled={busy}
              />
            </>
          ) : (
            <>
              <Text style={[type.microcopyItalic, { opacity: 0.85, lineHeight: 20 }]}>
                Set a new password for your account.
              </Text>

              <View style={{ gap: spacing.md }}>
                <View style={{ position: "relative" }}>
                  <ThemedInput
                    placeholder="New password"
                    value={pw1}
                    onChangeText={setPw1}
                    secureTextEntry={!show}
                  />
                  <Pressable
                    onPress={() => setShow((v) => !v)}
                    hitSlop={12}
                    style={({ pressed }) => ({
                      position: "absolute",
                      right: spacing.md,
                      top: 0,
                      bottom: 0,
                      justifyContent: "center",
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Ionicons
                      name={show ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </Pressable>
                </View>

                <ThemedInput
                  placeholder="Confirm new password"
                  value={pw2}
                  onChangeText={setPw2}
                  secureTextEntry={!show}
                />
              </View>

              <PrimaryButton
                label={busy ? "Saving…" : "Save Password"}
                onPress={onSave}
                disabled={busy || !passwordsOk}
              />

              <LinkButton
                label="Back to Sign In"
                onPress={() => router.replace("/sign-in")}
                disabled={busy}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}
