import { useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { type BaserowField, type BaserowRow } from "@/lib/baserow";

interface GalleryViewProps {
  rows: BaserowRow[];
  fields: BaserowField[];
  onRowPress: (row: BaserowRow) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const NUM_COLUMNS = 2;
const CARD_GAP = 8;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

export function GalleryView({
  rows,
  fields,
  onRowPress,
}: GalleryViewProps) {
  const colors = useColors();

  // Gallery renders field_1 as the image (if URL field) or card cover
  const coverField = useMemo(
    () => fields.find((f) => f.type === "url" || f.type === "file"),
    [fields]
  );

  const renderItem = ({ item, index }: { item: BaserowRow; index: number }) => {
    const coverValue = coverField ? item[`field_${coverField.id}`] : null;
    const isLeft = index % 2 === 0;

    return (
      <Pressable
        onPress={() => onRowPress(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            width: CARD_WIDTH,
            marginRight: isLeft ? CARD_GAP : 0,
            marginLeft: isLeft ? 0 : CARD_GAP,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {/* Cover image */}
        {coverField && coverValue ? (
          <View
            style={[
              styles.coverImage,
              { backgroundColor: colors.muted },
            ]}
          >
            <Text style={[styles.coverPlaceholder, { color: colors.mutedForeground }]}>
              {typeof coverValue === "string" && coverValue.startsWith("http")
                ? "🖼️"
                : Array.isArray(coverValue) && coverValue.length > 0
                ? `🖼️ ×${coverValue.length}`
                : "📄"}
            </Text>
          </View>
        ) : null}

        {/* Card body */}
        <View style={styles.cardBody}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={2}
          >
            {String(item.field_1 ?? "Untitled")}
          </Text>

          {/* Secondary fields */}
          {fields
            .filter(
              (f) =>
                f.id !== 1 &&
                f.type !== "multiple_select" &&
                f.type !== "link_row" &&
                f.type !== "file" &&
                f.type !== "url"
            )
            .slice(0, 4)
            .map((field) => {
              const value = item[`field_${field.id}`];
              if (value === null || value === undefined || value === "") return null;
              return (
                <View key={field.id} style={styles.fieldRow}>
                  <Text
                    style={[styles.fieldLabel, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {field.name}
                  </Text>
                  <Text
                    style={[styles.fieldValue, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {formatCellValue(value, field)}
                  </Text>
                </View>
              );
            })}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      numColumns={NUM_COLUMNS}
      contentContainerStyle={{
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingVertical: 8,
        gap: CARD_GAP,
      }}
      columnWrapperStyle={{ gap: CARD_GAP }}
      showsVerticalScrollIndicator={false}
    />
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
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: CARD_GAP,
    overflow: "hidden",
  },
  coverImage: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  coverPlaceholder: {
    fontSize: 24,
  },
  cardBody: {
    padding: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  fieldLabel: {
    fontSize: 11,
    width: 70,
    flexShrink: 0,
  },
  fieldValue: {
    fontSize: 11,
    flex: 1,
  },
});
