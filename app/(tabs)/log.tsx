import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";

import { radii } from "../../lib/radii";
import { shadows } from "../../lib/shadows";
import { spacing } from "../../lib/spacing";
import { colors } from "../../lib/theme";
import { type } from "../../lib/typography";

/* ------------------- Helpers ------------------- */

function isUuid(v: string) {
  const s = String(v ?? "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function toQueryParam(v: string) {
  return encodeURIComponent(String(v ?? "").trim());
}

/* ------------------- Types ------------------- */

type Suggestion = {
  whiskeyId: string; // ✅ MUST be whiskeys.id (UUID)
  whiskeyName: string;
  bhhScore: number | null; // optional display
};

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
      <View style={{ gap: 6 }}>
        <Text style={type.sectionHeader}>{title}</Text>
        {subtitle ? (
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/* ------------------- Screen ------------------- */

export default function LogTab() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Suggestion | null>(null);

  // Custom flow
  const [customApproved, setCustomApproved] = useState(false);

  // Contribution capture (for custom whiskies)
  const [contribute, setContribute] = useState(false);
  const [showContribForm, setShowContribForm] = useState(false);

  const [distillery, setDistillery] = useState("");
  const [category, setCategory] = useState(""); // bourbon/scotch/rye/etc
  const [age, setAge] = useState("");
  const [proof, setProof] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const qTrim = query.trim();
  const hasEnoughQuery = qTrim.length >= 2;

  const canProceed = useMemo(() => {
    if (!hasEnoughQuery) return false;
    return !!selected || customApproved || suggestions.length > 0;
  }, [hasEnoughQuery, selected, customApproved, suggestions.length]);

  const helperLine = useMemo(() => {
    if (!hasEnoughQuery) return "Start typing a bottle name to search.";
    if (selected) return "Tap Continue to review and confirm.";
    if (customApproved) return "Custom selected — tap Continue to start your tasting.";
    if (suggestions.length > 0) return "Tap a result, or press Continue to open the top match.";
    return "No matches. Use a custom entry to keep logging.";
  }, [hasEnoughQuery, selected, customApproved, suggestions.length]);

  function resetContributionFields() {
    setContribute(false);
    setShowContribForm(false);
    setDistillery("");
    setCategory("");
    setAge("");
    setProof("");
    setCountry("");
    setRegion("");
  }

  function clearQuery() {
    setQuery("");
    setSelected(null);
    setCustomApproved(false);
    setSuggestions([]);
    resetContributionFields();
    setTimeout(() => inputRef.current?.focus?.(), 50);
  }

  function onType(text: string) {
    setQuery(text);
    setSelected(null);
    setCustomApproved(false);
    resetContributionFields();
  }

  function goToWhiskeyProfile(id: string) {
    const safeId = String(id ?? "").trim();
    if (!isUuid(safeId)) {
      console.log("[LogTab] Not navigating; invalid whiskeyId:", safeId);
      return;
    }
    console.log("[LogTab] Navigating to whiskey profile:", safeId);
    router.push(`/whiskey/${encodeURIComponent(safeId)}?intent=log`);
  }

  function onPickSuggestion(s: Suggestion) {
    setQuery(s.whiskeyName);
    setSelected(s);
    setCustomApproved(false);
    resetContributionFields();
    goToWhiskeyProfile(s.whiskeyId);
  }

  function goToCustomTasting(name: string, wantsToContribute: boolean) {
    const base =
      `/log/cloud-tasting?whiskeyName=${encodeURIComponent(name)}&lockName=0` +
      (wantsToContribute ? `&contribute=1` : `&contribute=0`);

    if (!wantsToContribute) {
      router.push(base as any);
      return;
    }

    const params: string[] = [];
    if (distillery.trim()) params.push(`distillery=${toQueryParam(distillery)}`);
    if (category.trim()) params.push(`category=${toQueryParam(category)}`);
    if (age.trim()) params.push(`age=${toQueryParam(age)}`);
    if (proof.trim()) params.push(`proof=${toQueryParam(proof)}`);
    if (country.trim()) params.push(`country=${toQueryParam(country)}`);
    if (region.trim()) params.push(`region=${toQueryParam(region)}`);

    const finalPath = params.length > 0 ? `${base}&${params.join("&")}` : base;
    router.push(finalPath as any);
  }

  // ✅ MODALS REMOVED FOR DEBUG BUILD:
  // Custom button directly begins a custom tasting flow (no overlays).
  function onUseCustom() {
    if (selected) return;
    const name = query.trim();
    if (name.length < 2) return;

    // Keep behavior deterministic: start custom tasting immediately.
    setSelected(null);
    setCustomApproved(true);
    resetContributionFields();

    // Optionally notify this is a debug build behavior.
    // Comment out if you don’t want the alert.
    // Alert.alert("Debug build", "Custom modal disabled. Starting custom tasting.");

    goToCustomTasting(name, false);
  }

  /**
   * ✅ SOURCE OF TRUTH: whiskeys table
   * We optionally decorate with BHH score (if bhh_reviews.whiskey_id exists).
   */
  async function fetchSuggestions(term: string) {
    const t = term.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const safe = t.replace(/[%_]/g, "\\$&");

      // If user pasted a UUID, try direct lookup first.
      if (isUuid(t)) {
        const { data: byId, error: byIdErr } = await supabase
          .from("whiskeys")
          .select("id, display_name")
          .eq("id", t)
          .limit(1);

        if (byIdErr) throw new Error(byIdErr.message);

        if (byId && byId.length > 0) {
          const row = byId[0] as any;
          setSuggestions([
            {
              whiskeyId: String(row.id),
              whiskeyName: String(row.display_name ?? "Whiskey"),
              bhhScore: null,
            },
          ]);
          setLoading(false);
          return;
        }
      }

      // Normal name search
      const { data: wData, error: wErr } = await supabase
        .from("whiskeys")
        .select("id, display_name")
        .ilike("display_name", `%${safe}%`)
        .order("display_name", { ascending: true })
        .limit(20);

      if (wErr) throw new Error(wErr.message);

      const base: Suggestion[] = (wData as any[]).map((w) => ({
        whiskeyId: String(w.id),
        whiskeyName: String(w.display_name ?? "Whiskey"),
        bhhScore: null,
      }));

      // Optional: pull BHH best score for these whiskey ids
      const ids = base.map((b) => b.whiskeyId).filter(isUuid);
      if (ids.length > 0) {
        const { data: bData, error: bErr } = await supabase
          .from("bhh_reviews")
          .select("whiskey_id, rating_100")
          .in("whiskey_id", ids)
          .limit(2000);

        if (!bErr && bData) {
          const best = new Map<string, number>();
          (bData as any[]).forEach((r) => {
            const id = r.whiskey_id ? String(r.whiskey_id) : "";
            if (!isUuid(id)) return;
            const score =
              r.rating_100 == null || !Number.isFinite(Number(r.rating_100))
                ? null
                : Number(r.rating_100);
            if (score == null) return;
            const ex = best.get(id);
            if (ex == null || score > ex) best.set(id, score);
          });

          base.forEach((s) => {
            const v = best.get(s.whiskeyId);
            if (v != null) s.bhhScore = v;
          });
        }
      }

      // Prefer bottles with BHH score (if present), then alpha
      const list = base
        .sort((a, b) => {
          const as = a.bhhScore ?? -Infinity;
          const bs = b.bhhScore ?? -Infinity;
          if (bs !== as) return bs - as;
          return a.whiskeyName.localeCompare(b.whiskeyName);
        })
        .slice(0, 10);

      setSuggestions(list);
    } catch (e: any) {
      console.log("Log suggestion search failed:", e?.message ?? e);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus?.();
    }, 250);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={type.screenTitle}>What are you drinking?</Text>
          <Text style={[type.microcopyItalic, { opacity: 0.88 }]}>
            Search the library, or add a custom bottle.
          </Text>
          <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>
            You’ll confirm on the whiskey profile before logging.
          </Text>
        </View>

        <Card title="Bottle" subtitle="Start typing to search">
          {/* Search input with clear (×) */}
          <View style={{ position: "relative" }}>
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={onType}
              placeholder="Type a bottle name…"
              placeholderTextColor={colors.textSecondary}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              selectionColor={colors.accent}
              style={{
                borderWidth: 1,
                borderColor: colors.divider,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                paddingRight: 44,
                color: colors.textPrimary,
                backgroundColor: "transparent",
                fontFamily: type.body.fontFamily,
                fontSize: 16,
              }}
            />

            {query.length > 0 ? (
              <Pressable
                onPress={clearQuery}
                hitSlop={10}
                style={({ pressed }) => ({
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: [{ translateY: -16 }],
                  height: 32,
                  width: 32,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.divider,
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={{ color: colors.textPrimary, fontSize: 18, lineHeight: 18 }}>×</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={[type.body, { opacity: 0.7, fontSize: 12, marginTop: spacing.sm }]}>
            {helperLine}
          </Text>

          {loading ? (
            <View
              style={{
                marginTop: spacing.sm,
                flexDirection: "row",
                gap: 10,
                alignItems: "center",
              }}
            >
              <ActivityIndicator />
              <Text style={[type.body, { opacity: 0.65, fontSize: 12 }]}>Searching…</Text>
            </View>
          ) : null}

          {suggestions.length > 0 ? (
            <ScrollView
              style={{
                marginTop: spacing.md,
                maxHeight: 260,
                borderWidth: 1,
                borderColor: colors.divider,
                borderRadius: radii.md,
                overflow: "hidden",
                backgroundColor: colors.background,
              }}
            >
              {suggestions.map((s, idx) => (
                <Pressable
                  key={`${s.whiskeyId}:${s.whiskeyName}`}
                  onPress={() => onPickSuggestion(s)}
                  style={({ pressed }) => ({
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                    opacity: pressed ? 0.75 : 1,
                    backgroundColor: "transparent",
                    gap: 6,
                  })}
                >
                  <Text style={[type.body, { fontWeight: "800" }]} numberOfLines={2}>
                    {s.whiskeyName}
                  </Text>

                  <Text style={[type.microcopyItalic, { opacity: 0.75, fontSize: 12 }]}>
                    Tap to view profile
                    {typeof s.bhhScore === "number" ? ` • BHH ${Math.round(s.bhhScore)}` : ""}
                    {idx === 0 ? " • Top match" : ""}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : hasEnoughQuery && !loading ? (
            <Text style={[type.body, { opacity: 0.65, fontSize: 12, marginTop: spacing.sm }]}>
              No matches found. You can use a custom entry.
            </Text>
          ) : null}

          {/* Contribution form (only for custom flow) */}
          {customApproved && showContribForm ? (
            <View
              style={{
                marginTop: spacing.lg,
                borderWidth: 1,
                borderColor: colors.divider,
                borderRadius: radii.md,
                padding: spacing.md,
                backgroundColor: colors.background,
                gap: spacing.sm,
              }}
            >
              <Text style={[type.sectionHeader, { fontSize: 14 }]}>Help us improve the catalog</Text>
              <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>
                Totally optional — even 1–2 fields helps keep the library clean.
              </Text>

              <TextInput
                value={distillery}
                onChangeText={setDistillery}
                placeholder="Distillery / Brand (optional)"
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
                autoCapitalize="words"
                style={{
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radii.md,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  color: colors.textPrimary,
                  backgroundColor: "transparent",
                  fontFamily: type.body.fontFamily,
                  fontSize: 14,
                }}
              />

              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="Type (Bourbon, Rye, Scotch…) (optional)"
                placeholderTextColor={colors.textSecondary}
                autoCorrect={false}
                autoCapitalize="words"
                style={{
                  borderWidth: 1,
                  borderColor: colors.divider,
                  borderRadius: radii.md,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  color: colors.textPrimary,
                  backgroundColor: "transparent",
                  fontFamily: type.body.fontFamily,
                  fontSize: 14,
                }}
              />

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TextInput
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age (e.g., 10)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: "transparent",
                    fontFamily: type.body.fontFamily,
                    fontSize: 14,
                  }}
                />
                <TextInput
                  value={proof}
                  onChangeText={setProof}
                  placeholder="Proof (e.g., 92)"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: "transparent",
                    fontFamily: type.body.fontFamily,
                    fontSize: 14,
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <TextInput
                  value={country}
                  onChangeText={setCountry}
                  placeholder="Country (optional)"
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                  autoCapitalize="words"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: "transparent",
                    fontFamily: type.body.fontFamily,
                    fontSize: 14,
                  }}
                />
                <TextInput
                  value={region}
                  onChangeText={setRegion}
                  placeholder="Region (optional)"
                  placeholderTextColor={colors.textSecondary}
                  autoCorrect={false}
                  autoCapitalize="words"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: colors.divider,
                    borderRadius: radii.md,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    color: colors.textPrimary,
                    backgroundColor: "transparent",
                    fontFamily: type.body.fontFamily,
                    fontSize: 14,
                  }}
                />
              </View>

              <Pressable
                onPress={() => {
                  setShowContribForm(false);
                  setContribute(false);
                }}
                style={({ pressed }) => ({
                  marginTop: spacing.xs,
                  alignSelf: "flex-start",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>Skip this</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: spacing.md, marginTop: spacing.md }}>
            <Pressable
              onPress={onUseCustom}
              disabled={!!selected || !hasEnoughQuery}
              style={({ pressed }) => ({
                flex: 0.44,
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.divider,
                backgroundColor: customApproved ? colors.highlight : colors.surface,
                opacity: !!selected || !hasEnoughQuery ? 0.45 : pressed ? 0.9 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.textPrimary }]}>Custom</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!hasEnoughQuery) return;

                if (selected) {
                  goToWhiskeyProfile(selected.whiskeyId);
                  return;
                }

                if (suggestions.length > 0) {
                  goToWhiskeyProfile(suggestions[0].whiskeyId);
                  return;
                }

                // ✅ MODALS REMOVED: if no matches, just start custom tasting.
                const name = query.trim();
                if (name.length < 2) return;

                setSelected(null);
                setCustomApproved(true);
                resetContributionFields();
                goToCustomTasting(name, false);
              }}
              disabled={!hasEnoughQuery}
              style={({ pressed }) => ({
                flex: 0.56,
                borderRadius: radii.md,
                paddingVertical: spacing.lg,
                alignItems: "center",
                backgroundColor: canProceed ? colors.accent : colors.divider,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text style={[type.button, { color: colors.background }]}>Continue</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}