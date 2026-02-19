// lib/catalog/WhiskeyAutocompleteField.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, TextInput, Text, Pressable, FlatList } from "react-native";
import { searchWhiskeyCatalog } from "./whiskeyCatalog";

type CatalogHit = { id: string; name: string };

export type WhiskeySelection =
  | { kind: "catalog"; id: string; name: string }
  | { kind: "custom"; name: string }
  | { kind: "none" };

type Props = {
  label?: string;
  value: WhiskeySelection;
  onChange: (next: WhiskeySelection) => void;
  placeholder?: string;

  // Optional styling hooks
  inputStyle?: any;
  containerStyle?: any;
  borderColor?: string;
  textColor?: string;
};

export function WhiskeyAutocompleteField({
  label = "Whiskey",
  value,
  onChange,
  placeholder = "Start typing…",
  inputStyle,
  containerStyle,
  borderColor,
  textColor,
}: Props) {
  const [text, setText] = useState(() => {
    if (value.kind === "catalog") return value.name;
    if (value.kind === "custom") return value.name;
    return "";
  });

  const [hits, setHits] = useState<CatalogHit[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Keep text in sync if parent changes it
  useEffect(() => {
    if (value.kind === "catalog") setText(value.name);
    else if (value.kind === "custom") setText(value.name);
    else setText("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.kind]);

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!isFocused) return;

      const q = text.trim();
      if (!q) {
        setHits([]);
        return;
      }

      const res = await searchWhiskeyCatalog(q);
      if (!alive) return;
      setHits(res);
    }

    run();
    return () => {
      alive = false;
    };
  }, [text, isFocused]);

  const showCustomOption = useMemo(() => {
    const q = text.trim();
    if (!q) return false;
    const exact = hits.some(h => h.name.toLowerCase() === q.toLowerCase());
    return !exact;
  }, [text, hits]);

  function selectCatalog(hit: CatalogHit) {
    setText(hit.name);
    setHits([]);
    onChange({ kind: "catalog", id: hit.id, name: hit.name });
  }

  function selectCustom() {
    const q = text.trim();
    if (!q) return;
    setHits([]);
    onChange({ kind: "custom", name: q });
  }

  function clearSelection() {
    setText("");
    setHits([]);
    onChange({ kind: "none" });
  }

  return (
    <View style={[{ gap: 8 }, containerStyle]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: textColor }}>
          {label}
        </Text>

        {(value.kind !== "none" || text.trim().length > 0) ? (
          <Pressable onPress={clearSelection} hitSlop={10}>
            <Text style={{ fontSize: 12, opacity: 0.75, color: textColor }}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);

          // If user edits after selecting catalog, treat as custom intent until they re-select
          if (t.trim().length === 0) onChange({ kind: "none" });
          else onChange({ kind: "custom", name: t });
        }}
        placeholder={placeholder}
        placeholderTextColor={textColor ? textColor : undefined}
        autoCapitalize="words"
        autoCorrect={false}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          {
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 16,
            borderColor: borderColor,
            color: textColor,
          },
          inputStyle,
        ]}
      />

      {(isFocused && (hits.length > 0 || showCustomOption)) ? (
        <View
          style={{
            borderWidth: 1,
            borderRadius: 12,
            overflow: "hidden",
            borderColor: borderColor,
          }}
        >
          <FlatList
            keyboardShouldPersistTaps="handled"
            data={[
              ...hits.map(h => ({ type: "catalog" as const, hit: h })),
              ...(showCustomOption ? [{ type: "custom" as const, name: text.trim() }] : []),
            ]}
            keyExtractor={(item, idx) => {
              if (item.type === "catalog") return `c_${item.hit.id}`;
              return `u_${idx}`;
            }}
            renderItem={({ item }) => {
              if (item.type === "catalog") {
                return (
                  <Pressable
                    onPress={() => selectCatalog(item.hit)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Text style={{ fontSize: 15, color: textColor }}>{item.hit.name}</Text>
                    <Text style={{ fontSize: 12, opacity: 0.7, color: textColor }}>Catalog</Text>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  onPress={selectCustom}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    opacity: pressed ? 0.6 : 1,
                    borderTopWidth: hits.length ? 1 : 0,
                    borderTopColor: borderColor,
                  })}
                >
                  <Text style={{ fontSize: 15, color: textColor }}>Use “{item.name}”</Text>
                  <Text style={{ fontSize: 12, opacity: 0.7, color: textColor }}>Custom</Text>
                </Pressable>
              );
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
