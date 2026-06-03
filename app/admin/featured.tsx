// app/admin/featured.tsx
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";

import { radii } from "../../lib/radii";
import { spacing } from "../../lib/spacing";
import { supabase } from "../../lib/supabase";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

type WhiskeyRow = {
  id: string;
  display_name: string;
  whiskey_type: string | null;
  proof: number | null;
};

export default function AdminFeaturedScreen() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<WhiskeyRow[]>([]);
  const [selected, setSelected] = useState<WhiskeyRow | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function searchWhiskeys(q: string) {
    setLoading(true);

    const { data, error } = await supabase
      .from("whiskeys")
      .select("id, display_name, whiskey_type, proof")
      .ilike("display_name", `%${q}%`)
      .limit(50);

    if (!error && data) {
      setRows(data as WhiskeyRow[]);
    } else {
      setRows([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length === 0) {
        setRows([]);
        return;
      }

      searchWhiskeys(query.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  async function saveFeatured() {
    if (!selected) return;

    setSaving(true);

    // deactivate existing
    await supabase
      .from("featured_whiskeys")
      .update({ is_active: false })
      .eq("is_active", true);

    // insert new
    const { error } = await supabase.from("featured_whiskeys").insert({
      whiskey_id: selected.id,
      note: note || null,
      start_date: new Date().toISOString(),
      is_active: true,
    });

    setSaving(false);

    if (!error) {
      setSelected(null);
      setNote("");
      setQuery("");
      setRows([]);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Text style={[type.screenTitle, { color: colors.textPrimary }]}>
        Featured Bottle
      </Text>

      {/* SEARCH */}
      <TextInput
        placeholder="Search whiskey..."
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        style={{
          borderWidth: 1,
          borderColor: colors.divider,
          borderRadius: radii.lg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.textPrimary,
        }}
      />

      {/* RESULTS */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 240 }}
          renderItem={({ item }) => {
            const active = selected?.id === item.id;

            return (
              <Pressable
                onPress={() => setSelected(item)}
                style={{
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.divider,
                  backgroundColor: active
                    ? "rgba(190,150,99,0.12)"
                    : colors.surface,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={[type.body, { color: colors.textPrimary }]}>
                  {item.display_name}
                </Text>

                <Text style={[type.caption, { color: colors.textSecondary }]}>
                  {item.whiskey_type ?? "Whiskey"}
                  {item.proof != null ? ` • ${item.proof} proof` : ""}
                </Text>
              </Pressable>
            );
          }}
        />
      )}

      {/* SELECTED */}
      {selected && (
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.sectionHeader, { color: colors.textPrimary }]}>
            Selected
          </Text>

          <Text style={[type.body, { color: colors.textPrimary }]}>
            {selected.display_name}
          </Text>

          <TextInput
            placeholder="Why is this featured?"
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            style={{
              borderWidth: 1,
              borderColor: colors.divider,
              borderRadius: radii.lg,
              padding: spacing.md,
              color: colors.textPrimary,
              minHeight: 80,
            }}
          />

          <Pressable
            onPress={saveFeatured}
            style={{
              paddingVertical: 14,
              borderRadius: 999,
              alignItems: "center",
              backgroundColor: "rgba(190,150,99,0.15)",
              borderWidth: 1,
              borderColor: "rgba(190,150,99,0.4)",
            }}
          >
            <Text
              style={[
                type.caption,
                { color: colors.accent, fontWeight: "700" },
              ]}
            >
              {saving ? "Saving..." : "Set Featured Bottle"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}