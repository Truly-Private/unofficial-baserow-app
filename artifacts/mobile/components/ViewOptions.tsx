import { Feather } from "@expo/vector-icons";
import type React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors } from "@/hooks/useColors";

export type ViewModeOption<T extends string> = {
  id: T;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type ViewModePillsProps<T extends string> = {
  options: ViewModeOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function ViewModePills<T extends string>({ options, value, onChange }: ViewModePillsProps<T>) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.modeRow}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[
              styles.modePill,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            <Feather
              name={option.icon}
              size={14}
              color={active ? colors.primaryForeground : colors.foreground}
            />
            <Text
              style={[
                styles.modePillText,
                { color: active ? colors.primaryForeground : colors.foreground },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type TableColumn<T> = {
  key: string;
  label: string;
  width?: number;
  render: (item: T, index: number) => React.ReactNode;
};

type MobileRecordTableProps<T> = {
  items: T[];
  columns: TableColumn<T>[];
  getKey: (item: T, index: number) => string;
  onRowPress?: (item: T, index: number) => void;
  emptyIcon: keyof typeof Feather.glyphMap;
  emptyTitle: string;
  emptyDescription: string;
  footerLabel?: string;
};

export function MobileRecordTable<T>({
  items,
  columns,
  getKey,
  onRowPress,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  footerLabel,
}: MobileRecordTableProps<T>) {
  const colors = useColors();
  const totalWidth = columns.reduce((sum, column) => sum + (column.width ?? 160), 0);

  if (items.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <View style={[styles.tableFrame, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}> 
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={{ minWidth: totalWidth }}>
          <View style={[styles.tableHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
            {columns.map((column) => (
              <View
                key={column.key}
                style={[styles.tableHeaderCell, { width: column.width ?? 160, borderRightColor: colors.border }]}
              >
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {column.label}
                </Text>
              </View>
            ))}
          </View>
          {items.map((item, index) => {
            const row = (
              <View
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: index % 2 === 0 ? colors.card : colors.background,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                {columns.map((column) => (
                  <View
                    key={column.key}
                    style={[styles.tableCell, { width: column.width ?? 160, borderRightColor: colors.border }]}
                  >
                    {column.render(item, index)}
                  </View>
                ))}
              </View>
            );

            if (!onRowPress) return <View key={getKey(item, index)}>{row}</View>;
            return (
              <Pressable key={getKey(item, index)} onPress={() => onRowPress(item, index)}>
                {row}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {footerLabel ? (
        <Text style={[styles.tableFooter, { color: colors.mutedForeground }]}>{footerLabel}</Text>
      ) : null}
    </View>
  );
}

export function TableText({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  const colors = useColors();
  return (
    <Text
      style={[strong ? styles.cellTextStrong : styles.cellText, { color: strong ? colors.foreground : colors.mutedForeground }]}
      numberOfLines={2}
    >
      {children}
    </Text>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warning" | "danger" }) {
  const colors = useColors();
  const palette =
    tone === "good"
      ? { background: colors.secondary, foreground: colors.primary }
      : tone === "danger"
        ? { background: colors.destructive, foreground: colors.destructiveForeground }
        : tone === "warning"
          ? { background: colors.muted, foreground: colors.foreground }
          : { background: colors.muted, foreground: colors.mutedForeground };
  return (
    <View style={[styles.badge, { backgroundColor: palette.background }]}> 
      <Text style={[styles.badgeText, { color: palette.foreground }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function InsightCard({ icon, label, value, description }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; description: string }) {
  const colors = useColors();
  return (
    <View style={[styles.insightCard, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}> 
      <View style={[styles.insightIcon, { backgroundColor: colors.secondary }]}> 
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.insightLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.insightValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.insightDescription, { color: colors.mutedForeground }]}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modeRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  modePill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  modePillText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tableFrame: { borderWidth: 1, overflow: "hidden", marginHorizontal: 16, marginBottom: 10 },
  tableHeader: { minHeight: 42, flexDirection: "row", borderBottomWidth: 1 },
  tableHeaderCell: { minHeight: 42, justifyContent: "center", paddingHorizontal: 10, borderRightWidth: 1 },
  tableHeaderText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  tableRow: { minHeight: 52, flexDirection: "row", borderBottomWidth: 1 },
  tableCell: { justifyContent: "center", paddingHorizontal: 10, paddingVertical: 8, borderRightWidth: 1 },
  tableFooter: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", paddingVertical: 10 },
  cellText: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
  cellTextStrong: { fontSize: 13, lineHeight: 18, fontFamily: "Inter_700Bold" },
  badge: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  insightCard: { borderWidth: 1, padding: 14, marginHorizontal: 16, marginBottom: 10, flexDirection: "row", gap: 12 },
  insightIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  insightLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textTransform: "uppercase" },
  insightValue: { marginTop: 2, fontSize: 22, lineHeight: 28, fontFamily: "Inter_700Bold" },
  insightDescription: { marginTop: 3, fontSize: 13, lineHeight: 18, fontFamily: "Inter_400Regular" },
});
