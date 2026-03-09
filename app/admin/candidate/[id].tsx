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
        <Text style={[type.body, { color: colors.textPrimary, opacity: value ? 0.95 : 0.6 }]} numberOfLines={1}>
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
                  <Text style={[type.body, { color: colors.textPrimary, fontWeight: active ? "900" : "800" }]}>
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
  const [note, setNote] = useState("");

  const [meta, setMeta] = useState<any>(null);
  const [whiskeyTypeOptions, setWhiskeyTypeOptions] = useState<string[]>([]);

  const header = useMemo(() => {
    if (ok === null) return "Checking admin…";
    if (ok === false) return "Not authorized";
    return "Candidate";
  }, [ok]);

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
    setNote(row.reviewer_note ?? "");

    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const a = await isAdmin();
      setOk(a);
      if (!a) return;
      await load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        reviewer_note: note,
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
    Alert.alert("Approve & Promote?", "This will upsert into whiskeys.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          try {
            const whiskeyId = await adminApproveAndPromoteCandidate(id);
            Alert.alert("Promoted", `Whiskey ID: ${whiskeyId}`);
            await load();
          } catch (e: any) {
            Alert.alert("Promotion failed", e?.message ?? "Unknown error");
          }
        },
      },
    ]);
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
    <View style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
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
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              ...shadows.card,
              padding: spacing.lg,
              gap: spacing.md,
            }}
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

            <Field label="Distillery" value={distillery} onChangeText={setDistillery} placeholder="Distillery" />

            <Field
              label="Proof"
              value={proof}
              onChangeText={setProof}
              placeholder="e.g., 92"
              keyboardType="numeric"
            />

            <Field
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="e.g., 12"
              keyboardType="numeric"
            />

            <Field label="Reviewer note" value={note} onChangeText={setNote} placeholder="Internal notes" />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Pressable
              onPress={onSave}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                paddingVertical: spacing.md,
                alignItems: "center",
                ...shadows.card,
              }}
            >
              <Text style={{ ...type.button }}>Save</Text>
            </Pressable>

            <Pressable
              onPress={onApprovePromote}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                paddingVertical: spacing.md,
                alignItems: "center",
                ...shadows.card,
              }}
            >
              <Text style={{ ...type.button }}>Approve & Promote</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onReject}
            style={{
              backgroundColor: "transparent",
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              paddingVertical: spacing.md,
              alignItems: "center",
            }}
          >
            <Text style={{ ...type.button, color: colors.textSecondary }}>Reject</Text>
          </Pressable>

          {meta?.promoted_whiskey_id ? (
            <Text style={{ ...type.microcopyItalic }}>
              Promoted whiskey id: {meta.promoted_whiskey_id}
            </Text>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}