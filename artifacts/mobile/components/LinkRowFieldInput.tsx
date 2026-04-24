import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  getPrimaryDisplay,
  listFields,
  listRows,
  type BaserowField,
  type BaserowLinkRowValue,
} from "@/lib/baserow";

type LinkRowFieldInputProps = {
  field: BaserowField;
  value: unknown;
  onChange: (next: BaserowLinkRowValue[]) => void;
};

function asLinkValues(value: unknown): BaserowLinkRowValue[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => {
      if (typeof v === "object" && v !== null && "id" in (v as object)) {
        const o = v as { id: number; value?: string };
        return { id: Number(o.id), value: o.value ?? `Row ${o.id}` };
      }
      if (typeof v === "number") return { id: v, value: `Row ${v}` };
      return null;
    })
    .filter((x): x is BaserowLinkRowValue => x !== null);
}

export function LinkRowFieldInput({
  field,
  value,
  onChange,
}: LinkRowFieldInputProps) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => asLinkValues(value), [value]);
  const linkedTableId = field.link_row_table_id ?? null;

  return (
    <View>
      <View style={styles.chipRow}>
        {selected.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>
            No linked rows
          </Text>
        ) : (
          selected.map((row) => (
            <View
              key={row.id}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text
                style={[styles.chipText, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {row.value}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(selected.filter((r) => r.id !== row.id));
                }}
              >
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))
        )}
      </View>
      <Pressable
        onPress={() => {
          if (!linkedTableId) return;
          Haptics.selectionAsync().catch(() => {});
          setOpen(true);
        }}
        disabled={!linkedTableId}
        style={[
          styles.editBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: colors.radius,
            opacity: linkedTableId ? 1 : 0.5,
          },
        ]}
      >
        <Feather name="link" size={14} color={colors.foreground} />
        <Text style={[styles.editBtnText, { color: colors.foreground }]}>
          {selected.length === 0 ? "Choose linked rows" : "Edit selection"}
        </Text>
      </Pressable>

      {linkedTableId ? (
        <LinkRowPickerModal
          visible={open}
          onClose={() => setOpen(false)}
          tableId={linkedTableId}
          fieldName={field.name}
          selected={selected}
          onChange={onChange}
        />
      ) : null}
    </View>
  );
}

type PickerProps = {
  visible: boolean;
  onClose: () => void;
  tableId: number;
  fieldName: string;
  selected: BaserowLinkRowValue[];
  onChange: (next: BaserowLinkRowValue[]) => void;
};

function LinkRowPickerModal({
  visible,
  onClose,
  tableId,
  fieldName,
  selected,
  onChange,
}: PickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [draft, setDraft] = useState<BaserowLinkRowValue[]>(selected);

  useEffect(() => {
    if (visible) setDraft(selected);
  }, [visible, selected]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search, visible]);

  const fieldsQuery = useQuery({
    queryKey: ["fields", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: visible && Number.isFinite(tableId),
  });

  const rowsQuery = useQuery({
    queryKey: ["link-rows", creds.baseUrl, tableId, debounced],
    queryFn: () =>
      apiCall((c) =>
        listRows(c, tableId, { search: debounced, size: 50, page: 1 }),
      ),
    enabled: visible && Number.isFinite(tableId),
  });

  const fields = fieldsQuery.data ?? [];
  const rows = rowsQuery.data?.results ?? [];

  function toggle(rowId: number, label: string) {
    const exists = draft.some((r) => r.id === rowId);
    Haptics.selectionAsync().catch(() => {});
    if (exists) {
      setDraft(draft.filter((r) => r.id !== rowId));
    } else {
      setDraft([...draft, { id: rowId, value: label }]);
    }
  }

  function save() {
    onChange(draft);
    onClose();
  }

  const topPad = Math.max(insets.top, webInsets.top, 16);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.modalHeader,
            {
              paddingTop: topPad + 12,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable hitSlop={10} onPress={onClose} style={{ paddingRight: 12 }}>
            <Text style={[styles.headerBtn, { color: colors.mutedForeground }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Link {fieldName}
          </Text>
          <Pressable hitSlop={10} onPress={save} style={{ paddingLeft: 12 }}>
            <Text style={[styles.headerBtn, { color: colors.primary }]}>Done</Text>
          </Pressable>
        </View>

        <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search rows…"
              placeholderTextColor={colors.mutedForeground}
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {search.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {rowsQuery.isLoading || fieldsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : rowsQuery.isError ? (
          <View style={styles.center}>
            <Text style={[styles.empty, { color: colors.destructive }]}>
              {rowsQuery.error instanceof Error
                ? rowsQuery.error.message
                : "Could not load rows."}
            </Text>
          </View>
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => String(r.id)}
            contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={[styles.empty, { color: colors.mutedForeground }]}>
                  No rows found.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const label = getPrimaryDisplay(item, fields);
              const isSelected = draft.some((r) => r.id === item.id);
              return (
                <Pressable
                  onPress={() => toggle(item.id, label)}
                  style={({ pressed }) => [
                    styles.rowItem,
                    {
                      backgroundColor: pressed
                        ? colors.muted
                        : colors.background,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.rowLabel, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {label || `Row ${item.id}`}
                    </Text>
                    <Text
                      style={[styles.rowMeta, { color: colors.mutedForeground }]}
                    >
                      ID {item.id}
                    </Text>
                  </View>
                  <Feather
                    name={isSelected ? "check-circle" : "circle"}
                    size={22}
                    color={
                      isSelected ? colors.primary : colors.mutedForeground
                    }
                  />
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
    maxWidth: 240,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flexShrink: 1,
  },
  empty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  editBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  headerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    flex: 1,
    textAlign: "center",
  },
  headerBtn: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  rowMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
});
