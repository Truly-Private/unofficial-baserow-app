import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import {
  formatFieldDisplay,
  type BaserowField,
  type BaserowSelectOption,
} from "@/lib/baserow";

type FieldDisplayProps = {
  field: BaserowField;
  value: unknown;
  compact?: boolean;
};

export function FieldDisplay({ field, value, compact }: FieldDisplayProps) {
  const colors = useColors();

  if (field.type === "boolean") {
    const checked = Boolean(value);
    return (
      <View style={styles.inline}>
        <Feather
          name={checked ? "check-square" : "square"}
          size={16}
          color={checked ? colors.success : colors.mutedForeground}
        />
        <Text style={[styles.value, { color: colors.foreground }]}>
          {checked ? "Yes" : "No"}
        </Text>
      </View>
    );
  }

  if (field.type === "single_select") {
    const v = value as BaserowSelectOption | null;
    if (!v) return <DimText text="—" />;
    return <SelectChip label={v.value} color={v.color} />;
  }

  if (field.type === "multiple_select") {
    const arr = (value as BaserowSelectOption[]) ?? [];
    if (arr.length === 0) return <DimText text="—" />;
    return (
      <View style={[styles.chipRow, compact && { maxHeight: 28, overflow: "hidden" }]}>
        {arr.map((opt) => (
          <SelectChip key={opt.id} label={opt.value} color={opt.color} />
        ))}
      </View>
    );
  }

  if (field.type === "rating") {
    const n = Number(value) || 0;
    return (
      <View style={styles.inline}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Feather
            key={i}
            name="star"
            size={14}
            color={i < n ? colors.accent : colors.border}
          />
        ))}
      </View>
    );
  }

  const text = formatFieldDisplay(field, value);
  if (!text) return <DimText text="—" />;

  return (
    <Text
      numberOfLines={compact ? 2 : undefined}
      style={[styles.value, { color: colors.foreground }]}
    >
      {text}
    </Text>
  );
}

function DimText({ text }: { text: string }) {
  const colors = useColors();
  return (
    <Text style={[styles.value, { color: colors.mutedForeground }]}>{text}</Text>
  );
}

function SelectChip({ label, color }: { label: string; color: string }) {
  const colors = useColors();
  const bg = baserowColorMap[color] ?? colors.muted;
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text
        style={[styles.chipLabel, { color: contrastFor(bg) }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const baserowColorMap: Record<string, string> = {
  light_blue: "#DBEAFE",
  light_green: "#DCFCE7",
  light_red: "#FEE2E2",
  light_yellow: "#FEF3C7",
  light_orange: "#FFEDD5",
  light_pink: "#FCE7F3",
  light_purple: "#EDE9FE",
  light_brown: "#F5E1D6",
  light_gray: "#E5E7EB",
  blue: "#3B82F6",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#EAB308",
  orange: "#F97316",
  pink: "#EC4899",
  purple: "#8B5CF6",
  brown: "#A16207",
  gray: "#6B7280",
  dark_blue: "#1E3A8A",
  dark_green: "#14532D",
  dark_red: "#7F1D1D",
  dark_yellow: "#713F12",
  dark_orange: "#7C2D12",
  dark_pink: "#831843",
  dark_purple: "#4C1D95",
  dark_brown: "#451A03",
  dark_gray: "#1F2937",
};

function contrastFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#0F172A";
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#0F172A" : "#FFFFFF";
}

const styles = StyleSheet.create({
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
  },
  chipLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
});

export { baserowColorMap };
