// app/account-settings.tsx
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Stack, router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";

import { fetchMyProfile, upsertMyProfile } from "../lib/cloudProfile";
import { supabase } from "../lib/supabase";

import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

import {
  hapticError,
  hapticSuccess,
  hapticTick,
  invalidateHapticsCache,
} from "../lib/haptics";

/* ---------- UI helpers ---------- */

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

function ToggleRow({
  label,
  value,
  onToggle,
  disabled,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.md,
      }}
    >
      <Text style={[type.body, { fontWeight: "900", flex: 1 }]}>{label}</Text>

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        style={({ pressed }) => ({
          borderRadius: 999,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: value ? colors.accent : colors.surface,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          minWidth: 88,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Text style={[type.button, { color: value ? colors.background : colors.textPrimary }]}>
          {value ? "On" : "Off"}
        </Text>
      </Pressable>
    </View>
  );
}

/* ---------- Screen ---------- */

export default function AccountSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [statusLine, setStatusLine] = useState("");

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [email, setEmail] = useState("");

  // Unified name = profiles.display_name (also mirrored to auth username)
  const [nameUnified, setNameUnified] = useState("");
  const [privateName, setPrivateName] = useState("");

  const [editingAccount, setEditingAccount] = useState(false);
  const [nameUnifiedInput, setNameUnifiedInput] = useState("");
  const [privateNameInput, setPrivateNameInput] = useState("");

  // Password change
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Haptics
  const [hapticsEnabled, setHapticsEnabledState] = useState(true);
  const [hapticsLoaded, setHapticsLoaded] = useState(false);

  const passwordValid =
    newPassword.trim().length >= 8 && newPassword.trim() === confirmPassword.trim();

  const load = useCallback(async () => {
    setLoading(true);
    setStatusLine("");

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session?.user) {
      setIsSignedIn(false);
      setEmail("");
      setNameUnified("");
      setPrivateName("");
      setHapticsEnabledState(true);
      setHapticsLoaded(true);
      setLoading(false);
      router.replace("/(tabs)/profile");
      return;
    }

    setIsSignedIn(true);
    setEmail(session.user.email ?? "");

    // Fallback name from auth metadata if profile is empty
    const meta: any = session.user.user_metadata ?? {};
    const metaUsername = String(meta.username ?? meta.user_name ?? meta.name ?? "").trim();
    const emailFallback = session.user.email ? String(session.user.email).split("@")[0] : "";
    const baseNameFallback = metaUsername || emailFallback || "";

    try {
      const p: any = await fetchMyProfile();

      const unified = String(p?.display_name ?? "").trim() || baseNameFallback;
      const pn = String(p?.first_name ?? "").trim();

      setNameUnified(unified);
      setPrivateName(pn);

      setNameUnifiedInput(unified);
      setPrivateNameInput(pn);

      const enabled = typeof p?.haptics_enabled === "boolean" ? p.haptics_enabled : true;
      setHapticsEnabledState(enabled);
    } catch {
      setNameUnified(baseNameFallback);
      setNameUnifiedInput(baseNameFallback);
      setHapticsEnabledState(true);
    } finally {
      setHapticsLoaded(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startEditAccount() {
    if (busy) return;
    setEditingAccount(true);
    setStatusLine("");
  }

  function cancelEditAccount() {
    if (busy) return;
    setEditingAccount(false);
    setStatusLine("");
    setNameUnifiedInput(nameUnified);
    setPrivateNameInput(privateName);
  }

  async function saveAccountInfo() {
    if (busy) return;
    setBusy(true);
    setStatusLine("Saving…");

    try {
      const unified = nameUnifiedInput.trim();
      const pn = privateNameInput.trim();

      if (unified.length < 2) {
        Alert.alert("Name", "Please enter at least 2 characters.");
        setBusy(false);
        setStatusLine("");
        return;
      }

      // ✅ single source of truth
      await upsertMyProfile({
        display_name: unified,
        first_name: pn,
      });

      // ✅ mirror into auth metadata so any metadata reads stay consistent
      try {
        await supabase.auth.updateUser({ data: { username: unified, name: unified } });
      } catch {
        // non-blocking
      }

      setNameUnified(unified);
      setPrivateName(pn);

      setEditingAccount(false);
      setStatusLine("Saved.");
      setTimeout(() => setStatusLine(""), 900);
      await hapticSuccess();
    } catch (e: any) {
      setStatusLine("");
      Alert.alert("Save failed", String(e?.message ?? e));
      await hapticError();
    } finally {
      setBusy(false);
    }
  }

  function startChangePassword() {
    if (busy) return;
    setEditingPassword(true);
    setNewPassword("");
    setConfirmPassword("");
    setStatusLine("");
  }

  function cancelChangePassword() {
    if (busy) return;
    setEditingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setStatusLine("");
  }

  async function submitPasswordChange() {
    if (busy) return;

    const pw = newPassword.trim();
    const pw2 = confirmPassword.trim();

    if (pw.length < 8) return Alert.alert("Password", "Please use at least 8 characters.");
    if (pw !== pw2) return Alert.alert("Password", "Passwords do not match.");

    setBusy(true);
    setStatusLine("Updating password…");

    const { error } = await supabase.auth.updateUser({ password: pw });

    setBusy(false);

    if (error) {
      setStatusLine("");
      Alert.alert("Password update failed", error.message);
      await hapticError();
      return;
    }

    setEditingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setStatusLine("Password updated.");
    setTimeout(() => setStatusLine(""), 1200);
    await hapticSuccess();
  }

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setStatusLine("Signing out…");

    const { error } = await supabase.auth.signOut();

    setBusy(false);

    if (error) {
      setStatusLine("");
      Alert.alert("Sign out failed", error.message);
      await hapticError();
      return;
    }

    setStatusLine("");
    router.replace("/(tabs)/profile");
  }

  async function deleteAllTastings() {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    if (!session?.user) return;

    Alert.alert(
      "Delete all pours?",
      "This is permanent.\n\nAll of your tasting records for this account will be deleted and cannot be recovered.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            try {
              setBusy(true);
              setStatusLine("Deleting…");

              const { error } = await supabase
                .from("tastings")
                .delete()
                .eq("user_id", session.user.id);

              if (error) throw new Error(error.message);

              setStatusLine("Deleted.");
              setTimeout(() => setStatusLine(""), 1200);
              await hapticSuccess();
            } catch {
              setStatusLine("");
              Alert.alert(
                "Couldn’t delete yet",
                "Your security rules may not allow deletes yet. We can enable this when you’re ready."
              );
              await hapticError();
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }

  async function toggleHaptics() {
    if (!hapticsLoaded || busy) return;

    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const user = session?.user;
    if (!user?.id) return;

    const next = !hapticsEnabled;

    setBusy(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ haptics_enabled: next })
        .eq("id", user.id);

      if (error) throw new Error(error.message);

      setHapticsEnabledState(next);
      invalidateHapticsCache();

      if (next) await hapticTick();
    } catch (e: any) {
      Alert.alert("Haptics", String(e?.message ?? e));
      await hapticError();
    } finally {
      setBusy(false);
    }
  }

  const signedInPill = useMemo(() => {
    return isSignedIn ? <Pill label="Signed in" tone="good" /> : <Pill label="Signed out" tone="muted" />;
  }, [isSignedIn]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Stack.Screen
        options={{
          title: "Account Settings",
          headerStyle: { backgroundColor: colors.background as any },
          headerTintColor: colors.textPrimary as any,
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
            >
              <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing.xl * 3,
        }}
      >
        {statusLine ? (
          <Text style={[type.microcopyItalic, { opacity: 0.9 }]}>{statusLine}</Text>
        ) : null}

        <Card
          title="Account Management"
          subtitle="Everything in one place. Edit intentionally."
          right={signedInPill}
        >
          {!editingAccount ? (
            <View style={{ gap: spacing.lg }}>
              <InfoRow label="Email address" value={email || "—"} />
              <InfoRow label="User name" value={nameUnified || "—"} />
              <InfoRow label="Private name (optional)" value={privateName || "—"} />

              <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />

              <View style={{ gap: spacing.md }}>
                <ThemedButton
                  label="Edit"
                  onPress={startEditAccount}
                  disabled={busy}
                  tone="secondary"
                  icon={<Ionicons name="create-outline" size={18} color={colors.textPrimary} />}
                />

                {!editingPassword ? (
                  <ThemedButton
                    label="Change password"
                    onPress={startChangePassword}
                    disabled={busy}
                    tone="secondary"
                    icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textPrimary} />}
                  />
                ) : null}
              </View>
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <Text style={[type.body, { fontWeight: "900" }]}>User name (public)</Text>
              <ThemedInput
                placeholder="e.g., Derek @ Buffalo Happy Hour"
                value={nameUnifiedInput}
                onChangeText={setNameUnifiedInput}
                autoCapitalize="words"
              />

              <Text style={[type.body, { fontWeight: "900" }]}>Private name (optional)</Text>
              <ThemedInput
                placeholder="e.g., Derek"
                value={privateNameInput}
                onChangeText={setPrivateNameInput}
                autoCapitalize="words"
              />

              <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <ThemedButton
                    label="Cancel"
                    onPress={cancelEditAccount}
                    disabled={busy}
                    tone="secondary"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedButton
                    label={busy ? "Saving…" : "Save"}
                    onPress={saveAccountInfo}
                    disabled={busy}
                    tone="primary"
                  />
                </View>
              </View>
            </View>
          )}

          {editingPassword ? (
            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <View style={{ height: 1, backgroundColor: colors.divider, opacity: 0.9 }} />

              <Text style={[type.sectionHeader, { fontSize: 18 }]}>Password</Text>
              <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>Minimum 8 characters.</Text>

              <ThemedInput
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <ThemedInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <ThemedButton
                    label="Cancel"
                    onPress={cancelChangePassword}
                    disabled={busy}
                    tone="secondary"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedButton
                    label={busy ? "Working…" : "Update"}
                    onPress={submitPasswordChange}
                    disabled={busy || !passwordValid}
                    tone={passwordValid ? "primary" : "secondary"}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </Card>

        <Card title="Haptics" subtitle="Intentional feedback for key actions. Toggle anytime.">
          <ToggleRow
            label="Intentional touch vibrations"
            value={hapticsEnabled}
            onToggle={toggleHaptics}
            disabled={busy || !hapticsLoaded}
          />
          {!hapticsEnabled ? (
            <Text style={[type.microcopyItalic, { opacity: 0.75 }]}>
              Vibrations are off — saves won’t buzz.
            </Text>
          ) : null}
        </Card>
<Card
  title="Beta Feedback"
  subtitle="Help shape Neat Notes. Report bugs or share ideas."
>
  <ThemedButton
    label="Submit Feedback (Beta)"
    onPress={async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? "not-signed-in";

        const appVersion = Constants.expoConfig?.version ?? "unknown";
        const platform = Platform.OS;
        const timestamp = new Date().toISOString();

        const subject = encodeURIComponent("Neat Notes Beta Feedback");
        const body = encodeURIComponent(
`Please describe the issue or feedback below:

---

App Version: ${appVersion}
Platform: ${platform}
User ID: ${userId}
Timestamp: ${timestamp}

Additional Notes:
`
        );

        const mailtoUrl = `mailto:contact@buffalohappyhour.com?subject=${subject}&body=${body}`;

        await Linking.openURL(mailtoUrl);
      } catch (err) {
        Alert.alert("Error", "Unable to open email client.");
      }
    }}
    tone="primary"
    icon={<Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textPrimary} />}
  />
</Card>

        <Card title="Danger Zone" subtitle="Irreversible actions. Pour carefully.">
          <ThemedButton
            label={busy ? "Working…" : "Delete all pours"}
            onPress={deleteAllTastings}
            disabled={busy}
            tone="danger"
            icon={<Ionicons name="trash-outline" size={18} color={colors.textPrimary} />}
          />

          <ThemedButton
            label={busy ? "Working…" : "Sign Out"}
            onPress={signOut}
            disabled={busy}
            tone="secondary"
            icon={<Ionicons name="log-out-outline" size={18} color={colors.textPrimary} />}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
