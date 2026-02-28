// src/profile/components/ProfileHeader.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { spacing } from "../../../lib/spacing";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

/**
 * ProfileHeader
 *
 * - shareAnon is OPTIONAL now (pill is being removed from Profile)
 * - If shareAnon is provided by any other screen, it will still render the pill.
 * - If not provided, no pill is shown and TS will not error.
 */
export function ProfileHeader({
  welcomeTitle,
  isAuthed,
  isAdmin,
  refreshing,
  shareAnon,
  onRefresh,
}: {
  welcomeTitle: string;
  isAuthed: boolean;
  isAdmin: boolean;
  refreshing: boolean;
  shareAnon?: boolean; // ✅ optional
  onRefresh: () => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      {/* Top row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={type.screenTitle}>{welcomeTitle}</Text>
          <Text style={[type.microcopyItalic, { marginTop: 2 }]}>
            Unlock deeper palate insights.
          </Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {isAdmin ? (
            <View
              style={{
                alignSelf: "center",
                paddingHorizontal: spacing.sm,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.borderSubtle ?? colors.divider,
                backgroundColor: colors.accentFaint ?? colors.surface,
              }}
            >
              <Text style={[type.caption, { color: colors.textPrimary }]}>
                Admin
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={onRefresh}
            disabled={refreshing}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.accentFaint : colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle ?? colors.divider,
              opacity: refreshing ? 0.6 : 1,
            })}
          >
            <Ionicons
              name="refresh"
              size={18}
              color={colors.textPrimary}
              style={{ opacity: 0.9 }}
            />
          </Pressable>

          {/* Settings icon if you have it elsewhere; leaving placeholder behavior */}
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed ? colors.accentFaint : colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle ?? colors.divider,
              opacity: 0.95,
            })}
          >
            <Ionicons
              name="settings-outline"
              size={18}
              color={colors.textPrimary}
              style={{ opacity: 0.9 }}
            />
          </Pressable>
        </View>
      </View>

      {/* ✅ Optional Community Sharing pill (legacy)
          If shareAnon is undefined, we hide it entirely. */}
      {typeof shareAnon === "boolean" ? (
        <View
          style={{
            alignSelf: "flex-start",
            paddingHorizontal: spacing.md,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.borderSubtle ?? colors.divider,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            Community sharing:{" "}
            <Text style={{ color: colors.textPrimary }}>
              {shareAnon ? "On" : "Off"}
            </Text>
          </Text>
        </View>
      ) : null}

      {/* Signed-out hint */}
      {!isAuthed ? (
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Sign in to see your palate insights and recent entries.
        </Text>
      ) : null}
    </View>
  );
}