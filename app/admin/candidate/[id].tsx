import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  adminApproveAndPromoteCandidate,
  adminRejectCandidate,
  adminUpdateCandidate,
  fetchCandidate,
  isAdmin,
} from "../../../lib/adminApi";

import { radii } from "../../../lib/radii";
import { shadows } from "../../../lib/shadows";
import { spacing } from "../../../lib/spacing";
import { supabase } from "../../../lib/supabase";
import { colors } from "../../../lib/theme";
import { type } from "../../../lib/typography";

function SectionCard({
  title,
  subtitle,
  children,
  emphasized,
  compact,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  emphasized?: boolean;
  compact?: boolean;
}) {
  const hasHeader = !!title || !!subtitle;

  return (
    <View
      style={{
        backgroundColor: emphasized ? colors.highlight : colors.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: emphasized ? colors.accent : colors.divider,
        ...shadows.card,
        padding: compact ? spacing.md : spacing.lg,
        gap: spacing.md,
      }}
    >
      {hasHeader ? (
        <>
          <View style={{ gap: 4 }}>
            {title ? (
              <Text
                style={[
                  type.body,
                  {
                    color: colors.textPrimary,
                    fontWeight: emphasized ? "900" : "800",
                    fontSize: emphasized ? 19 : 18,
                  },
                ]}
              >
                {title}
              </Text>
            ) : null}

            {subtitle ? (
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    color: colors.textSecondary,
                    opacity: compact ? 0.82 : 0.92,
                  },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: emphasized ? colors.accent : colors.divider,
              opacity: emphasized ? 0.45 : 0.8,
            }}
          />
        </>
      ) : null}

      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ ...type.microcopyItalic }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType ?? "default"}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.divider,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          ...type.body,
          color: colors.textPrimary,
        }}
      />
    </View>
  );
}

function ControlledSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string | null;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  const safeOptions = Array.isArray(options) ? options : [];
  const canOpen = !disabled && safeOptions.length > 0;

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ ...type.microcopyItalic }}>{label}</Text>

      <Pressable
        disabled={!canOpen}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          paddingVertical: 12,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: colors.divider,
          backgroundColor: pressed ? colors.highlight : colors.surface,
          opacity: canOpen ? 1 : 0.55,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        })}
      >
        <Text
          style={[type.body, { color: colors.textPrimary, opacity: value ? 0.95 : 0.6 }]}
          numberOfLines={1}
        >
          {value ? value : placeholder}
        </Text>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {open ? (
        <View
          style={{
            marginTop: 6,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: "hidden",
            backgroundColor: colors.surface,
          }}
        >
          <ScrollView
            style={{ maxHeight: 260 }}
            contentContainerStyle={{ paddingVertical: 4 }}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {safeOptions.map((opt) => {
              const active = opt === value;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    backgroundColor: active
                      ? colors.highlight
                      : pressed
                        ? colors.highlight
                        : "transparent",
                  })}
                >
                  <Text
                    style={[
                      type.body,
                      { color: colors.textPrimary, fontWeight: active ? "900" : "800" },
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {!disabled && safeOptions.length === 0 ? (
        <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.8 }]}>
          No type options available.
        </Text>
      ) : null}
    </View>
  );
}

