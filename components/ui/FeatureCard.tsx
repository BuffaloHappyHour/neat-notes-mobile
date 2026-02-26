// components/ui/FeatureCard.tsx
import React from "react";
import { Text, View } from "react-native";

import { Card } from "./Card";

import { spacing } from "../../lib/spacing";
import { type } from "../../lib/typography";

export function FeatureCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <View style={{ gap: spacing.md }}>
        <View style={{ gap: spacing.xs }}>
          <Text style={type.sectionHeader}>{title}</Text>
          {subtitle ? (
            <Text
              style={[
                type.microcopyItalic,
                { fontSize: 16, lineHeight: 22, opacity: 0.9 },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {children}
      </View>
    </Card>
  );
}