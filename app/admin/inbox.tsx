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
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type Filter = "needs_review" | "promoted" | "rejected" | "all" | "pending_whiskeys" | "edit_suggestions";

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

  if ((r.whiskey_type ?? "").trim()) parts.push(r.whiskey_type ?? "");
  if (r.proof != null) parts.push(`Proof ${r.proof}`);
  if (r.age != null) parts.push(`${r.age} yr`);
  if ((r.distillery ?? "").trim()) parts.push(r.distillery ?? "");

  if ((r.category ?? "").trim()) parts.push(r.category ?? "");
  if ((r.region ?? "").trim()) parts.push(r.region ?? "");
  if ((r.sub_region ?? "").trim()) parts.push(r.sub_region ?? "");

  return parts.join(" • ") || "—";
}

export default function AdminInboxScreen() {
  const [ok, setOk] = useState<boolean | null>(null);

  const [filter, setFilter] = useState<Filter>("needs_review");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<CandidateRow[]>([]);
  const [pendingWhiskeys, setPendingWhiskeys] = useState<any[]>([]);
  const [editSuggestions, setEditSuggestions] = useState<any[]>([]);
  const [actingSuggestionId, setActingSuggestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      if (filter === "pending_whiskeys") {
        const { data, error } = await supabase
          .from("whiskeys")
          .select("id, display_name, distillery, whiskey_type, proof, age, status, created_at")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setPendingWhiskeys(Array.isArray(data) ? data : []);
        setRows([]);
        setEditSuggestions([]);
      } else if (filter === "edit_suggestions") {
        const { data, error } = await supabase
          .from("whiskey_edit_suggestions")
          .select("id, whiskey_id, field_name, current_value, suggested_value, status, created_at, whiskeys(display_name)")
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        setEditSuggestions(Array.isArray(data) ? data : []);
        setRows([]);
        setPendingWhiskeys([]);
      } else {
        const data = await fetchCandidates({ q, filter: filter as CandidateFilter });
        setRows(data);
        setPendingWhiskeys([]);
        setEditSuggestions([]);
      }
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

  async function approveSuggestion(suggestion: any) {
    Alert.alert("Approve edit?", `Apply "${suggestion.suggested_value}" for ${suggestion.field_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            setActingSuggestionId(suggestion.id);

            const fieldMap: Record<string, string> = {
              distillery: "distillery",
              proof: "proof",
              age: "age",
              mash_bill: "mash_bill",
              whiskey_type: "whiskey_type",
              category: "category",
              region: "region",
              sub_region: "sub_region",
            };

            const col = fieldMap[suggestion.field_name];
            if (col) {
              const value = ["proof", "age"].includes(suggestion.field_name)
                ? Number(suggestion.suggested_value)
                : suggestion.suggested_value;

              await supabase
                .from("whiskeys")
                .update({ [col]: value, status: "verified" })
                .eq("id", suggestion.whiskey_id);
            }

            await supabase
              .from("whiskey_edit_suggestions")
              .update({ status: "approved", reviewed_at: new Date().toISOString() })
              .eq("id", suggestion.id);

            await load();
          } catch (e: any) {
            Alert.alert("Approve failed", e?.message ?? "Unknown error");
          } finally {
            setActingSuggestionId(null);
          }
        },
      },
    ]);
  }

  async function rejectSuggestion(suggestion: any) {
    Alert.alert("Reject edit?", `Discard suggested "${suggestion.suggested_value}" for ${suggestion.field_name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            setActingSuggestionId(suggestion.id);

            await supabase
              .from("whiskey_edit_suggestions")
              .update({ status: "rejected", reviewed_at: new Date().toISOString() })
              .eq("id", suggestion.id);

            const { data: remaining } = await supabase
              .from("whiskey_edit_suggestions")
              .select("id")
              .eq("whiskey_id", suggestion.whiskey_id)
              .eq("status", "pending");

            if (!remaining || remaining.length === 0) {
              await supabase
                .from("whiskeys")
                .update({ status: "verified" })
                .eq("id", suggestion.whiskey_id);
            }

            await load();
          } catch (e: any) {
            Alert.alert("Reject failed", e?.message ?? "Unknown error");
          } finally {
            setActingSuggestionId(null);
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
        <FilterPill label="Pending Whiskeys" active={filter === "pending_whiskeys"} onPress={() => setFilter("pending_whiskeys")} />
        <FilterPill label="Edit Suggestions" active={filter === "edit_suggestions"} onPress={() => setFilter("edit_suggestions")} />
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <ActivityIndicator />
        </View>
      ) : err ? (
        <Text style={[type.body, { color: colors.textSecondary }]}>{err}</Text>
      ) : filter === "edit_suggestions" ? (
        <FlatList
          data={editSuggestions}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ paddingBottom: spacing.xl }}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          renderItem={({ item: s }) => {
            const busy = actingSuggestionId === s.id;
            const whiskeyName = (s.whiskeys as any)?.display_name ?? "Unknown whiskey";
            return (
              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  ...shadows.card,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]} numberOfLines={1}>
                  {whiskeyName}
                </Text>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[type.microcopyItalic, { color: colors.textSecondary, flex: 1 }]}>
                    {s.field_name}
                  </Text>
                  <View style={{ flex: 2, gap: 2 }}>
                    <Text style={[type.microcopyItalic, { color: colors.textMuted }]}>
                      Current: {s.current_value ?? "—"}
                    </Text>
                    <Text style={[type.microcopyItalic, { color: colors.accent }]}>
                      Suggested: {s.suggested_value}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <MiniButton
                    label={busy ? "…" : "Approve"}
                    variant="primary"
                    disabled={busy}
                    onPress={() => approveSuggestion(s)}
                  />
                  <MiniButton
                    label={busy ? "…" : "Reject"}
                    variant="danger"
                    disabled={busy}
                    onPress={() => rejectSuggestion(s)}
                  />
                  <MiniButton
                    label="View"
                    variant="neutral"
                    onPress={() => router.push(`/whiskey/${s.whiskey_id}` as any)}
                  />
                </View>
              </View>
            );
          }}
        />
      ) : filter === "pending_whiskeys" ? (
          <FlatList
            data={pendingWhiskeys}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            renderItem={({ item: w }) => (
              <Pressable
                onPress={() => router.push(`/whiskey/${w.id}` as any)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.highlight : colors.surface,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.accent,
                  padding: spacing.md,
                  gap: 4,
                })}
              >
                <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]} numberOfLines={1}>
                  {w.display_name ?? "(no name)"}
                </Text>
                <Text style={[type.microcopyItalic, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[w.whiskey_type, w.proof ? `${w.proof} proof` : null, w.distillery].filter(Boolean).join(" • ") || "—"}
                </Text>
                <Text style={[type.microcopyItalic, { color: colors.accent, opacity: 0.85 }]}>
                  Pending Verification
                </Text>
              </Pressable>
            )}
          />
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
                      {status}{slug ? ` • ${slug}` : ""}
                    </Text>
                  </Pressable>
                  <View style={{ width: 92, gap: 6 }}>
                    {actionable ? (
                      <>
                        <MiniButton label={busy ? "…" : "Approve"} variant="primary" disabled={busy} onPress={() => approveRow(r.id)} />
                        <MiniButton label={busy ? "…" : "Deny"} variant="danger" disabled={busy} onPress={() => denyRow(r.id)} />
                        <MiniButton label="Edit" variant="neutral" onPress={() => router.push(`/admin/candidate/${r.id}`)} />
                      </>
                    ) : (
                      <>
                        <MiniButton label="Done" variant="neutral" disabled onPress={() => {}} />
                        <MiniButton label="Edit" variant="neutral" onPress={() => router.push(`/admin/candidate/${r.id}`)} />
                      </>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      }
    </View>
  );
}