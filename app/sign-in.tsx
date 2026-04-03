// app/sign-in.tsx
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { syncPremiumStatusFromRevenueCat } from "../lib/premiumSync";

import { fetchMyProfile, upsertMyProfile } from "../lib/cloudProfile";
import { supabase } from "../lib/supabase";

import Purchases from "react-native-purchases";
import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

/* ---------- URLs (store compliance) ---------- */

const PRIVACY_URL = "https://buffalohappyhour.org/neat-notes-privacy/";

/* ---------- Stable UI helpers ---------- */

type InputProps = React.ComponentProps<typeof TextInput>;

function ThemedInput(props: InputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textSecondary}
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
      {...props}
    />
  );
}

function ThemedButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
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
        backgroundColor: tone === "primary" ? colors.accent : colors.surface,
        borderWidth: tone === "secondary" ? 1 : 0,
        borderColor: tone === "secondary" ? colors.divider : "transparent",
        opacity: disabled ? 0.65 : pressed ? 0.92 : 1,
      })}
    >
      <Text
        style={[
          type.button,
          { color: tone === "primary" ? colors.background : colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
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
      <View style={{ gap: spacing.xs }}>
        <Text style={type.sectionHeader}>{title}</Text>
        {subtitle ? (
          <Text style={[type.microcopyItalic, { opacity: 0.9, lineHeight: 20 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function PasswordRow({
  value,
  onChangeText,
  placeholder = "Password",
  show,
  onToggleShow,
  returnKeyType,
  onSubmitEditing,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggleShow: () => void;
  returnKeyType?: "done" | "next";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={{ position: "relative" }}>
      <ThemedInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
      />
      <Pressable
        onPress={onToggleShow}
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
  );
}

/* -------------------- Deep link helpers (kept for non-reset auth flows) -------------------- */

function getAppScheme(): string | null {
  const scheme =
    (Constants.expoConfig as any)?.scheme ||
    (Constants.manifest as any)?.scheme ||
    null;

  if (typeof scheme === "string" && scheme.trim()) return scheme.trim();
  return null;
}

function buildAuthCallbackUrl(): string {
  const scheme = getAppScheme();

  try {
    const url = Linking.createURL("auth/callback", scheme ? { scheme } : undefined);
    return url;
  } catch {
    if (scheme) return `${scheme}://auth/callback`;
    return "neatnotes://auth/callback";
  }
}

/* -------------------- Screen -------------------- */

type Mode = "signin" | "signup" | "signupName" | "signedIn";

export default function SignInScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [mode, setMode] = useState<Mode>("signin");

  const [authedEmail, setAuthedEmail] = useState<string>("");
  const [nameSaved, setNameSaved] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [justSignedUpEmail, setJustSignedUpEmail] = useState<string>("");
  const [signupEmail, setSignupEmail] = useState<string>("");

  const titleText = useMemo(() => {
    if (mode === "signup" || mode === "signupName") return "Create Account";
    if (mode === "signedIn") return "Account";
    return "Sign In";
  }, [mode]);

  const openPrivacy = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch {
      Alert.alert("Unable to open link", "Please try again in a moment.");
    }
  };

  async function loadSessionOnce() {
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;

    if (!user) {
      setMode("signin");
      setAuthedEmail("");
      setNameSaved("");
      setLoading(false);
      return;
    }

    setMode("signedIn");
    setAuthedEmail(user.email ?? "");

    try {
      const profile = await fetchMyProfile();
      const fn = (profile?.first_name ?? "").trim();
      setNameSaved(fn);
    } catch {
      setNameSaved("");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadSessionOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goToCreateAccount = () => {
    setJustSignedUpEmail("");
    setSignupEmail("");
    setNameInput("");
    setShowPassword(false);
    setMode("signup");
  };

  const goToSignIn = () => {
    setJustSignedUpEmail("");
    setSignupEmail("");
    setNameInput("");
    setShowPassword(false);
    setMode("signin");
  };

  const signIn = async () => {
    if (busy) return;

    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: em,
      password: pw,
    });

    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("email") && (msg.includes("confirm") || msg.includes("verified"))) {
        return Alert.alert(
          "Verify your email",
          "Please verify your email address, then try signing in again.\n\nIf you don’t see the email, check spam."
        );
      }

      if (msg.includes("invalid login credentials")) {
        return Alert.alert(
          "Sign in failed",
          "That email/password combo didn’t work.\n\nIf you don’t have an account yet, tap Create Account.\nIf you forgot your password, tap Reset Password.",
          [
            { text: "Reset Password", onPress: () => onForgotPassword() },
            { text: "Create Account", onPress: goToCreateAccount },
            { text: "OK", style: "cancel" },
          ]
        );
      }

      return Alert.alert("Sign in failed", error.message);
    }

    setPassword("");
    setJustSignedUpEmail("");

const {
  data: { session },
} = await supabase.auth.getSession();

if (session?.user?.id) {
  const configured = await Purchases.isConfigured();

  if (!configured) {
    const apiKey =
      Platform.OS === "android"
        ? process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY;

    if (!apiKey) {
      throw new Error("RevenueCat API key is missing for this platform.");
    }

    await Purchases.configure({
      apiKey,
      appUserID: session.user.id,
    });
  } else {
    await Purchases.logIn(session.user.id);
  }
}
await syncPremiumStatusFromRevenueCat();

    await loadSessionOnce();

    const nm = nameInput.trim();
    if (nm) {
      try {
        await upsertMyProfile({ first_name: nm });
        setNameSaved(nm);
      } catch {}
    }

    router.replace("/(tabs)/home");
  };

  const createAccountOneTap = async () => {
    if (busy) return;

    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    setBusy(true);

    // ✅ IMPORTANT: Force Supabase email confirmation links to return to the APP
    // (instead of falling back to Site URL / Vercel)
    const emailRedirectTo = buildAuthCallbackUrl();
    console.log("SIGNUP emailRedirectTo =", emailRedirectTo);

    const { data, error } = await supabase.auth.signUp({
      email: em,
      password: pw,
      options: {
        emailRedirectTo,
      },
    });

    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("already") || msg.includes("registered") || msg.includes("user already")) {
        return Alert.alert(
          "Account already exists",
          "That email is already registered.\n\nPlease sign in with that email, or reset your password if you forgot it.",
          [
            { text: "Reset Password", onPress: () => onForgotPassword() },
            { text: "Go to Sign In", onPress: goToSignIn },
            { text: "OK", style: "cancel" },
          ]
        );
      }

      return Alert.alert("Create account failed", error.message);
    }

    setJustSignedUpEmail(em);
    setSignupEmail(em);

    Alert.alert(
      "Check your email",
      "We sent a confirmation email. Verify your address, then return and sign in."
    );

    setMode("signupName");

    const user = data.session?.user;
    if (user) {
      // fine
    }
  };

  const continueAfterName = async () => {
    setMode("signin");
    Alert.alert("Almost there", "Once you confirm your email, sign in and we’ll apply your name.");
  };

  const onForgotPassword = async () => {
    if (busy) return;

    const em = email.trim();
    if (!em) {
      return Alert.alert("Reset password", "Enter your email first, then tap Reset Password.");
    }

    setBusy(true);

    // ✅ PATTERN B: send the user to your WEB reset page (Vercel).
    // This must match Supabase Redirect URLs allowlist.
    const redirectTo = "https://neatnotes-web.vercel.app/auth/reset";
    console.log("RESET redirectTo =", redirectTo);

    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });

    setBusy(false);

    if (error) {
      return Alert.alert("Reset failed", error.message);
    }

    Alert.alert(
      "Reset email sent",
      "Open the reset email and tap the button. You’ll land on a secure Neat Notes reset page to set a new password."
    );
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator />
        <Text style={[type.body, { marginTop: spacing.sm, opacity: 0.7 }]}>
          Checking session…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: spacing.xl,
          gap: spacing.xl,
          paddingBottom: spacing.xl * 2,
        }}
      >
        <Text style={type.screenTitle}>{titleText}</Text>

        {mode === "signedIn" ? (
          <Card
            title={nameSaved ? `Welcome, ${nameSaved}.` : "You’re signed in."}
            subtitle="Your tastings are synced to the cloud."
          >
            <Text style={[type.body, { opacity: 0.85 }]}>
              Signed in as{" "}
              <Text style={{ fontWeight: "800", color: colors.textPrimary }}>
                {authedEmail || "(no email)"}
              </Text>
            </Text>

            <ThemedButton
              label="Go Home"
              onPress={() => router.replace("/(tabs)/home")}
              disabled={busy}
              tone="primary"
            />

            <ThemedButton
              label={busy ? "Working…" : "Sign Out"}
              onPress={async () => {
if (busy) return;
setBusy(true);
await Purchases.logOut();
const { error } = await supabase.auth.signOut();
setBusy(false);
if (error) return Alert.alert("Sign out failed", error.message);
await loadSessionOnce();
              }}
              disabled={busy}
              tone="secondary"
            />
          </Card>
        ) : mode === "signupName" ? (
          <Card
            title="Optional"
            subtitle={
              signupEmail
                ? `Add a name for personalization (email: ${signupEmail}).`
                : "Add a name for personalization."
            }
          >
            <ThemedInput
              placeholder="Name (optional)"
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              returnKeyType="done"
            />

            <ThemedButton
              label={busy ? "Working…" : "Continue"}
              onPress={continueAfterName}
              disabled={busy}
              tone="primary"
            />

            <ThemedButton
              label="Skip"
              onPress={() => setMode("signin")}
              disabled={busy}
              tone="secondary"
            />
          </Card>
        ) : mode === "signup" ? (
          <Card title="Create Account" subtitle="One tap. Then confirm your email.">
            <ThemedInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <PasswordRow
              value={password}
              onChangeText={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              returnKeyType="done"
              onSubmitEditing={createAccountOneTap}
            />

            <ThemedButton
              label={busy ? "Working…" : "Create Account"}
              onPress={createAccountOneTap}
              disabled={busy}
              tone="primary"
            />

            <ThemedButton
              label={busy ? "Working…" : "I already have an account"}
              onPress={goToSignIn}
              disabled={busy}
              tone="secondary"
            />

            {justSignedUpEmail ? (
              <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
                Confirmation sent to {justSignedUpEmail}.
              </Text>
            ) : null}
          </Card>
        ) : (
          <Card title="Sign In" subtitle="Sign in to keep a record of your tastings">
            <ThemedInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
            />

            <PasswordRow
              value={password}
              onChangeText={setPassword}
              show={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              returnKeyType="done"
              onSubmitEditing={signIn}
            />

            <ThemedButton
              label={busy ? "Working…" : "Sign In"}
              onPress={signIn}
              disabled={busy}
              tone="primary"
            />

            <Pressable
              onPress={onForgotPassword}
              disabled={busy}
              style={({ pressed }) => ({
                alignSelf: "flex-start",
                opacity: busy ? 0.6 : pressed ? 0.75 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Forgot password?
              </Text>
            </Pressable>

            <ThemedButton
              label={busy ? "Working…" : "Create Account"}
              onPress={goToCreateAccount}
              disabled={busy}
              tone="secondary"
            />
          </Card>
        )}

        {/* --- Compliance footer (visible to reviewers + users) --- */}
        <View
          style={{
            alignItems: "center",
            gap: 8,
            paddingTop: spacing.md,
            opacity: 0.9,
          }}
        >
          <Pressable
            onPress={openPrivacy}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
          >
            <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
              Privacy Policy & Account Deletion
            </Text>
          </Pressable>

          <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.7 }]}>
            Drink responsibly.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}