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
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
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

/* -------------------- Google Sign-In helpers -------------------- */
function GoogleSignInButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        borderRadius: radii.md,
        paddingVertical: spacing.lg,
        backgroundColor: colors.textPrimary,
        borderWidth: 1,
        borderColor: colors.accent,
        opacity: disabled ? 0.65 : pressed ? 0.92 : 1,
      })}
    >
      <Ionicons name="logo-google" size={20} color={colors.background} />
      <Text style={[type.button, { color: colors.background }]}>Continue with Google</Text>
    </Pressable>
  );
}

function OrDivider() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
      <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.8 }]}>
        or
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
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
  | "signedIn"
  | "phoneSignin"
  | "otpEntry"
  | "signupVerifyChoice"
  | "signupPhoneEntry";

export default function SignInScreen() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const [authedEmail, setAuthedEmail] = useState<string>("");
  const [nameSaved, setNameSaved] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupEmail, setSignupEmail] = useState<string>("");

  // Phone auth state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpContext, setOtpContext] = useState<"signin" | "signup">("signin");

  const titleText = useMemo(() => {
    if (mode === "signup") return "Create Account";
    if (mode === "signedIn") return "Account";
    if (mode === "phoneSignin") return "Sign In";
    if (mode === "otpEntry") return "Enter Code";
    if (mode === "signupVerifyChoice") return "Create Account";
    if (mode === "signupPhoneEntry") return "Verify Phone";
    return "Sign In";
  }, [mode]);

  const openPrivacy = async () => {
    try {
      await Linking.openURL(PRIVACY_URL);
    } catch {
      Alert.alert("Unable to open link", "Please try again in a moment.");
    }
  };

  async function finishSignIn() {
    await syncPremiumStatusFromRevenueCat();
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

    setOtpContext("signin");
    setPendingPhone(formatted);
    setOtp("");
    setMode("otpEntry");
  };

  /* ---- Phone OTP: Verify ---- */
  const verifyOtp = async () => {
    if (busy) return;

    if (otp.length !== 6) {
      return Alert.alert("Invalid code", "Please enter the 6-digit code we sent you.");
    }

    setBusy(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: pendingPhone,
      token: otp,
      type: otpContext === "signup" ? "phone_change" : "sms",
    });

    setBusy(false);

    if (error) {
      return Alert.alert(
        "Incorrect code",
        "That code didn't match. Please check and try again, or go back to resend."
      );
    }

    if (otpContext === "signup") {
      const uid = data.session?.user?.id;
      if (uid) {
        try {
          await supabase.from("profiles").update({ phone: pendingPhone }).eq("id", uid);
        } catch (profileErr) {
          console.error("profiles.phone write failed after OTP:", profileErr);
          Alert.alert(
            "Phone linked",
            "Your phone was verified, but we couldn't save it to your profile. You can re-link it in Account Settings."
          );
        }
      }
    }

    await finishSignIn();
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
    setSignupEmail("");

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await finishSignIn();
    }
  };

  /* ---- Email sign up ---- */
  const createAccount = async () => {
    if (busy) return;
    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    if (pw !== confirmPassword) {
      return Alert.alert("Passwords don't match", "Please make sure both password fields match.");
    }

    setBusy(true);

    const { data, error } = await supabase.auth.signUp({
      email: em,
      password: pw,
    });

    setBusy(false);

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("user already")) {
        return Alert.alert(
          "An account with this email already exists. Please sign in.",
          undefined,
          [
            { text: "Go to Sign In", onPress: goToSignIn },
            { text: "OK", style: "cancel" },
          ]
        );
      }
      return Alert.alert("Create account failed", error.message);
    }

    // Supabase returns no error for duplicate emails — detect via empty identities array
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return Alert.alert(
        "Account already exists",
        "An account with this email already exists. Please sign in.",
        [
          { text: "Go to Sign In", onPress: goToSignIn },
          { text: "OK", style: "cancel" },
        ]
      );
    }

    setMode("signupVerifyChoice");
  };

  const chooseEmailVerification = async () => {
    await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: buildAuthCallbackUrl() },
    });
    setSignupEmail(email.trim());
    setMode("signin");
  };

  const choosePhoneVerification = () => {
    setMode("signupPhoneEntry");
  };

  const sendSignUpOtp = async () => {
    if (busy) return;
    const formatted = formatPhoneForSupabase(phone);

    if (formatted.length < 10) {
      return Alert.alert("Invalid number", "Please enter a valid US phone number.");
    }

    setBusy(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setBusy(false);
        Alert.alert(
          "Could not verify phone",
          "Please sign in with your email first, then add your phone number in Account Settings."
        );
        setMode("signin");
        return;
      }
    }

    const { error } = await supabase.auth.updateUser({ phone: formatted });

    setBusy(false);

    if (error) {
      return Alert.alert("Error", error.message);
    }

    setOtpContext("signup");
    setPendingPhone(formatted);
    setOtp("");
    setMode("otpEntry");
  };

  const onForgotPassword = async () => {
    if (busy) return;
    const em = email.trim();
    if (!em) {
      return Alert.alert("Reset password", "Enter your email first, then tap Reset Password.");
    }

    setBusy(true);
    const redirectTo = "https://neatnotesapp.com/auth/reset";
    const { error } = await supabase.auth.resetPasswordForEmail(em, { redirectTo });
    setBusy(false);

    if (error) return Alert.alert("Reset failed", error.message);

    Alert.alert(
      "Reset email sent",
      "Open the reset email and tap the button. You'll land on a secure Neat Notes reset page to set a new password."
    );
  };

  const goToCreateAccount = () => {
    setSignupEmail("");
    setShowPassword(false);
    setMode("signup");
  };

  const goToSignIn = () => {
    setSignupEmail("");
    setShowPassword(false);
    setMode("signin");
  };

  /* ---- Google Sign-In ---- */
  const signInWithGoogle = async () => {
    if (busy) return;
    setBusy(true);

    try {
      const scheme = getAppScheme() ?? "neatnotes";
      const redirectUri = makeRedirectUri({ scheme, path: "auth/callback" });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectUri, skipBrowserRedirect: true },
      });

      if (error || !data.url) throw error ?? new Error("No OAuth URL returned.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

      if (result.type !== "success") {
        return;
      }

      // Implicit flow: tokens arrive in URL fragment
      const fragment = result.url.split("#")[1] ?? "";
      const fragmentParams: Record<string, string> = {};
      fragment.split("&").filter(Boolean).forEach((pair) => {
        const idx = pair.indexOf("=");
        if (idx !== -1) {
          fragmentParams[decodeURIComponent(pair.slice(0, idx))] =
            decodeURIComponent(pair.slice(idx + 1));
        }
      });

      if (fragmentParams.access_token) {
        await supabase.auth.setSession({
          access_token: fragmentParams.access_token,
          refresh_token: fragmentParams.refresh_token ?? "",
        });
      } else {
        // PKCE flow: extract code and exchange
        const codeMatch = result.url.match(/[?&]code=([^&#]+)/);
        if (codeMatch?.[1]) {
          await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        throw sessionError ?? new Error("Sign-in did not complete. Please try again.");
      }

      const user = session.user;

      if (!user.email) {
        await supabase.auth.signOut();
        throw new Error(
          "This Google account has no email address. Please use an account with a verified email."
        );
      }

      // Create profile row for new users
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        const displayName =
          String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim() ||
          user.email.split("@")[0];
        await supabase.from("profiles").upsert({ id: user.id, display_name: displayName });
      }

      await finishSignIn();
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.message ?? "An error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
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

        /* ── OTP Entry (phone sign-in / sign-up) ── */
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
                setMode(otpContext === "signup" ? "signupPhoneEntry" : "phoneSignin");
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

        /* ── Signup verify choice ── */
        ) : mode === "signupVerifyChoice" ? (
          <Card
            title="One last step"
            subtitle="How would you like to verify your account?"
          >
            <ThemedButton
              label="Verify with my phone"
              onPress={choosePhoneVerification}
              disabled={busy}
              tone="primary"
            />

            <ThemedButton
              label="Send me an email instead"
              onPress={chooseEmailVerification}
              disabled={busy}
              tone="secondary"
            />
          </Card>

        /* ── Signup phone entry ── */
        ) : mode === "signupPhoneEntry" ? (
          <Card
            title="Verify with phone"
            subtitle="Enter your phone number. We'll send a one-time code to verify your account."
          >
            <ThemedInput
              placeholder="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
              onSubmitEditing={sendSignUpOtp}
              autoFocus
            />

            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
              By continuing, you agree to receive a one-time verification code via SMS. Message and data rates may apply. Reply STOP to opt out.
            </Text>

            <ThemedButton
              label={busy ? "Sending…" : "Send Code"}
              onPress={sendSignUpOtp}
              disabled={busy}
              tone="primary"
            />

            <Pressable
              onPress={chooseEmailVerification}
              style={({ pressed }) => ({
                alignSelf: "center",
                opacity: pressed ? 0.7 : 1,
                paddingVertical: 6,
              })}
            >
              <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                Use email instead
              </Text>
            </Pressable>
          </Card>

        /* ── Email Sign Up ── */
        ) : mode === "signup" ? (
          <Card title="Create Account" subtitle="Start your whiskey journey.">
            <GoogleSignInButton onPress={signInWithGoogle} disabled={busy} />
            <OrDivider />
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
              returnKeyType="next"
            />

            <PasswordRow
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              show={showConfirmPassword}
              onToggleShow={() => setShowConfirmPassword((v) => !v)}
              returnKeyType="done"
              onSubmitEditing={createAccount}
            />

            <ThemedButton
              label={busy ? "Working…" : "Create Account"}
              onPress={createAccount}
              disabled={busy}
              tone="primary"
            />

            <ThemedButton
              label={busy ? "Working…" : "I already have an account"}
              onPress={goToSignIn}
              disabled={busy}
              tone="secondary"
            />

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

            <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8, paddingHorizontal: 24 }}>
              By continuing, you agree to receive a one-time verification code via SMS. Message and data rates may apply. Reply STOP to opt out.
            </Text>

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
            <GoogleSignInButton onPress={signInWithGoogle} disabled={busy} />
            <OrDivider />
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

            {signupEmail ? (
              <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.9 }]}>
                Check your email to confirm your account before signing in.
              </Text>
            ) : null}

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
