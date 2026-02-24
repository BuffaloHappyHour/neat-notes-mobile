// app/admin/candidate/[id].tsx
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

  const header = useMemo(() => {
    if (ok === null) return "Checking admin…";
    if (ok === false) return "Not authorized";
    return "Candidate";
  }, [ok]);

  async function load() {
    setLoading(true);
    const row = await fetchCandidate(id);
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
            <Field
              label="Whiskey type (must match allowed list)"
              value={whiskeyType}
              onChangeText={setWhiskeyType}
              placeholder="e.g., Bourbon"
            />
            <Field label="Distillery" value={distillery} onChangeText={setDistillery} placeholder="Distillery" />
            <Field label="Proof (required to promote)" value={proof} onChangeText={setProof} placeholder="e.g., 92" keyboardType="numeric" />
            <Field label="Age" value={age} onChangeText={setAge} placeholder="e.g., 12" keyboardType="numeric" />
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