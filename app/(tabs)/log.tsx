// app/(tabs)/log.tsx
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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

// ✅ HAPTICS (intentional + future-proof)
import { withError, withSuccess, withTick } from "../../lib/hapticsPress";

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

function normalizeName(s: string) {
  return String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function slugify(s: string) {
  return normalizeName(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function parseNumericOrNull(v: string) {
  const t = String(v ?? "").trim();
  if (!t) return null;

  const cleaned = t.replace(/[^0-9.]+/g, "");
  if (!cleaned) return null;

  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return n;
}

function formatWhen(v: string | null | undefined) {
  if (!v) return "";
  const t = Date.parse(String(v));
  if (!Number.isFinite(t)) return "";
  const d = new Date(t);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------- Types ------------------- */

type Suggestion = {
  whiskeyId: string; // ✅ MUST be whiskeys.id (UUID)
  whiskeyName: string;
  bhhScore: number | null; // optional display
};

type RecentTastingRow = {
  id: string; // tasting id
  whiskeyId: string | null;
  whiskeyName: string;
  rating: number | null;
  createdAt: string | null;
};

/* ------------------- UI ------------------- */

function Card({
  title,
  subtitle,
  rightHeader,
  children,
}: {
  title: string;
  subtitle?: string;
  rightHeader?: React.ReactNode;
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: spacing.md,
          }}
        >
          <Text style={type.sectionHeader}>{title}</Text>
          {rightHeader ? rightHeader : null}
        </View>

        {subtitle ? (
          <Text style={[type.microcopyItalic, { opacity: 0.85 }]}>{subtitle}</Text>
        ) : null}
      </View>

      {children}
    </View>
  );
}

function SmallLink({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!!disabled}
      style={({ pressed }) => ({
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={[type.body, { fontWeight: "900", fontSize: 12, color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RecentRow({
  row,
  onPress,
}: {
  row: RecentTastingRow;
  onPress: () => void;
}) {
  const when = formatWhen(row.createdAt);
  const ratingText =
    row.rating != null && Number.isFinite(Number(row.rating)) ? `${Math.round(row.rating)}` : "—";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.divider,
        borderRadius: radii.md,
        backgroundColor: pressed ? colors.highlight : "transparent",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.body, { fontWeight: "900" }]} numberOfLines={1}>
          {row.whiskeyName}
        </Text>
        <Text style={[type.microcopyItalic, { opacity: 0.75 }]} numberOfLines={1}>
          {when ? `Logged ${when}` : "Logged"}
        </Text>
      </View>

      <View style={{ minWidth: 44, alignItems: "flex-end", justifyContent: "center" }}>
        <Text style={[type.body, { fontWeight: "900" }]}>{ratingText}</Text>
      </View>
    </Pressable>
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

  // On-brand modal for custom prompt
  const [customModalOpen, setCustomModalOpen] = useState(false);

  // Submit state
  const [submittingCandidate, setSubmittingCandidate] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  const qTrim = query.trim();
  const hasEnoughQuery = qTrim.length >= 2;

  const isHelpImproveMode = customApproved && showContribForm && contribute;

  const canProceed = useMemo(() => {
    if (!hasEnoughQuery) return false;
    if (isHelpImproveMode) return true;
    return !!selected || customApproved || suggestions.length > 0;
  }, [hasEnoughQuery, selected, customApproved, suggestions.length, isHelpImproveMode]);

  const helperLine = useMemo(() => {
    if (!hasEnoughQuery) return "Start typing a bottle name to search.";
    if (selected) return "Tap Continue to review and confirm.";
    if (isHelpImproveMode)
      return "Add any optional details, then tap Submit & review to start your tasting.";
    if (customApproved) return "Custom selected — tap Continue to start your tasting.";
    if (suggestions.length > 0) return "Tap a result, or press Continue to open the top match.";
    return "No matches. Use a custom entry to keep logging.";
  }, [hasEnoughQuery, selected, customApproved, suggestions.length, isHelpImproveMode]);

  function resetContributionFields() {
    setContribute(false);
    setShowContribForm(false);
    setDistillery("");
    setCategory("");
    setAge("");
    setProof("");
    setCountry("");
    setRegion("");
    setSubmittingCandidate(false);
  }

  const clearQuery = withTick(() => {
    setQuery("");
    setSelected(null);
    setCustomApproved(false);
    setSuggestions([]);
    setCustomModalOpen(false);
    resetContributionFields();
    setTimeout(() => inputRef.current?.focus?.(), 50);
  });

  function onType(text: string) {
    setQuery(text);
    setSelected(null);
    setCustomApproved(false);
    resetContributionFields();
    setCustomModalOpen(false);
  }

  function goToWhiskeyProfile(id: string) {
    const safeId = String(id ?? "").trim();
    if (!isUuid(safeId)) {
      console.log("[LogTab] Not navigating; invalid whiskeyId:", safeId);
      return;
    }
    router.push(`/whiskey/${encodeURIComponent(safeId)}?intent=log`);
  }

  const onPickSuggestion = withTick((s: Suggestion) => {
    setQuery(s.whiskeyName);
    setSelected(s);
    setCustomApproved(false);
    resetContributionFields();
    setCustomModalOpen(false);
    goToWhiskeyProfile(s.whiskeyId);
  });

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

  const onUseCustom = withTick(() => {
    if (selected) return;
    const name = query.trim();
    if (name.length < 2) return;
    setCustomModalOpen(true);
  });

  const onModalCancel = withError(() => {
    setCustomModalOpen(false);
  });

  const onModalJustLogIt = withSuccess(() => {
    const name = query.trim();
    if (name.length < 2) return;

    setCustomModalOpen(false);
    setSelected(null);
    setCustomApproved(true);
    resetContributionFields();

    goToCustomTasting(name, false);
  });

  const onModalHelpImprove = withTick(() => {
    const name = query.trim();
    if (name.length < 2) return;

    setCustomModalOpen(false);
    setSelected(null);
    setCustomApproved(true);
    setContribute(true);
    setShowContribForm(true);
  });

  async function submitWhiskeyCandidate(name: string) {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        console.log("[LogTab] No authenticated user; skipping candidate submit.");
        return;
      }

      const payload = {
        created_by: userId,
        name_raw: name,
        name_normalized: normalizeName(name),
        canonical_slug: slugify(name),
        whiskey_type: category.trim() || null,
        distillery: distillery.trim() || null,
        proof: parseNumericOrNull(proof),
        age: parseNumericOrNull(age),
        status: "pending",
      };

      const { error } = await supabase.from("whiskey_candidates").insert(payload);

      if (error) console.log("[LogTab] whiskey_candidates insert failed:", error.message);
    } catch (e: any) {
      console.log("[LogTab] submitWhiskeyCandidate threw:", e?.message ?? e);
    }
  }

  const onSubmitAndReview = withSuccess(async () => {
    const name = query.trim();
    if (name.length < 2) return;
    if (submittingCandidate) return;

    setSubmittingCandidate(true);
    await submitWhiskeyCandidate(name);
    goToCustomTasting(name, true);
  });

  async function fetchSuggestions(term: string) {
    const t = term.trim();
    if (t.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const safe = t.replace(/[%_]/g, "\\$&");

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
  }, [query]);

  const onContinue = withSuccess(() => {
    if (!hasEnoughQuery) return;

    if (selected) {
      goToWhiskeyProfile(selected.whiskeyId);
      return;
    }

    if (suggestions.length > 0) {
      goToWhiskeyProfile(suggestions[0].whiskeyId);
      return;
    }

    setCustomModalOpen(true);
  });

  const onSkipContrib = withTick(() => {
    setShowContribForm(false);
    setContribute(false);
  });

  /* ------------------- Recent Tastings ------------------- */

  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState("");
  const [recentRows, setRecentRows] = useState<RecentTastingRow[]>([]);

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true);
    setRecentError("");

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;

      if (!userId) {
        setRecentRows([]);
        setRecentLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tastings")
        .select("id, whiskey_id, whiskey_name, rating, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw new Error(error.message);

      const rows: RecentTastingRow[] = (data as any[]).map((r) => ({
        id: String(r.id),
        whiskeyId: r.whiskey_id ? String(r.whiskey_id) : null,
        whiskeyName: String(r.whiskey_name ?? "Whiskey"),
        rating: r.rating == null || !Number.isFinite(Number(r.rating)) ? null : Number(r.rating),
        createdAt: r.created_at ? String(r.created_at) : null,
      }));

      setRecentRows(rows);
    } catch (e: any) {
      setRecentRows([]);
      setRecentError(String(e?.message ?? e));
    } finally {
      setRecentLoading(false);
    }
  }, []);

  // ✅ Fix: use the row you clicked. actionsRow doesn't exist here.
  // ✅ This routes to the *regular* tasting view (cloud-tasting) with tastingId.
  function goTasting(row: RecentTastingRow) {
  const id = String(row?.id ?? "").trim();
  if (!id) return;

  router.push(
    `/log/cloud-tasting?tastingId=${encodeURIComponent(id)}&mode=edit&readonly=0` as any
  );
}

  useFocusEffect(
    useCallback(() => {
      fetchRecent();
    }, [fetchRecent])
  );

  /* ------------------- Render ------------------- */

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* On-brand modal */}
      <Modal
        visible={customModalOpen}
        transparent
        animationType="fade"
        onRequestClose={onModalCancel}
      >
        <Pressable
          onPress={onModalCancel}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            padding: spacing.xl,
            justifyContent: "center",
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.divider,
              padding: spacing.lg,
              gap: spacing.md,
              ...shadows.card,
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={[type.sectionHeader, { fontSize: 18 }]}>Add a custom bottle?</Text>
              <Text style={[type.body, { opacity: 0.88, lineHeight: 20 }]}>
                We didn’t find that bottle yet. If you’d like, you can add a couple details to help
                keep the catalog clean — totally optional.
              </Text>
              <Text style={[type.microcopyItalic, { opacity: 0.78 }]}>
                Even 1–2 fields helps a ton.
              </Text>
            </View>

            <View style={{ gap: spacing.sm }}>
              <Pressable
                onPress={onModalHelpImprove}
                style={({ pressed }) => ({
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.background }]}>Help improve</Text>
              </Pressable>

              <Pressable
                onPress={onModalJustLogIt}
                style={({ pressed }) => ({
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.divider,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={[type.button, { color: colors.textPrimary }]}>Just log it</Text>
              </Pressable>

              <Pressable
                onPress={onModalCancel}
                style={({ pressed }) => ({
                  paddingVertical: spacing.sm,
                  alignItems: "center",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={[type.microcopyItalic, { opacity: 0.8 }]}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        nestedScrollEnabled
      >
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
              contentContainerStyle={{ paddingVertical: 2 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator
            >
              {suggestions.map((s, idx) => {
                const isLast = idx === suggestions.length - 1;
                return (
                  <Pressable
                    key={`${s.whiskeyId}:${s.whiskeyName}`}
                    onPress={() => onPickSuggestion(s)}
                    style={({ pressed }) => ({
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderBottomWidth: isLast ? 0 : 1,
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
                );
              })}
            </ScrollView>
          ) : hasEnoughQuery && !loading ? (
            <Text style={[type.body, { opacity: 0.65, fontSize: 12, marginTop: spacing.sm }]}>
              No matches found. You can use a custom entry.
            </Text>
          ) : null}

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
                onPress={onSkipContrib}
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

          {isHelpImproveMode ? (
            <View style={{ marginTop: spacing.md }}>
              <Pressable
                onPress={onSubmitAndReview}
                disabled={!hasEnoughQuery || submittingCandidate}
                style={({ pressed }) => ({
                  width: "100%",
                  borderRadius: radii.md,
                  paddingVertical: spacing.lg,
                  alignItems: "center",
                  backgroundColor: colors.accent,
                  opacity: !hasEnoughQuery || submittingCandidate ? 0.55 : pressed ? 0.9 : 1,
                })}
              >
                {submittingCandidate ? (
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <ActivityIndicator />
                    <Text style={[type.button, { color: colors.background }]}>Submitting…</Text>
                  </View>
                ) : (
                  <Text style={[type.button, { color: colors.background }]}>Submit & review</Text>
                )}
              </Pressable>
            </View>
          ) : (
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
                onPress={onContinue}
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
          )}
        </Card>

        <Card
          title="Recent tastings"
          subtitle="Your latest entries"
          rightHeader={
            <SmallLink
              label="View All"
              onPress={withTick(() => router.push("/tasting/all" as any))}
              disabled={recentRows.length === 0}
            />
          }
        >
          {recentLoading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator />
              <Text style={[type.body, { opacity: 0.7 }]}>Loading…</Text>
            </View>
          ) : null}

          {recentError ? (
            <Text style={[type.body, { opacity: 0.8 }]}>Error: {recentError}</Text>
          ) : null}

          {!recentLoading && recentRows.length === 0 ? (
            <Text style={[type.body, { opacity: 0.72 }]}>
              Not seeing anything yet? Sign in and log your first tasting.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {recentRows.map((r) => (
                <RecentRow key={r.id} row={r} onPress={withTick(() => goTasting(r))} />
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}