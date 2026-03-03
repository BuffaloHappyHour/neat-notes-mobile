// src/log/hooks/usePostSaveMetadata.ts
import type { Href } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import { hapticError, hapticSuccess } from "../../../lib/haptics";
import { supabase } from "../../../lib/supabase";

import {
  cleanText,
  isMissingLike,
  isNullOrOther,
  isUuid,
  nullIfOther,
  parseNumericOrNull,
  safeText,
  uniqStringsKeepOrder,
} from "../utils/text";

type WhiskeyRow = {
  name?: string | null;
  distillery: string | null;

  // legacy display (may exist)
  whiskey_type: string | null;

  // ✅ canonical
  whiskey_type_id?: string | null;

  proof: number | null;
  age: number | null;
  category: string | null;
  region: string | null;
  sub_region: string | null;
};

function computeMissingKeysFromWhiskeyRow(w: WhiskeyRow | null) {
  const missing: string[] = [];
  if (!w) return missing;

  if (!safeText(w.distillery)) missing.push("distillery");

  // Prefer canonical whiskey_type_id if present, fall back to legacy whiskey_type
  const hasTypeId = !!safeText((w as any).whiskey_type_id);
  if (!hasTypeId && isNullOrOther(w.whiskey_type)) missing.push("whiskey_type");

  if (w.proof == null) missing.push("proof");
  if (w.age == null) missing.push("age");

  // treat null/empty OR "Other" as missing for taxonomy fields
  if (isNullOrOther(w.category)) missing.push("category");
  if (isNullOrOther(w.region)) missing.push("region");
  if (isNullOrOther(w.sub_region)) missing.push("sub_region");

  return missing;
}

function withOtherOption(list: string[]) {
  const cleaned = uniqStringsKeepOrder(list.map((x) => safeText(x)).filter(Boolean));
  if (!cleaned.some((x) => x.toLowerCase() === "other")) cleaned.push("Other");
  return cleaned;
}