function FooterButton({
  label,
  onPress,
  tone = "default",
}: {
  label: string;
  onPress: () => void;
  tone?: "default" | "accent" | "subtle";
}) {
  const isAccent = tone === "accent";
  const isSubtle = tone === "subtle";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 56,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: isAccent ? colors.accent : colors.divider,
        backgroundColor: isAccent ? colors.accent : colors.surface,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.92 : 1,
        ...(!isAccent && !isSubtle ? shadows.card : !isSubtle ? null : shadows.card),
      })}
    >
      <Text
        style={[
          type.button,
          {
            color: isAccent ? colors.background : colors.textPrimary,
            textAlign: "center",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function AdminCandidateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ok, setOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [nameRaw, setNameRaw] = useState("");
  const [slug, setSlug] = useState("");
  const [whiskeyType, setWhiskeyType] = useState("Other");
  const [distillery, setDistillery] = useState("");
  const [proof, setProof] = useState("");
  const [age, setAge] = useState("");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [note, setNote] = useState("");

  const [meta, setMeta] = useState<any>(null);
  const [whiskeyTypeOptions, setWhiskeyTypeOptions] = useState<string[]>([]);

  const [mergeSearch, setMergeSearch] = useState("");
  const [mergeResults, setMergeResults] = useState<any[]>([]);
  const [selectedMergeId, setSelectedMergeId] = useState<string | null>(null);
  const [selectedMergeLabel, setSelectedMergeLabel] = useState("");

  const header = useMemo(() => {
    if (ok === null) return "Checking admin…";
    if (ok === false) return "Not authorized";
    return "Candidate";
  }, [ok]);

  const summaryLine = useMemo(() => {
    const parts = [
      whiskeyType?.trim() || "Unknown type",
      proof?.trim() ? `${proof.trim()} Proof` : null,
      age?.trim() ? `${age.trim()} Yr` : null,
    ].filter(Boolean);

    return parts.join(" • ");
  }, [whiskeyType, proof, age]);

  async function loadWhiskeyTypes() {
    const { data, error } = await supabase
      .from("whiskey_types")
      .select("name")
      .order("name", { ascending: true });

    if (error) throw error;

    const names = (Array.isArray(data) ? data : [])
      .map((r: any) => String(r?.name ?? "").trim())
      .filter(Boolean);

    setWhiskeyTypeOptions(names);
  }

  async function searchWhiskeys(q: string) {
    const term = q.trim();

    if (term.length < 2) {
      setMergeResults([]);
      return;
    }

    const { data, error } = await supabase
      .from("whiskeys")
      .select("id, display_name, distillery")
      .ilike("display_name", `%${term}%`)
      .order("display_name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("searchWhiskeys failed", error);
      return;
    }

    setMergeResults(Array.isArray(data) ? data : []);
  }

  async function load() {
    setLoading(true);
    const [row] = await Promise.all([fetchCandidate(id), loadWhiskeyTypes()]);
    setMeta(row);

    setNameRaw(row.name_raw ?? "");
    setSlug(row.canonical_slug ?? "");
    setWhiskeyType(row.whiskey_type ?? "Other");
    setDistillery(row.distillery ?? "");
    setProof(row.proof == null ? "" : String(row.proof));
    setAge(row.age == null ? "" : String(row.age));
    setCategory(row.category ?? "");
    setRegion(row.region ?? "");
    setSubRegion(row.sub_region ?? "");
    setNote(row.reviewer_note ?? "");

    const mergeId = row.merged_into_whiskey_id ?? null;
    setSelectedMergeId(mergeId);

    if (mergeId) {
      setSelectedMergeLabel("Merge target selected");
      setMergeSearch("");
    } else {
      setSelectedMergeLabel("");
      setMergeSearch("");
    }

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      try {
        const a = await isAdmin();
        setOk(a);
        if (!a) {
          setLoading(false);
          return;
        }
        await load();
      } catch (e: any) {
        console.error("AdminCandidateDetail load failed:", e);
        Alert.alert("Load failed", e?.message ?? "Unknown error");
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchWhiskeys(mergeSearch);
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mergeSearch]);

  async function onSave() {
    try {
      await adminUpdateCandidate({
        id,
        name_raw: nameRaw,
        canonical_slug: slug,
        whiskey_type: whiskeyType,
        distillery,
        proof: proof.trim() === "" ? null : Number(proof),
        age: age.trim() === "" ? null : Number(age),
        category: category.trim() === "" ? null : category.trim(),
        region: region.trim() === "" ? null : region.trim(),
        sub_region: subRegion.trim() === "" ? null : subRegion.trim(),
        reviewer_note: note,
        merged_into_whiskey_id: selectedMergeId,
      });
      Alert.alert("Saved", "Candidate updated.");
      await load();
    } catch (e: any) {
      Alert.alert("Save failed", e?.message ?? "Unknown error");
    }
  }

  async function onReject() {
    Alert.alert("Reject candidate?", "This will mark it rejected.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            await adminRejectCandidate(id, note);
            Alert.alert("Rejected", "Candidate rejected.");
            router.back();
          } catch (e: any) {
            Alert.alert("Reject failed", e?.message ?? "Unknown error");
          }
        },
      },
    ]);
  }

  async function onApprovePromote() {
    Alert.alert(
      selectedMergeId ? "Approve & Merge?" : "Approve?",
      selectedMergeId
        ? "This will merge into the selected existing whiskey."
        : "This will create or update the whiskey record.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              const whiskeyId = await adminApproveAndPromoteCandidate(id);
              Alert.alert("Approved", `Whiskey ID: ${whiskeyId}`);
              await load();
            } catch (e: any) {
              Alert.alert("Approval failed", e?.message ?? "Unknown error");
            }
          },
        },
      ]
    );
  }

  if (ok === false) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
        <Text style={{ ...type.screenTitle }}>{header}</Text>
        <Text style={{ ...type.body, color: colors.textSecondary, marginTop: spacing.md }}>
          Your account isn’t marked as admin.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: spacing.xs }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...type.screenTitle }}>{header}</Text>
      </View>

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              paddingBottom: spacing.xl * 2,
              gap: spacing.md,
            }}
          >
            <SectionCard title="" subtitle="" compact>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text
                  style={[
                    type.body,
                    {
                      color: colors.textPrimary,
                      fontWeight: "900",
                      fontSize: 24,
                      textAlign: "center",
                    },
                  ]}
                >
                  {nameRaw || "Unnamed candidate"}
                </Text>

                <Text
                  style={[
                    type.microcopyItalic,
                    {
                      color: colors.textSecondary,
                      textAlign: "center",
                      opacity: 0.9,
                    },
                  ]}
                >
                  {summaryLine}
                </Text>
              </View>
            </SectionCard>

            <SectionCard
              title="Identity"
              subtitle="Core naming and style information for the submitted whiskey."
            >
              <Field label="Name" value={nameRaw} onChangeText={setNameRaw} placeholder="Display name" />

              <Field
                label="Canonical slug"
                value={slug}
                onChangeText={setSlug}
                placeholder="lowercase-hyphen-slug"
              />

              <ControlledSelect
                label="Whiskey type"
                value={whiskeyType}
                placeholder="Select whiskey type…"
                options={whiskeyTypeOptions}
                onChange={setWhiskeyType}
              />
            </SectionCard>

            <SectionCard
              title="Bottle details"
              subtitle="Specific bottle traits that help identify or verify the submission."
            >
              <Field
                label="Distillery"
                value={distillery}
                onChangeText={setDistillery}
                placeholder="Distillery"
              />

              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Proof"
                    value={proof}
                    onChangeText={setProof}
                    placeholder="e.g., 92"
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Field
                    label="Age"
                    value={age}
                    onChangeText={setAge}
                    placeholder="e.g., 12"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </SectionCard>

            <SectionCard
              title="Classification"
              subtitle="Where this whiskey belongs in your catalog hierarchy."
              compact
            >
              <Field
                label="Category"
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., American"
              />

              <Field
                label="Region"
                value={region}
                onChangeText={setRegion}
                placeholder="e.g., Kentucky"
              />

              <Field
                label="Sub-region"
                value={subRegion}
                onChangeText={setSubRegion}
                placeholder="e.g., Louisville"
              />
            </SectionCard>

            <SectionCard
              title="Review decision"
              subtitle="Choose whether to merge this into an existing whiskey or approve it as a new record."
              emphasized
            >
              <View style={{ gap: spacing.xs }}>
                <Text style={{ ...type.microcopyItalic }}>Merge into existing whiskey</Text>

                <TextInput
                  value={mergeSearch}
                  onChangeText={(v) => {
                    setMergeSearch(v);
                    if (v.trim().length === 0) {
                      setSelectedMergeId(null);
                      setSelectedMergeLabel("");
                      setMergeResults([]);
                    }
                  }}
                  placeholder="Search existing whiskey..."
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    ...type.body,
                    color: colors.textPrimary,
                  }}
                />

                {selectedMergeLabel ? (
                  <View
                    style={{
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.accent,
                      backgroundColor: colors.highlight,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      gap: 4,
                    }}
                  >
                    <Text style={[type.body, { color: colors.textPrimary, fontWeight: "900" }]}>
                      Selected merge target
                    </Text>
                    <Text style={[type.microcopyItalic, { color: colors.textPrimary, opacity: 0.9 }]}>
                      {selectedMergeLabel}
                    </Text>
                  </View>
                ) : null}

                {mergeResults.map((w) => {
                  const active = selectedMergeId === w.id;
                  const sub = [w.display_name, w.distillery].filter(Boolean).join(" • ");

                  return (
                    <Pressable
                      key={w.id}
                      onPress={() => {
                        setSelectedMergeId(w.id);
                        setSelectedMergeLabel(sub || w.display_name || "Merge target selected");
                        setMergeSearch(w.display_name ?? "");
                        setMergeResults([]);
                      }}
                      style={({ pressed }) => ({
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: radii.md,
                        borderWidth: 1,
                        borderColor: active ? colors.accent : colors.divider,
                        backgroundColor: active
                          ? colors.highlight
                          : pressed
                            ? colors.highlight
                            : colors.surface,
                      })}
                    >
                      <Text style={[type.body, { color: colors.textPrimary, fontWeight: "800" }]}>
                        {w.display_name}
                      </Text>
                      {w.distillery ? (
                        <Text style={[type.microcopyItalic, { color: colors.textSecondary }]}>
                          {w.distillery}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}

                <Text style={[type.microcopyItalic, { color: colors.textSecondary, opacity: 0.85 }]}>
                  Leave blank to approve as a standalone whiskey.
                </Text>
              </View>

              <Field
                label="Reviewer note"
                value={note}
                onChangeText={setNote}
                placeholder="Internal notes"
              />
            </SectionCard>

            {meta?.promoted_whiskey_id ? (
              <Text style={{ ...type.microcopyItalic }}>
                Promoted whiskey id: {meta.promoted_whiskey_id}
              </Text>
            ) : null}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg + 12,
              borderTopWidth: 1,
              borderTopColor: colors.divider,
              backgroundColor: colors.background,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: spacing.sm,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <FooterButton label="Reject" onPress={onReject} tone="subtle" />
              <FooterButton label="Save" onPress={onSave} tone="default" />
              <FooterButton label="Approve" onPress={onApprovePromote} tone="accent" />
            </View>
          </View>
        </>
      )}
    </View>
  );
}