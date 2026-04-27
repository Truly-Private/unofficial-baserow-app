import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { type BaserowField, type BaserowRow } from "@/lib/baserow";

interface KanbanBoardProps {
  rows: BaserowRow[];
  fields: BaserowField[];
  onRowPress: (row: BaserowRow) => void;
}

export function KanbanBoard({ rows, fields, onRowPress }: KanbanBoardProps) {
  const colors = useColors();
  const [groupByFieldId, setGroupByFieldId] = useState<number | null>(null);

  // Find single select and multiple select fields for grouping
  const groupableFields = fields.filter(
    (f) => f.type === "single_select" || f.type === "multiple_select"
  );

  // Auto-select first groupable field
  const activeField =
    groupableFields.find((f) => f.id === groupByFieldId) ??
    groupableFields[0];

  // Get all unique options from the groupable field
  const allOptions =
    activeField?.type === "single_select"
      ? (activeField.select_options ?? [])
      : [];

  // Group rows by the active field's value
  const grouped = useMemo(() => {
    if (!activeField) return new Map<string, BaserowRow[]>();

    const map = new Map<string, BaserowRow[]>();

    // Initialize with all options
    for (const opt of allOptions) {
      map.set(opt.id.toString(), []);
    }
    map.set("__unassigned__", []);

    for (const row of rows) {
      const cellValue = row[`field_${activeField.id}`];
      if (cellValue === null || cellValue === undefined || cellValue === "") {
        const arr = map.get("__unassigned__")!;
        arr.push(row);
      } else if (typeof cellValue === "object" && "id" in cellValue) {
        const id = String((cellValue as { id: number }).id);
        const arr = map.get(id) ?? [];
        arr.push(row);
        map.set(id, arr);
      } else {
        // multiple select - add to each selected option
        if (Array.isArray(cellValue)) {
          for (const val of cellValue) {
            if (typeof val === "object" && "id" in val) {
              const id = String((val as { id: number }).id);
              const arr = map.get(id) ?? [];
              arr.push(row);
              map.set(id, arr);
            }
          }
        } else {
          const arr = map.get("__unassigned__")!;
          arr.push(row);
        }
      }
    }

    return map;
  }, [rows, activeField, allOptions]);

  // Build columns list
  const columns = [
    ...allOptions.map((opt) => ({
      id: opt.id.toString(),
      name: opt.value,
      color: opt.color,
      rows: grouped.get(opt.id.toString()) ?? [],
    })),
    {
      id: "__unassigned__",
      name: "Unassigned",
      color: colors.muted,
      rows: grouped.get("__unassigned__") ?? [],
    },
  ].filter((col) => col.rows.length > 0 || allOptions.length === 0);

  if (groupableFields.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Add a Single Select field to enable Kanban view
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Group by selector */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>
          Group by:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {groupableFields.map((field) => (
            <Pressable
              key={field.id}
              onPress={() => setGroupByFieldId(field.id)}
              style={[
                styles.fieldChip,
                {
                  backgroundColor:
                    field.id === activeField?.id
                      ? colors.primary
                      : colors.surface,
                  borderColor:
                    field.id === activeField?.id
                      ? colors.primary
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.fieldChipText,
                  {
                    color:
                      field.id === activeField?.id
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {field.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Kanban columns */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.columnsScroll}>
        {columns.map((col) => (
          <View
            key={col.id}
            style={[styles.column, { backgroundColor: colors.muted }]}
          >
            {/* Column header */}
            <View style={styles.columnHeader}>
              <View
                style={[
                  styles.colorDot,
                  { backgroundColor: col.color || colors.primary },
                ]}
              />
              <Text style={[styles.columnTitle, { color: colors.foreground }]}>
                {col.name}
              </Text>
              <View
                style={[styles.badge, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.badgeText, { color: colors.primaryForeground }]}
                >
                  {col.rows.length}
                </Text>
              </View>
            </View>

            {/* Cards */}
            <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false}>
              {col.rows.map((row) => (
                <Pressable
                  key={row.id}
                  onPress={() => onRowPress(row)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  {/* Primary field value as card title */}
                  <Text
                    style={[styles.cardTitle, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {String(row.field_1 ?? "")}
                  </Text>

                  {/* Show first few other field values */}
                  {fields
                    .filter(
                      (f) =>
                        f.id !== 1 &&
                        f.type !== "multiple_select" &&
                        f.type !== "link_row" &&
                        f.type !== "file"
                    )
                    .slice(0, 3)
                    .map((field) => {
                      const value = row[`field_${field.id}`];
                      if (value === null || value === undefined || value === "")
                        return null;
                      return (
                        <View key={field.id} style={styles.cardField}>
                          <Text
                            style={[
                              styles.cardFieldName,
                              { color: colors.mutedForeground },
                            ]}
                            numberOfLines={1}
                          >
                            {field.name}
                          </Text>
                          <Text
                            style={[
                              styles.cardFieldValue,
                              { color: colors.foreground },
                            ]}
                            numberOfLines={1}
                          >
                            {formatCellValue(value, field)}
                          </Text>
                        </View>
                      );
                    })}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function formatCellValue(
  value: unknown,
  field: BaserowField
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value ? "Yes" : "No";

  // Single select option
  if (typeof value === "object" && "value" in value) {
    return (value as { value: string }).value;
  }

  // Multiple select options
  if (Array.isArray(value)) {
    return value
      .map((v) =>
        typeof v === "object" && "value" in v
          ? (v as { value: string }).value
          : String(v)
      )
      .join(", ");
  }

  return JSON.stringify(value);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  fieldChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 6,
  },
  fieldChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  columnsScroll: {
    flex: 1,
  },
  column: {
    width: 240,
    marginRight: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    borderRadius: 8,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  columnTitle: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardsScroll: {
    flex: 1,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
  cardField: {
    marginTop: 4,
  },
  cardFieldName: {
    fontSize: 10,
    marginBottom: 1,
  },
  cardFieldValue: {
    fontSize: 12,
  },
});