export function usePostSaveMetadata() {
  const [metaOpen, setMetaOpen] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);

  // ✅ NEW: differentiate Custom vs UUID whiskey
  const [metaIsCustom, setMetaIsCustom] = useState(false);

  const [postSaveTargetWhiskeyId, setPostSaveTargetWhiskeyId] = useState<string | null>(null);
  const [pendingNavigateTo, setPendingNavigateTo] = useState<Href | null>(null);

  const [metaMissingKeys, setMetaMissingKeys] = useState<string[]>([]);

  const [taxCategories, setTaxCategories] = useState<string[]>([]);
  const [taxRegions, setTaxRegions] = useState<string[]>([]);
  const [taxSubRegions, setTaxSubRegions] = useState<string[]>([]);

  // ✅ NEW: type options for canonical selection
  const [whiskeyTypeOptions, setWhiskeyTypeOptions] = useState<{ id: string; name: string }[]>([]);

  // Form values (only for modal)
  const [fName, setFName] = useState("");
  const [fDistillery, setFDistillery] = useState("");

  // ✅ canonical
  const [fTypeId, setFTypeId] = useState<string | null>(null);

  const [fProof, setFProof] = useState("");
  const [fAge, setFAge] = useState("");
  const [fCategory, setFCategory] = useState<string | null>(null);
  const [fRegion, setFRegion] = useState<string | null>(null);
  const [fSubRegion, setFSubRegion] = useState<string | null>(null);

  const fetchTaxonomyForModal = useCallback(
    async (category: string | null, region: string | null) => {
      setMetaLoading(true);
      try {
        // ✅ whiskey types
        const { data: tData, error: tErr } = await supabase
          .from("whiskey_types")
          .select("id, name")
          .order("name", { ascending: true });

        if (tErr) throw new Error(tErr.message);

        const types = (Array.isArray(tData) ? tData : [])
          .map((r: any) => ({ id: safeText(r.id), name: safeText(r.name) }))
          .filter((x) => x.id && x.name);

        setWhiskeyTypeOptions(types);

        // categories
        const { data: cData, error: cErr } = await supabase
          .from("whiskey_categories")
          .select("category")
          .order("category", { ascending: true });

        if (cErr) throw new Error(cErr.message);

        const cats = (Array.isArray(cData) ? cData : [])
          .map((r: any) => safeText(r.category))
          .filter(Boolean);

        setTaxCategories(cats);

        if (category) {
          const { data: rData, error: rErr } = await supabase
            .from("whiskey_regions")
            .select("region")
            .eq("category", category)
            .order("region", { ascending: true });

          if (rErr) throw new Error(rErr.message);

          const regs = (Array.isArray(rData) ? rData : [])
            .map((r: any) => safeText(r.region))
            .filter(Boolean);

          setTaxRegions(regs);

          if (region) {
            const { data: sData, error: sErr } = await supabase
              .from("whiskey_sub_regions")
              .select("sub_region")
              .eq("category", category)
              .eq("region", region)
              .order("sub_region", { ascending: true });

            if (sErr) throw new Error(sErr.message);

            const subs = (Array.isArray(sData) ? sData : [])
              .map((r: any) => safeText(r.sub_region))
              .filter(Boolean);

            setTaxSubRegions(subs);
          } else {
            setTaxSubRegions([]);
          }
        } else {
          setTaxRegions([]);
          setTaxSubRegions([]);
        }
      } catch {
        setWhiskeyTypeOptions([]);
        setTaxCategories([]);
        setTaxRegions([]);
        setTaxSubRegions([]);
      } finally {
        setMetaLoading(false);
      }
    },
    []
  );

  /**
   * ✅ Updated signature:
   * - For normal whiskeys (uuid): behaves like before (missing-fields prompt)
   * - For custom: opens modal even though there is no uuid
   *
   * Returns:
   * - navigateTo (Href) if no modal needed
   * - null if modal opened (navigation will happen after save/skip)
   */
  const maybeOpenPostSaveMetadata = useCallback(
    async (
      whiskeyIdToCheck: string,
      navigateTo: Href,
      opts?: {
        isCustom?: boolean;
        // optional prefill from your custom entry flow
        name?: string;
        whiskeyTypeId?: string | null;
        proof?: string;
        distillery?: string;
      }
    ): Promise<Href | null> => {
      const isCustom = !!opts?.isCustom;

      // ✅ Custom path: always open modal (required fields enforced in UI)
      if (isCustom) {
        setMetaIsCustom(true);

        // For custom we want to show at minimum these three required blocks
        setMetaMissingKeys(["whiskey_type", "proof"]); // Name is handled via fName + isCustom in modal

        setPostSaveTargetWhiskeyId(null); // no uuid
        setPendingNavigateTo(navigateTo);

        setFName(safeText(opts?.name ?? ""));
        setFDistillery(safeText(opts?.distillery ?? ""));
        setFTypeId(opts?.whiskeyTypeId ?? null);
        setFProof(safeText(opts?.proof ?? ""));
        setFAge("");
        setFCategory(null);
        setFRegion(null);
        setFSubRegion(null);

        await fetchTaxonomyForModal(null, null);

        setMetaOpen(true);
        return null;
      }

      // Normal behavior: if no uuid, do nothing
      if (!isUuid(whiskeyIdToCheck)) {
        return navigateTo;
      }

      try {
        const { data, error } = await supabase
          .from("whiskeys")
          .select("name, distillery, whiskey_type, whiskey_type_id, proof, age, category, region, sub_region")
          .eq("id", whiskeyIdToCheck)
          .maybeSingle();

        if (error) throw new Error(error.message);

        const row = (data as any) ?? null;
        const w: WhiskeyRow | null = row
          ? {
              name: cleanText(row.name),
              distillery: cleanText(row.distillery),
              whiskey_type: cleanText(row.whiskey_type),
              whiskey_type_id: cleanText(row.whiskey_type_id),
              proof: row.proof == null || !Number.isFinite(Number(row.proof)) ? null : Number(row.proof),
              age: row.age == null || !Number.isFinite(Number(row.age)) ? null : Number(row.age),
              category: cleanText(row.category),
              region: cleanText(row.region),
              sub_region: cleanText(row.sub_region),
            }
          : null;

        const missing = computeMissingKeysFromWhiskeyRow(w);

        if (!missing.length) {
          return navigateTo;
        }

        // Prep modal state
        setMetaIsCustom(false);
        setMetaMissingKeys(missing);
        setPostSaveTargetWhiskeyId(whiskeyIdToCheck);
        setPendingNavigateTo(navigateTo);

        // Name only used for Custom (but safe to keep filled)
        setFName(safeText(w?.name ?? ""));
        setFDistillery(safeText(w?.distillery ?? ""));
        setFTypeId(safeText((w as any)?.whiskey_type_id ?? "") || null);
        setFProof(w?.proof == null ? "" : String(w?.proof));
        setFAge(w?.age == null ? "" : String(w?.age));
        setFCategory(w?.category ?? null);
        setFRegion(w?.region ?? null);
        setFSubRegion(w?.sub_region ?? null);

        await fetchTaxonomyForModal(w?.category ?? null, w?.region ?? null);

        setMetaOpen(true);
        return null;
      } catch {
        return navigateTo;
      }
    },
    [fetchTaxonomyForModal]
  );

  const finishPostSaveFlow = useCallback((): Href | null => {
    const to = pendingNavigateTo;

    setMetaOpen(false);
    setMetaIsCustom(false);

    setPostSaveTargetWhiskeyId(null);
    setPendingNavigateTo(null);
    setMetaMissingKeys([]);

    return to ?? null;
  }, [pendingNavigateTo]);

  const saveMetadataFromModal = useCallback(async (): Promise<Href | null> => {
    if (metaSaving) return null;

    // ✅ Custom: no whiskey_id to update — just close after validation (modal enforces required)
    if (metaIsCustom) {
      setMetaSaving(true);
      try {
        // TODO (optional): submit a “catalog suggestion” record here.
        // Example:
        // await supabase.from("whiskey_suggestions").insert({ name: fName, whiskey_type_id: fTypeId, proof: parseNumericOrNull(fProof), distillery: fDistillery, ... })
        await hapticSuccess();
        return finishPostSaveFlow();
      } catch {
        await hapticError();
        return null;
      } finally {
        setMetaSaving(false);
      }
    }

    // Normal: must have uuid
    if (!postSaveTargetWhiskeyId || !isUuid(postSaveTargetWhiskeyId)) {
      return finishPostSaveFlow();
    }

    const dist = cleanText(fDistillery);
    const proof = parseNumericOrNull(fProof);
    const age = parseNumericOrNull(fAge);

    // don't write "Other" into constrained taxonomy columns
    const cat = nullIfOther(fCategory);
    const reg = nullIfOther(fRegion);
    const sub = nullIfOther(fSubRegion);

    setMetaSaving(true);
    try {
      const { error } = await supabase.rpc("user_fill_whiskey_missing_fields", {
        p_whiskey_id: postSaveTargetWhiskeyId,
        p_distillery: dist,

        // ✅ canonical now
        p_whiskey_type_id: fTypeId,

        // legacy stays null (server can keep back-compat if it wants)
        p_whiskey_type: null,

        p_proof: proof,
        p_age: age,
        p_category: cat,
        p_region: reg,
        p_sub_region: sub,
      });

      if (error) throw new Error(error.message);

      await hapticSuccess();
      return finishPostSaveFlow();
    } catch {
      await hapticError();
      return null;
    } finally {
      setMetaSaving(false);
    }
  }, [
    metaSaving,
    metaIsCustom,
    postSaveTargetWhiskeyId,
    finishPostSaveFlow,
    fName,
    fDistillery,
    fTypeId,
    fProof,
    fAge,
    fCategory,
    fRegion,
    fSubRegion,
  ]);

  const categoryOptions = useMemo(() => withOtherOption(taxCategories), [taxCategories]);
  const regionOptions = useMemo(
    () => withOtherOption(fCategory ? taxRegions : []),
    [taxRegions, fCategory]
  );
  const subRegionOptions = useMemo(
    () => withOtherOption(fCategory && fRegion ? taxSubRegions : []),
    [taxSubRegions, fCategory, fRegion]
  );

  const canEditCategory = useMemo(
    () => isMissingLike(fCategory) || taxCategories.length === 0,
    [fCategory, taxCategories.length]
  );

  const canEditRegion = useMemo(
    () => !isMissingLike(fCategory) && (isMissingLike(fRegion) || taxRegions.length === 0),
    [fCategory, fRegion, taxRegions.length]
  );

  const canEditSubRegion = useMemo(
    () =>
      !isMissingLike(fCategory) &&
      !isMissingLike(fRegion) &&
      (isMissingLike(fSubRegion) || taxSubRegions.length === 0),
    [fCategory, fRegion, fSubRegion, taxSubRegions.length]
  );

  const showCategoryBlock = useMemo(
    () => metaMissingKeys.includes("category") || isMissingLike(fCategory),
    [metaMissingKeys, fCategory]
  );

  const showRegionBlock = useMemo(
    () => (metaMissingKeys.includes("region") || isMissingLike(fRegion)) && !isMissingLike(fCategory),
    [metaMissingKeys, fRegion, fCategory]
  );

  const showSubRegionBlock = useMemo(
    () =>
      (metaMissingKeys.includes("sub_region") || isMissingLike(fSubRegion)) &&
      !isMissingLike(fCategory) &&
      !isMissingLike(fRegion),
    [metaMissingKeys, fSubRegion, fCategory, fRegion]
  );

  // canonical label for modal
  const selectedWhiskeyTypeName = useMemo(() => {
    if (!fTypeId) return null;
    const hit = (whiskeyTypeOptions || []).find((x) => safeText(x.id) === safeText(fTypeId));
    return hit?.name ?? null;
  }, [fTypeId, whiskeyTypeOptions]);

  // handy modal handlers (clear dependent fields)
  const onCategoryChange = useCallback(
    async (v: string) => {
      setFCategory(v);
      setFRegion(null);
      setFSubRegion(null);
      await fetchTaxonomyForModal(v, null);
    },
    [fetchTaxonomyForModal]
  );

  const onRegionChange = useCallback(
    async (v: string) => {
      setFRegion(v);
      setFSubRegion(null);
      await fetchTaxonomyForModal(fCategory ?? null, v);
    },
    [fetchTaxonomyForModal, fCategory]
  );

  return {
    // visibility
    metaOpen,
    metaLoading,
    metaSaving,

    // ✅ NEW
    metaIsCustom,

    // navigation
    maybeOpenPostSaveMetadata,
    finishPostSaveFlow,
    saveMetadataFromModal,

    // missing keys
    metaMissingKeys,

    // form values
    fName,
    setFName,

    fDistillery,
    setFDistillery,

    // ✅ canonical
    fTypeId,
    setFTypeId,
    whiskeyTypeOptions,
    selectedWhiskeyTypeName,

    fProof,
    setFProof,
    fAge,
    setFAge,
    fCategory,
    setFCategory,
    fRegion,
    setFRegion,
    fSubRegion,
    setFSubRegion,

    // options + gating
    categoryOptions,
    regionOptions,
    subRegionOptions,
    canEditCategory,
    canEditRegion,
    canEditSubRegion,
    showCategoryBlock,
    showRegionBlock,
    showSubRegionBlock,

    // ✅ modal handlers (use these in MetadataModal props now)
    onCategoryChange,
    onRegionChange,

    // taxonomy refetch helper (still useful)
    fetchTaxonomyForModal,
  };
}