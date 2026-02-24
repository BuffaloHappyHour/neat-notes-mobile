// app/admin/inbox.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    adminApproveAndPromoteCandidate,
    adminRejectCandidate,
    fetchCandidates,
    isAdmin,
    type CandidateFilter,
    type CandidateRow,
} from "../../lib/adminApi";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type Filter = "needs_review" | "promoted" | "rejected" | "all";

function MiniButton({
  label,
  variant,
  onPress,
  disabled,
}: {
  label: string;
  variant: "primary" | "danger" | "neutral";
  onPress: () => void;
  disabled?: boolean;
}) {
  const bg =
    variant === "primary"
      ? colors.accent
      : variant === "danger"
      ? colors.surface
      : colors.surface;

  const border = variant === "primary" ? colors.accent : colors.divider;

  const textColor = variant === "primary" ? colors.background : colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => ({
        height: 30,
        paddingHorizontal: 10,
        borderRadius: radii.md,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
      })}
    >
      <Text style={[type.button, { fontSize: 13, lineHeight: 16, color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: active ? colors.surface : "transparent",
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <Text style={[type.button, { fontSize: 13, lineHeight: 16, color: colors.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

function statusLabel(r: CandidateRow) {
  if (r.promoted_whiskey_id) return "Promoted";
  if (r.rejected_at) return "Rejected";
  return "Inbox";
}

function metaLine(r: CandidateRow) {
  const parts: string[] = [];
  if (r.proof != null) parts.push(`Proof ${r.proof}`);
  if (r.age != null) parts.push(`${r.age} yr`);
  if ((r.distillery ?? "").trim()) parts.push(String(r.distillery).trim());
  if ((r.whiskey_type ?? "").trim()) parts.push(String(r.whiskey_type).trim());
  return parts.join(" • ") || "—";
}

export default function AdminInboxScreen() {
  const [ok, setOk] = useState<boolean | null>(null);

  const [filter, setFilter] = useState<Filter>("needs_review");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await fetchCandidates({ q, filter: filter as CandidateFilter });
      setRows(data);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const a = await isAdmin();
      setOk(a);
      if (a) await load();
      else setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ok) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const header = useMemo(() => {
    if (ok === null) return "Checking admin…";
    if (ok === false) return "Not authorized";
    return "Inbox";
  }, [ok]);

  async function approveRow(id: string) {
    Alert.alert("Approve & Promote?", "This will upsert into whiskeys.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            setActingId(id);
            await adminApproveAndPromoteCandidate(id);
            await load();
          } catch (e: any) {
            Alert.alert("Promotion failed", e?.message ?? "Unknown error");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  }

  async function denyRow(id: string) {
    Alert.alert("Reject candidate?", "This will mark it rejected.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            setActingId(id);
            await adminRejectCandidate(id, "");
            await load();
          } catch (e: any) {
            Alert.alert("Reject failed", e?.message ?? "Unknown error");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  }

  if (ok === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <Text style={type.screenTitle}>{header}</Text>
        <Text style={[type.body, { color: colors.textSecondary, marginTop: spacing.md }]}>
          Your account isn’t marked as admin.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md }}>
      {/* Header row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={type.screenTitle}>{header}</Text>

        <Pressable
          onPress={() => router.push("/admin")}
          style={({ pressed }) => ({
            height: 36,
            paddingHorizontal: 12,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.9 : 1,
          })}
        >
          <Text style={[type.button, { fontSize: 13, lineHeight: 16, color: colors.textPrimary }]}>
            Back
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.divider,
          ...shadows.card,
          paddingHorizontal: spacing.md,
          paddingVertical: 8,
        }}
      >
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search…"
          placeholderTextColor={colors.textSecondary}
          style={{ ...type.body, color: colors.textPrimary, paddingVertical: 4 }}
          onSubmitEditing={load}
          returnKeyType="search"
        />
      </View>

      {/* Filters */}
      <View style={{ flexDirection: "row", gap: spacing.xs, flexWrap: "wrap" }}>
        <FilterPill label="Inbox" active={filter === "needs_review"} onPress={() => setFilter("needs_review")} />
        <FilterPill label="Promoted" active={filter === "promoted"} onPress={() => setFilter("promoted")} />
        <FilterPill label="Rejected" active={filter === "rejected"} onPress={() => setFilter("rejected")} />
        <FilterPill label="All" active={filter === "all"} onPress={() => setFilter("all")} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <ActivityIndicator />
        </View>
      ) : err ? (
        <Text style={[type.body, { color: colors.textSecondary }]}>{err}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item: r }) => {
            const nm = (r.name_raw ?? "").trim() || "(no name)";
            const slug = (r.canonical_slug ?? "").trim();
            const status = statusLabel(r);
            const busy = actingId === r.id;

            const actionable = !r.promoted_whiskey_id && !r.rejected_at;

            return (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  ...shadows.card,
                  padding: spacing.md,
                  flexDirection: "row",
                  gap: spacing.md,
                }}
              >
                {/* Left (3 lines max) */}
                <Pressable
                  onPress={() => router.push(`/admin/candidate/${r.id}`)}
                  style={({ pressed }) => ({
                    flex: 1,
                    opacity: pressed ? 0.9 : 1,
                    gap: 4,
                  })}
                >
                  <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]} numberOfLines={1}>
                    {nm}
                  </Text>

                  <Text style={[type.microcopyItalic, { color: colors.textPrimary, opacity: 0.85 }]} numberOfLines={1}>
                    {metaLine(r)}
                  </Text>

                  <Text style={[type.microcopyItalic, { color: colors.textSecondary }]} numberOfLines={1}>
                    {status}
                    {slug ? ` • ${slug}` : ""}
                  </Text>
                </Pressable>

                {/* Right (stacked buttons) */}
                <View style={{ width: 92, gap: 6 }}>
                  {actionable ? (
                    <>
                      <MiniButton
                        label={busy ? "…" : "Approve"}
                        variant="primary"
                        disabled={busy}
                        onPress={() => approveRow(r.id)}
                      />
                      <MiniButton
                        label={busy ? "…" : "Deny"}
                        variant="danger"
                        disabled={busy}
                        onPress={() => denyRow(r.id)}
                      />
                      <MiniButton
                        label="Edit"
                        variant="neutral"
                        onPress={() => router.push(`/admin/candidate/${r.id}`)}
                      />
                    </>
                  ) : (
                    <>
                      <MiniButton label="Done" variant="neutral" disabled onPress={() => {}} />
                      <MiniButton
                        label="Edit"
                        variant="neutral"
                        onPress={() => router.push(`/admin/candidate/${r.id}`)}
                      />
                    </>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}