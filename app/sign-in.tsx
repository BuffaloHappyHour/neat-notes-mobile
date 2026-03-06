// app/sign-in.tsx
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

import { radii } from "../lib/radii";
import { shadows } from "../lib/shadows";
import { spacing } from "../lib/spacing";
import { colors } from "../lib/theme";
import { type } from "../lib/typography";

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
        <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
          {show ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </View>
  );
}

type Mode = "signin" | "signup";

export default function SignInScreen() {
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [rerenderTick, setRerenderTick] = useState(0);
  const [sessionMessage, setSessionMessage] = useState("");

  const signIn = async () => {
    if (busy) return;

    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    setBusy(true);
    setSessionMessage("Running real sign in…");

    const { error } = await supabase.auth.signInWithPassword({
      email: em,
      password: pw,
    });

    setBusy(false);

    if (error) {
      setSessionMessage(`Real sign in failed: ${error.message}`);
      return Alert.alert("Sign in failed", error.message);
    }

    setSessionMessage("Real sign in succeeded.");
    router.replace("/(tabs)/home");
  };

  const createAccount = async () => {
    if (busy) return;

    const em = email.trim();
    const pw = password;

    if (!em || !pw) {
      return Alert.alert("Missing info", "Please enter an email and password.");
    }

    setBusy(true);

    const { error } = await supabase.auth.signUp({
      email: em,
      password: pw,
    });

    setBusy(false);

    if (error) {
      return Alert.alert("Create account failed", error.message);
    }

    Alert.alert(
      "Check your email",
      "We sent a confirmation email. Verify your address, then return and sign in."
    );
    setMode("signin");
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

    if (error) {
      return Alert.alert("Reset failed", error.message);
    }

    Alert.alert(
      "Reset email sent",
      "Open the reset email and tap the button. You’ll land on a secure reset page."
    );
  };

  const forceRerender = () => {
    setRerenderTick((v) => v + 1);
    setSessionMessage(`Forced rerender: ${Date.now()}`);
  };

  const runGetSession = async () => {
    if (busy) return;

    setBusy(true);
    setSessionMessage("Running getSession()…");

    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setSessionMessage(`getSession failed: ${error.message}`);
      } else if (data.session?.user) {
        setSessionMessage(`getSession user: ${data.session.user.email ?? "signed in"}`);
      } else {
        setSessionMessage("getSession returned no session.");
      }
    } catch (e: any) {
      setSessionMessage(`getSession threw: ${String(e?.message ?? e)}`);
    } finally {
      setBusy(false);
    }
  };

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
        <Text style={type.screenTitle}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </Text>

        <Card
          title="DEBUG: Auth Reset Lab"
          subtitle="We’re testing which auth-related action unsticks navigation."
        >
          <Text style={[type.microcopyItalic, { opacity: 0.9 }]}>
            Rerender Tick: {rerenderTick}
          </Text>

          {sessionMessage ? (
            <Text style={[type.microcopyItalic, { opacity: 0.9, lineHeight: 20 }]}>
              {sessionMessage}
            </Text>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <ThemedButton
              label="Force Rerender Only"
              onPress={forceRerender}
              disabled={busy}
              tone="secondary"
            />

            <ThemedButton
              label={busy ? "Working…" : "Run getSession()"}
              onPress={runGetSession}
              disabled={busy}
              tone="secondary"
            />            
            
            <ThemedButton
              label={busy ? "Working…" : "Run signOut()"}
              onPress={async () => {
                if (busy) return;

                setBusy(true);
                setSessionMessage("Running signOut()…");

                try {
                  const { error } = await supabase.auth.signOut();

                  if (error) {
                    setSessionMessage(`signOut failed: ${error.message}`);
                  } else {
                    setSessionMessage("signOut succeeded.");
                  }
                } catch (e: any) {
                  setSessionMessage(`signOut threw: ${String(e?.message ?? e)}`);
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
              tone="secondary"
            />
          </View>
        </Card>

        <Card
          title={mode === "signin" ? "Sign In" : "Create Account"}
          subtitle="Static sign-in screen for iOS navigation isolate test."
        >
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
            onSubmitEditing={mode === "signin" ? signIn : createAccount}
          />

          {mode === "signin" ? (
            <>
              <ThemedButton
                label={busy ? "Working…" : "Real Sign In"}
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
                label="Create Account"
                onPress={() => setMode("signup")}
                disabled={busy}
                tone="secondary"
              />
            </>
          ) : (
            <>
              <ThemedButton
                label={busy ? "Working…" : "Create Account"}
                onPress={createAccount}
                disabled={busy}
                tone="primary"
              />

              <ThemedButton
                label="Back to Sign In"
                onPress={() => setMode("signin")}
                disabled={busy}
                tone="secondary"
              />
            </>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}