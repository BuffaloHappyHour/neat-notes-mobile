import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type Props = {
  locked: boolean;
  sourceType: "purchased" | "bar";
  onChangeSourceType: (val: "purchased" | "bar") => void;

  barName: string;
  onChangeBarName: (val: string) => void;
  barNameMissing: boolean;

  city: string;
  onChangeCity: (val: string) => void;

  state: string;
  onChangeState: (val: string) => void;

  pricePerOz: string;
  onChangePricePerOz: (val: string) => void;

  pricePerBottle: string;
  onChangePricePerBottle: (val: string) => void;

  storeName: string;
  onChangeStoreName: (val: string) => void;

  bottleSizeMl: string;
  onChangeBottleSizeMl: (val: string) => void;

  pourSizeOz: string;
  onChangePourSizeOz: (val: string) => void;
};

const BOTTLE_SIZE_OPTIONS = ["50", "200", "375", "500", "700", "750", "1000", "1750"];
const POUR_SIZE_OPTIONS = ["1", "1.5", "2", "2.5", "3"];

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={[
        type.body,
        {
          fontWeight: "700",
          color: colors.textPrimary,
        },
      ]}
    >
      {children}
    </Text>
  );
}

function InputField({
  value,
  onChangeText,
  placeholder,
  locked,
  keyboardType,
  autoCapitalize,
  error,
}: {
  value: string;
  onChangeText: (val: string) => void;
  placeholder: string;
  locked: boolean;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  autoCapitalize?: "none" | "words" | "characters" | "sentences";
  error?: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      editable={!locked}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      keyboardType={keyboardType ?? "default"}
      autoCapitalize={autoCapitalize ?? "words"}
      style={{
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 0.8,
        borderColor: error ? colors.accent : colors.divider,
        backgroundColor: colors.surface,
        color: colors.textPrimary,
        fontSize: 16,
        fontFamily: type.body.fontFamily,
        opacity: locked ? 0.75 : 1,
      }}
    />
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  suffix,
  locked,
}: {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  suffix?: string;
  locked: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (locked) setOpen(false);
  }, [locked]);

  return (
    <View style={{ gap: 6 }}>
      <Pressable
        disabled={locked}
        onPress={() => setOpen((v) => !v)}
        style={({ pressed }) => ({
          minHeight: 49,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          borderRadius: radii.md,
          borderWidth: 0.8,
          borderColor: colors.divider,
          backgroundColor: colors.surface,
          opacity: locked ? 0.75 : pressed ? 0.92 : 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: spacing.sm,
        })}
      >
        <Text
          style={[
            type.body,
            {
              color: value ? colors.textPrimary : colors.textSecondary,
              flex: 1,
            },
          ]}
          numberOfLines={1}
        >
          {value ? `${value}${suffix ? ` ${suffix}` : ""}` : placeholder}
        </Text>

        <Text style={[type.caption, { color: colors.textSecondary }]}>
          {open ? "▲" : "▼"}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={{
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.divider,
            backgroundColor: colors.surface,
            overflow: "hidden",
          }}
        >
          {options.map((opt, index) => {
            const active = value === opt;

            return (
              <Pressable
                key={opt}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={({ pressed }) => ({
                  paddingVertical: 12,
                  paddingHorizontal: spacing.md,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.divider,
                  backgroundColor: active
                    ? colors.highlight
                    : pressed
                    ? colors.highlight
                    : colors.surface,
                })}
              >
                <Text
                  style={[
                    type.body,
                    {
                      color: active ? colors.accent : colors.textPrimary,
                      fontWeight: active ? "700" : "500",
                    },
                  ]}
                >
                  {opt}
                  {suffix ? ` ${suffix}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function SourceTypeCard({
  title,
  subtitle,
  active,
  onPress,
  locked,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  locked: boolean;
}) {
  return (
    <Pressable
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.divider,
        backgroundColor: active ? colors.highlight : colors.surface,
        opacity: locked ? 0.6 : pressed ? 0.92 : 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 120,
      })}
    >
      <Text
        style={[
          type.button,
          { color: colors.textPrimary, textAlign: "center" },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            opacity: 0.45,
            marginTop: 2,
            color: colors.textSecondary,
            textAlign: "center",
          },
        ]}
      >
        {subtitle}
      </Text>
    </Pressable>
  );
}

function DetailsAccordion({
  title,
  expanded,
  onToggle,
  locked,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  locked: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        marginTop: spacing.md,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        backgroundColor: "rgba(255,255,255,0.02)",
        overflow: "hidden",
      }}
    >
      <Pressable
        disabled={locked}
        onPress={onToggle}
        style={({ pressed }) => ({
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: locked ? 0.6 : pressed ? 0.92 : 1,
        })}
      >
        <Text
          style={[
            type.body,
            {
              fontWeight: "800",
              color: colors.textPrimary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={{
            color: colors.accent,
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {expanded ? "˄" : "˅"}
        </Text>
      </Pressable>

      {expanded ? (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            gap: spacing.md,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

export default function TastingSourceCard({
  locked,
  sourceType,
  onChangeSourceType,
  barName,
  onChangeBarName,
  barNameMissing,
  city,
  onChangeCity,
  state,
  onChangeState,
  pricePerOz,
  onChangePricePerOz,
  pricePerBottle,
  onChangePricePerBottle,
  storeName,
  onChangeStoreName,
  bottleSizeMl,
  onChangeBottleSizeMl,
  pourSizeOz,
  onChangePourSizeOz,
}: Props) {
  const hasAdvancedDetails =
    city.trim().length > 0 ||
    state.trim().length > 0 ||
    pricePerOz.trim().length > 0 ||
    pricePerBottle.trim().length > 0 ||
    bottleSizeMl.trim().length > 0 ||
    pourSizeOz.trim().length > 0;

  const [expanded, setExpanded] = React.useState(hasAdvancedDetails);

  React.useEffect(() => {
    if (hasAdvancedDetails) {
      setExpanded(true);
    }
  }, [hasAdvancedDetails]);

  React.useEffect(() => {
    setExpanded(false);
  }, [sourceType]);

  return (
    <View
      style={{
        borderRadius: radii.lg,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.divider,
      }}
    >
      <Text style={type.sectionHeader}>Tasting source</Text>

      <Text
        style={[
          type.microcopyItalic,
          {
            marginTop: 2,
            opacity: 0.7,
            color: colors.textSecondary,
          },
        ]}
      >
        Add where this came from to improve your history and insights
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.md,
        }}
      >
        <SourceTypeCard
          title="My Bottle"
          subtitle="Logged from your own bottle"
          active={sourceType === "purchased"}
          onPress={() => onChangeSourceType("purchased")}
          locked={locked}
        />

        <SourceTypeCard
          title="Bar / Restaurant"
          subtitle="Logged from a venue"
          active={sourceType === "bar"}
          onPress={() => onChangeSourceType("bar")}
          locked={locked}
        />
      </View>

      {sourceType === "purchased" ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <View style={{ gap: 6 }}>
            <FieldLabel>Liquor store</FieldLabel>
            <InputField
              value={storeName}
              onChangeText={onChangeStoreName}
              locked={locked}
              placeholder="e.g., Colonial Wine and Spirits"
            />
          </View>

          <DetailsAccordion
            title="Bottle details"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            locked={locked}
          >
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 6 }}>
                <FieldLabel>City</FieldLabel>
                <InputField
                  value={city}
                  onChangeText={onChangeCity}
                  locked={locked}
                  placeholder="e.g., Buffalo"
                />
              </View>

              <View style={{ width: 120, gap: 6 }}>
                <FieldLabel>State / Region</FieldLabel>
                <InputField
                  value={state}
                  onChangeText={onChangeState}
                  locked={locked}
                  placeholder="e.g., NY / Ontario"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <FieldLabel>Price</FieldLabel>
                <InputField
                  value={pricePerBottle}
                  onChangeText={onChangePricePerBottle}
                  locked={locked}
                  placeholder="e.g., 69.99"
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ width: 120, gap: 6 }}>
                <FieldLabel>Size</FieldLabel>
                <SelectField
                  value={bottleSizeMl}
                  onChange={onChangeBottleSizeMl}
                  options={BOTTLE_SIZE_OPTIONS}
                  placeholder="750 ml"
                  suffix="ml"
                  locked={locked}
                />
              </View>
            </View>
          </DetailsAccordion>
        </View>
      ) : null}

      {sourceType === "bar" ? (
        <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
          <View style={{ gap: 6 }}>
            <FieldLabel>Venue name</FieldLabel>
            <InputField
              value={barName}
              onChangeText={onChangeBarName}
              locked={locked}
              placeholder="e.g., Lucky Day Whiskey Bar"
              error={barNameMissing}
            />

            {barNameMissing ? (
              <Text
                style={[
                  type.microcopyItalic,
                  {
                    opacity: 0.7,
                    color: colors.accent,
                  },
                ]}
              >
                Required for bar tastings
              </Text>
            ) : null}
          </View>

          <DetailsAccordion
            title="Venue details"
            expanded={expanded}
            onToggle={() => setExpanded((v) => !v)}
            locked={locked}
          >
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <View style={{ flex: 1, gap: 6 }}>
                <FieldLabel>City</FieldLabel>
                <InputField
                  value={city}
                  onChangeText={onChangeCity}
                  locked={locked}
                  placeholder="e.g., Buffalo"
                />
              </View>

              <View style={{ width: 120, gap: 6 }}>
                <FieldLabel>State / Region</FieldLabel>
                <InputField
                  value={state}
                  onChangeText={onChangeState}
                  locked={locked}
                  placeholder="e.g., NY / Ontario"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: spacing.md,
                alignItems: "flex-start",
              }}
            >
              <View style={{ flex: 1, gap: 6 }}>
                <FieldLabel>Price</FieldLabel>
                <InputField
                  value={pricePerOz}
                  onChangeText={onChangePricePerOz}
                  locked={locked}
                  placeholder="e.g., 12.00"
                  keyboardType="decimal-pad"
                  autoCapitalize="none"
                />
              </View>

              <View style={{ width: 120, gap: 6 }}>
                <FieldLabel>Pour size</FieldLabel>
                <SelectField
                  value={pourSizeOz}
                  onChange={onChangePourSizeOz}
                  options={POUR_SIZE_OPTIONS}
                  placeholder="1 oz"
                  suffix="oz"
                  locked={locked}
                />
              </View>
            </View>
          </DetailsAccordion>
        </View>
      ) : null}
    </View>
  );
}