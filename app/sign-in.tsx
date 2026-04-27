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

import Purchases from "react-native-purchases";
import { fetchMyProfile } from "../lib/cloudProfile";
import { syncPremiumStatusFromRevenueCat } from "../lib/premiumSync";
import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { supabase } from "../lib/supabase";
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

/* -------------------- Deep link helpers -------------------- */
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

/* -------------------- Phone helpers -------------------- */
function formatPhoneForSupabase(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  // Add +1 if US number without country code
  if (digits.length === 10) return `+1${digits}`;
  // Already has country code
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Return as-is with + prefix if longer
  return `+${digits}`;
}

/* -------------------- Screen -------------------- */
type Mode =
  | "signin"
  | "signup"
  | "signupVerifyChoice"
  | "signupPhoneInput"
  | "signupOtpEntry"
  | "signupName"
  | "signedIn"
  | "phoneSignin"
  | "otpEntry";

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

  // Phone auth state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  // Holds the email account's user id during SMS signup verification
  const [pendingUserId, setPendingUserId] = useState<string>("");

  const titleText = useMemo(() => {
    if (
      mode === "signup" ||
      mode === "signupVerifyChoice" ||
      mode === "signupPhoneInput" ||
      mode === "signupOtpEntry" ||
      mode === "signupName"
    )
      return "Create Account";
    if (mode === "signedIn") return "Account";
    if (mode === "phoneSignin") return "Sign In";
    if (mode === "otpEntry") return "Enter Code";
    return "Sign In";
  }, [mode]);

  const openPrivacy = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch {
      Alert.alert("Unable to open link", "Please try again in a moment.");
    }
  };

  async function finishSignIn(userId: string) {
    await Purchases.logIn(userId);
    await syncPremiumStatusFromRevenueCat();
    await loadSessionOnce();
    router.replace("/(tabs)/home");
  }

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
    setAuthedEmail(user.email ?? user.phone ?? "");

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

  /* ---- Phone sign-in: check profile, then send OTP ---- */
  const sendSignInOtp = async () => {
    if (busy) return;
    const formatted = formatPhoneForSupabase(phone);

    if (formatted.length < 10) {
      return Alert.alert("Invalid number", "Please enter a valid US phone number.");
    }

    setBusy(true);

    const { data: phoneExists } = await supabase.rpc("check_phone_exists", { p_phone: formatted });

    if (!phoneExists) {
      setBusy(false);
      return Alert.alert(
        "No account found",
        "No account found with this number. Please sign in with email first."
      );
    }

    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });

    setBusy(false);

    if (error) {
      return Alert.alert("Error", error.message);
    }

    setPendingPhone(formatted);
    setOtp("");
    setMode("otpEntry");
  };

  /* ---- Phone OTP: Verify (sign-in) ---- */
  const verifyOtp = async () => {
    if (busy) return;

    if (otp.length !== 6) {
      return Alert.alert("Invalid code", "Please enter the 6-digit code we sent you.");
    }

    setBusy(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: otp,
      type: "sms",
    });

    setBusy(false);

    if (error) {
      return Alert.alert(
        "Incorrect code",
        "That code didn't match. Please check and try again, or go back to resend."
      );
    }

    const userId = data.session?.user?.id;
    if (userId) {
      await finishSignIn(userId);
    }
  };

  /* ---- Signup SMS: send OTP ---- */
  const sendSignupOtp = async () => {
    if (busy) return;
    const formatted = formatPhoneForSupabase(phone);

    if (formatted.length < 10) {
      return Alert.alert("Invalid number", "Please enter a valid US phone number.");
    }

    setBusy(true);

    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });

    setBusy(false);

    if (error) {
      return Alert.alert("Error", error.message);
    }

    setPendingPhone(formatted);
    setOtp("");
    setMode("signupOtpEntry");
  };

  /* ---- Signup SMS: verify OTP, link phone, go to name screen ---- */
  const verifySignupOtp = async () => {
    if (busy) return;

    if (otp.length !== 6) {
      return Alert.alert("Invalid code", "Please enter the 6-digit code we sent you.");
    }

    setBusy(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: otp,
      type: "sms",
    });

    setBusy(false);

    if (error) {
      return Alert.alert(
        "Incorrect code",
        "That code didn't match. Please check and try again, or go back to resend."
      );
    }

    const userId = data.session?.user?.id ?? pendingUserId;
    if (userId) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: pendingPhone })
        .eq("id", userId);

      if (updateError) {
        if ((updateError as any).code === "23505") {
          Alert.alert(
            "Phone already in use",
            "This phone number is already linked to another account. Please sign in with email instead."
          );
          setMode("signin");
          return;
        }
      }
    }

    setMode("signupName");
  };

  /* ---- Email sign in ---- */
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
          "Please verify your email address, then try signing in again.\n\nIf you don't see the email, check spam."
        );
      }

      if (msg.includes("invalid login credentials")) {
        return Alert.alert(
          "Sign in failed",
          "That email/password combo didn't work.\n\nIf you don't have an account yet, tap Create Account.\nIf you forgot your password, tap Reset Password.",
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

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await finishSignIn(session.user.id);
    }
  };

  /* ---- Email sign up — create account, then choose verification ---- */
  const createAccountOneTap = async () => {
    if (busy) return;
    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    setBusy(true);

    const emailRedirectTo = buildAuthCallbackUrl();

    const { data, error } = await supabase.auth.signUp({
      email: em,
      password: pw,
      options: { emailRedirectTo },
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

    const userId = data.session?.user?.id ?? data.user?.id ?? "";
    setPendingUserId(userId);
    setJustSignedUpEmail(em);
    setSignupEmail(em);
    setMode("signupVerifyChoice");
  };

  /* ---- After name screen: finish sign-in if session exists ---- */
  const continueAfterName = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user?.id) {
      await finishSignIn(data.session.user.id);
    } else {
      setMode("signin");
      Alert.alert("Almost there", "Once you confirm your email, sign in and we'll apply your name.");
    }
  };

  const onForgotPassword = async () => {
    if (busy) return;
    const em = email.trim();
    if (!em) {
      return Alert.alert("Reset password", "Enter your email first, then tap Reset Password.");
    }

    setBusy(true);
    const redirectTo = "https://neatnotes-web.vercel.app/auth/reset";
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
    setBusy(false);

    if (error) return Alert.alert("Reset failed", error.message);

    Alert.alert(
      "Reset email sent",
      "Open the reset email and tap the button. You'll land on a secure Neat Notes reset page to set a new password."
    );
  };

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

        {/* ── Signed In ── */}
        {mode === "signedIn" ? (
          <Card
            title={nameSaved ? `Welcome, ${nameSaved}.` : "You're signed in."}
            subtitle="Your tastings are synced to the cloud."
          >
            <Text style={[type.body, { opacity: 0.85 }]}>
              Signed in as{" "}
              <Text style={{ fontWeight: "800", color: colors.textPrimary }}>
                {authedEmail || "(no account info)"}
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

        /* ── OTP Entry (phone sign-in) ── */
        ) : mode === "otpEntry" ? (
          <Card
            title="Check your texts"
            subtitle={`We sent a 6-digit code to ${pendingPhone}. Enter it below.`}
          >
            <ThemedInput
              placeholder="6-digit code"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={verifyOtp}
              autoFocus
            />

            <ThemedButton
              label={busy ? "Verifying…" : "Verify Code"}
              onPress={verifyOtp}
              disabled={busy || otp.length !== 6}
              tone="primary"
            />

            <Pressable
              onPress={() => {
                setOtp("");
                setMode("phoneSignin");
              }}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Go back / resend code
              </Text>
            </Pressable>
          </Card>

        /* ── Signup OTP Entry ── */
        ) : mode === "signupOtpEntry" ? (
          <Card
            title="Check your texts"
            subtitle={`We sent a 6-digit code to ${pendingPhone}. Enter it below.`}
          >
            <ThemedInput
              placeholder="6-digit code"
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={verifySignupOtp}
              autoFocus
            />

            <ThemedButton
              label={busy ? "Verifying…" : "Verify Code"}
              onPress={verifySignupOtp}
              disabled={busy || otp.length !== 6}
              tone="primary"
            />

            <Pressable
              onPress={() => {
                setOtp("");
                setMode("signupPhoneInput");
              }}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Go back / resend code
              </Text>
            </Pressable>
          </Card>

        /* ── Signup Phone Input ── */
        ) : mode === "signupPhoneInput" ? (
          <Card
            title="Verify with SMS"
            subtitle="Enter your phone number. We'll text you a 6-digit code to verify your account."
          >
            <ThemedInput
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={sendSignupOtp}
              autoFocus
            />

            <ThemedButton
              label={busy ? "Sending…" : "Send Code"}
              onPress={sendSignupOtp}
              disabled={busy}
              tone="primary"
            />

            <Pressable
              onPress={() => setMode("signupVerifyChoice")}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Go back
              </Text>
            </Pressable>
          </Card>

        /* ── Signup: choose verification method ── */
        ) : mode === "signupVerifyChoice" ? (
          <Card
            title="Verify Your Account"
            subtitle={`Account created for ${signupEmail}. How would you like to verify?`}
          >
            <ThemedButton
              label="Send Email Confirmation"
              onPress={() => {
                Alert.alert(
                  "Check your email",
                  "We sent a confirmation email. Verify your address, then return and sign in."
                );
                setMode("signin");
              }}
              disabled={busy}
              tone="primary"
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
                paddingVertical: spacing.xs,
              }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
              <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
                or
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
            </View>

            <ThemedButton
              label="Verify with SMS"
              onPress={() => {
                setPhone("");
                setMode("signupPhoneInput");
              }}
              disabled={busy}
              tone="secondary"
            />
          </Card>

        /* ── Signup Name (optional, after SMS verification) ── */
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
              onPress={continueAfterName}
              disabled={busy}
              tone="secondary"
            />
          </Card>

        /* ── Email Sign Up ── */
        ) : mode === "signup" ? (
          <Card title="Create Account" subtitle="One tap. Then choose how to verify.">
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

        /* ── Phone Sign In ── */
        ) : mode === "phoneSignin" ? (
          <Card
            title="Sign In"
            subtitle="Enter your phone number to receive a sign-in code."
          >
            <ThemedInput
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={sendSignInOtp}
              autoFocus
            />

            <ThemedButton
              label={busy ? "Sending…" : "Send Code"}
              onPress={sendSignInOtp}
              disabled={busy}
              tone="primary"
            />

            <Pressable
              onPress={goToSignIn}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Sign in with email instead
              </Text>
            </Pressable>
          </Card>

        /* ── Email Sign In (default) ── */
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

            <Pressable
              onPress={() => setMode("phoneSignin")}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Use phone number instead
              </Text>
            </Pressable>
          </Card>
        )}

        {/* --- Compliance footer --- */}
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
