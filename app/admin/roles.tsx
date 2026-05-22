import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
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

import { isAdmin } from "../../lib/adminApi";
import {
  adminGetUserRoles,
  adminGrantRole,
  adminLookupUserByEmail,
  adminRevokeRole,
} from "../../lib/adminRoles";
import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";
import type { AppRole } from "../../types/roles";
import { ALL_ROLES } from "../../constants/roles";

type FoundUser = {
  user_id: string;
  email: string;
  roles: AppRole[];
};

function RolePill({
  role,
  active,
  busy,
  onToggle,
}: {
  role: AppRole;
  active: boolean;
  busy: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={busy}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.accentSoft : "transparent",
        opacity: busy ? 0.5 : pressed ? 0.9 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Ionicons
          name={active ? "checkmark-circle" : "ellipse-outline"}
          size={15}
          color={active ? colors.accent : colors.textMuted}
        />
      )}
      <Text
        style={[
          type.button,
          {
            fontSize: 13,
            lineHeight: 16,
            color: active ? colors.textPrimary : colors.textMuted,
          },
        ]}
      >
        {role}
      </Text>
    </Pressable>
  );
}

export default function AdminRolesScreen() {
  const [authOk, setAuthOk] = useState<boolean | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const [busyRole, setBusyRole] = useState<AppRole | null>(null);

  useEffect(() => {
    isAdmin().then(setAuthOk);
  }, []);

  async function handleSearch() {
    const trimmed = emailInput.trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchError("");
    setFoundUser(null);

    try {
      const user = await adminLookupUserByEmail(trimmed);
      if (!user) {
        setSearchError("No user found with that email address.");
        return;
      }
      const roles = await adminGetUserRoles(user.user_id);
      setFoundUser({ ...user, roles });
    } catch (e: any) {
      setSearchError(String(e?.message ?? e));
    } finally {
      setSearching(false);
    }
  }

  async function handleToggle(role: AppRole) {
    if (!foundUser || busyRole) return;

    const hasIt = foundUser.roles.includes(role);
    setBusyRole(role);

    try {
      if (hasIt) {
        await adminRevokeRole(foundUser.user_id, role);
        setFoundUser((u) =>
          u ? { ...u, roles: u.roles.filter((r) => r !== role) } : u
        );
      } else {
        await adminGrantRole(foundUser.user_id, role);
        setFoundUser((u) =>
          u ? { ...u, roles: [...u.roles, role] } : u
        );
      }
    } catch (e: any) {
      Alert.alert(
        hasIt ? "Revoke failed" : "Grant failed",
        String(e?.message ?? e)
      );
    } finally {
      setBusyRole(null);
    }
  }

  if (authOk === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.sm,
        }}
      >
        <ActivityIndicator />
        <Text style={[type.body, { color: colors.textSecondary }]}>Loading…</Text>
      </View>
    );
  }

  if (authOk === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: spacing.xl,
          gap: spacing.md,
        }}
      >
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Role Management</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          Your account isn't marked as admin.
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
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: 6 }}>
          <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
            Role Management
          </Text>
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            Search a user by email, then grant or revoke roles.
          </Text>
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            onSubmitEditing={handleSearch}
            placeholder="user@example.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="search"
            style={[
              type.body,
              {
                flex: 1,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.divider,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
          />
          <Pressable
            onPress={handleSearch}
            disabled={searching || !emailInput.trim()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: radii.md,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
              opacity: searching || !emailInput.trim() ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            {searching ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="search" size={20} color={colors.background} />
            )}
          </Pressable>
        </View>

        {searchError ? (
          <Text style={[type.body, { color: colors.danger }]}>{searchError}</Text>
        ) : null}

        {foundUser ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              padding: spacing.lg,
              gap: spacing.md,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
                {foundUser.email}
              </Text>
              <Text
                style={[type.caption, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {foundUser.user_id}
              </Text>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: colors.textSecondary }]}>
                Tap a role to grant or revoke it.
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
                {ALL_ROLES.map((role) => (
                  <RolePill
                    key={role}
                    role={role}
                    active={foundUser.roles.includes(role)}
                    busy={busyRole === role}
                    onToggle={() => handleToggle(role)}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
