import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import { isAdmin } from "../../lib/adminApi";
import {
  adminApproveVenueRequest,
  adminListVenueRequests,
  adminRejectVenueRequest,
  type VenueRequest,
} from "../../lib/adminVenueRequests";
import { ROLE_VENUE_PRO, ROLE_VENUE_STARTER } from "../../constants/roles";
import type { VenueRole } from "../../types/roles";
import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

function RequestCard({
  request,
  onApprove,
  onReject,
  busy,
}: {
  request: VenueRequest;
  onApprove: (role: VenueRole) => void;
  onReject: () => void;
  busy: boolean;
}) {
  const date = new Date(request.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  function promptApprove() {
    Alert.alert("Approve as…", undefined, [
      { text: "Venue Starter", onPress: () => onApprove(ROLE_VENUE_STARTER) },
      { text: "Venue Pro", onPress: () => onApprove(ROLE_VENUE_PRO) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        overflow: "hidden",
        ...shadows.card,
      }}
    >
      {/* Left accent bar */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: colors.accent,
        }}
      />

      <View style={{ padding: spacing.lg, paddingLeft: spacing.lg + 3, gap: spacing.sm }}>
        <View style={{ gap: 3 }}>
          <Text style={[type.sectionHeader, { color: colors.textPrimary, fontSize: 16 }]}>
            {request.venue_name}
          </Text>
          {(request.city || request.state) ? (
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {[request.city, request.state].filter(Boolean).join(", ")}
            </Text>
          ) : null}
          <Text style={[type.caption, { color: colors.textSecondary }]}>
            {request.contact_email}
          </Text>
          {request.contact_phone ? (
            <Text style={[type.caption, { color: colors.textSecondary }]}>
              {request.contact_phone}
            </Text>
          ) : null}
          {request.website ? (
            <Text style={[type.caption, { color: colors.textSecondary }]}>{request.website}</Text>
          ) : null}
          <Text style={[type.caption, { color: colors.textMuted }]}>{date}</Text>
        </View>

        {request.notes ? (
          <Text style={[type.body, { color: colors.textSecondary, fontSize: 13 }]}>
            {request.notes}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: spacing.sm, paddingTop: 4 }}>
          <Pressable
            onPress={promptApprove}
            disabled={busy}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              backgroundColor: colors.accent,
              opacity: busy ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            {busy ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons name="checkmark" size={16} color={colors.background} />
            )}
            <Text style={[type.button, { color: colors.background, fontSize: 14 }]}>Approve</Text>
          </Pressable>

          <Pressable
            onPress={onReject}
            disabled={busy}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.danger,
              backgroundColor: "transparent",
              opacity: busy ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
            <Text style={[type.button, { color: colors.danger, fontSize: 14 }]}>Reject</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function AdminVenueRequestsScreen() {
  const [authOk, setAuthOk] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<VenueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    isAdmin().then(setAuthOk);
  }, []);

  const load = useCallback(async () => {
    setError("");
    try {
      const rows = await adminListVenueRequests("pending");
      setRequests(rows);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authOk) load();
  }, [authOk, load]);

  async function handleApprove(id: string, role: VenueRole) {
    if (busyId) return;
    setBusyId(id);
    try {
      await adminApproveVenueRequest(id, role);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      Alert.alert("Approve failed", String(e?.message ?? e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (busyId) return;
    Alert.alert("Reject venue request?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setBusyId(id);
          try {
            await adminRejectVenueRequest(id);
            setRequests((prev) => prev.filter((r) => r.id !== id));
          } catch (e: any) {
            Alert.alert("Reject failed", String(e?.message ?? e));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }

  if (authOk === null || (authOk && loading)) {
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
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Venue Requests</Text>
        <Text style={[type.body, { color: colors.textSecondary }]}>
          Your account isn't marked as admin.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.accent}
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Text style={[type.screenTitle, { color: colors.textPrimary }]}>Venue Requests</Text>
        <Text style={[type.caption, { color: colors.textSecondary }]}>
          Review and approve venue applications.
        </Text>
      </View>

      {error ? (
        <Text style={[type.body, { color: colors.danger }]}>{error}</Text>
      ) : null}

      {!error && requests.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            padding: spacing.xl,
            alignItems: "center",
            gap: spacing.sm,
          }}
        >
          <Ionicons name="business-outline" size={28} color={colors.textMuted} />
          <Text style={[type.body, { color: colors.textSecondary }]}>No pending requests.</Text>
        </View>
      ) : null}

      {requests.map((req) => (
        <RequestCard
          key={req.id}
          request={req}
          busy={busyId === req.id}
          onApprove={(role) => handleApprove(req.id, role)}
          onReject={() => handleReject(req.id)}
        />
      ))}
    </ScrollView>
  );
}
