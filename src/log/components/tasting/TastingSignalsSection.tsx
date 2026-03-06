import React from "react";
import { Pressable, Text, View } from "react-native";

import { radii } from "../../../../lib/radii";
import { spacing } from "../../../../lib/spacing";
import { colors } from "../../../../lib/theme";
import { type } from "../../../../lib/typography";

type SignalOption = {
  value: number;
  label: string;
};

type SignalRowProps = {
  title: string;
  subtitle: string;
  value: number | null;
  locked?: boolean;
  options: SignalOption[];
  onChange: (value: number) => void;
};

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[type.sectionHeader, { fontSize: 26 }]}>{title}</Text>
    </View>
  );
}

function MiniHeader({ label }: { label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: colors.accent,
          opacity: 0.82,
        }}
      />
      <Text style={[type.body, { fontWeight: "900", fontSize: 18 }]}>{label}</Text>
    </View>
  );
}

function SignalRow({
  title,
  subtitle,
  value,
  locked,
  options,
  onChange,
}: SignalRowProps) {
  return (
    <View style={{ gap: 10 }}>
      <MiniHeader label={title} />

      <Text style={[type.microcopyItalic, { opacity: 0.78, lineHeight: 20 }]}>{subtitle}</Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {options.map((opt) => {
          const active = value === opt.value;
          const showLabel = opt.value === 1 || opt.value === 3 || opt.value === 5;

          return (
            <View key={opt.value} style={{ flex: 1, alignItems: "center" }}>
              <Pressable
                disabled={!!locked}
                onPress={() => onChange(opt.value)}
                style={({ pressed }) => ({
                  width: "100%",
                  minHeight: 40,
                  paddingHorizontal: 8,
                  paddingVertical: 10,
                  borderRadius: radii.md,
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? colors.accent : colors.divider,
                  backgroundColor: active ? colors.highlight : "rgba(255,255,255,0.03)",
                  opacity: locked ? 0.6 : pressed ? 0.92 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <Text
                  style={[
                    type.body,
                    {
                      fontWeight: "900",
                      fontSize: 18,
                      color: colors.textPrimary,
                    },
                  ]}
                >
                  {opt.value}
                </Text>
              </Pressable>

              <View
                style={{
                  minHeight: 28,
                  marginTop: 6,
                  justifyContent: "flex-start",
                  alignItems: "center",
                }}
              >
                {showLabel ? (
                  <Text
                    style={[
                      type.microcopyItalic,
                      {
                        opacity: 0.9,
                        textAlign: "center",
                        lineHeight: 16,
                        fontSize: 16,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

type Props = {
  locked?: boolean;
  textureLevel: number | null;
  proofIntensity: number | null;
  setTextureLevel: (value: number) => void;
  setProofIntensity: (value: number) => void;
};

const TEXTURE_OPTIONS: SignalOption[] = [
  { value: 1, label: "Thin" },
  { value: 2, label: "Light" },
  { value: 3, label: "Medium" },
  { value: 4, label: "Full" },
  { value: 5, label: "Creamy" },
];

const PROOF_INTENSITY_OPTIONS: SignalOption[] = [
  { value: 1, label: "Soft" },
  { value: 2, label: "Gentle" },
  { value: 3, label: "Balanced" },
  { value: 4, label: "Bold" },
  { value: 5, label: "Intense" },
];

export default function TastingSignalsSection({
  locked,
  textureLevel,
  proofIntensity,
  setTextureLevel,
  setProofIntensity,
}: Props) {
  return (
    <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
      <SectionTitle title="Sensory Profile" />

      <Text style={[type.microcopyItalic, { opacity: 0.76, lineHeight: 20 }]}>
        Add structure and intensity to sharpen future insights.
      </Text>

      <SignalRow
        title="Texture"
        subtitle="How rich or viscous did it feel on the palate?"
        value={textureLevel}
        locked={locked}
        options={TEXTURE_OPTIONS}
        onChange={setTextureLevel}
      />

      <SignalRow
        title="Proof Intensity"
        subtitle="How intense did the alcohol presence feel?"
        value={proofIntensity}
        locked={locked}
        options={PROOF_INTENSITY_OPTIONS}
        onChange={setProofIntensity}
      />
    </View>
  );
}