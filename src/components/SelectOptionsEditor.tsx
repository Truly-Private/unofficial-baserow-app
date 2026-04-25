import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { addOption, updateOption, deleteOption } from "../lib/baserow";
import { SelectOption } from "../types/models";
import { SelectOptionPayload } from "../api/database";

// Preset colors matching Baserow's palette
export const PRESET_COLORS = [
  { label: "Blue", value: "blue" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Yellow", value: "yellow" },
  { label: "Orange", value: "orange" },
  { label: "Purple", value: "purple" },
  { label: "Pink", value: "pink" },
  { label: "Cyan", value: "cyan" },
  { label: "Gray", value: "gray" },
  { label: "Dark", value: "dark" },
];

const COLOR_HEX: Record<string, string> = {
  blue: "#4B73B0",
  red: "#D94035",
  green: "#3D9A6A",
  yellow: "#E6C040",
  orange: "#E07B39",
  purple: "#8A63B4",
  pink: "#D45B8A",
  cyan: "#3AACBB",
  gray: "#A0A0A0",
  dark: "#333333",
};

type Props = {
  fieldId: number;
  options: SelectOption[];
  /** Query key(s) to invalidate after a mutation so parent re-fetches */
  invalidateKeys?: (string | number)[][];
};

type EditingState = {
  optionId: number | null; // null → adding new
  value: string;
  color: string;
};

const emptyEditing = (): EditingState => ({
  optionId: null,
  value: "",
  color: "blue",
});

export const SelectOptionsEditor: React.FC<Props> = ({
  fieldId,
  options,
  invalidateKeys,
}) => {
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingState | null>(null);

  const toPayload = (opts: SelectOption[]): SelectOptionPayload[] =>
    opts.map((o) => ({ ...(o.id !== undefined && { id: o.id }), value: o.value, color: o.color }));

  const invalidate = () => {
    (invalidateKeys ?? []).forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
  };

  // --- Add mutation ---
  const addMutation = useMutation({
    mutationFn: ({
      option,
      currentOptions,
    }: {
      option: Omit<SelectOptionPayload, "id">;
      currentOptions: SelectOptionPayload[];
    }) => apiCall((c) => addOption(c, fieldId, option, currentOptions)),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    onError: (e: any) => Alert.alert("Error", e?.message ?? "Failed to add option"),
  });

  // --- Update mutation ---
  const updateMutation = useMutation({
    mutationFn: ({
      optionId,
      changes,
      currentOptions,
    }: {
      optionId: number;
      changes: Partial<Omit<SelectOptionPayload, "id">>;
      currentOptions: SelectOptionPayload[];
    }) => apiCall((c) => updateOption(c, fieldId, optionId, changes, currentOptions)),
    onSuccess: () => {
      setEditing(null);
      invalidate();
    },
    onError: (e: any) => Alert.alert("Error", e?.message ?? "Failed to update option"),
  });

  // --- Delete mutation ---
  const deleteMutation = useMutation({
    mutationFn: ({
      optionId,
      currentOptions,
    }: {
      optionId: number;
      currentOptions: SelectOptionPayload[];
    }) => apiCall((c) => deleteOption(c, fieldId, optionId, currentOptions)),
    onSuccess: () => invalidate(),
    onError: (e: any) => Alert.alert("Error", e?.message ?? "Failed to delete option"),
  });

  const isBusy =
    addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSave = () => {
    if (!editing) return;
    const trimmed = editing.value.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Option value cannot be empty.");
      return;
    }
    const current = toPayload(options);
    if (editing.optionId === null) {
      addMutation.mutate({ option: { value: trimmed, color: editing.color }, currentOptions: current });
    } else {
      updateMutation.mutate({
        optionId: editing.optionId,
        changes: { value: trimmed, color: editing.color },
        currentOptions: current,
      });
    }
  };

  const handleDelete = (option: SelectOption) => {
    if (option.id === undefined) return;
    Alert.alert(
      "Delete Option",
      `Delete "${option.value}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteMutation.mutate({
              optionId: option.id!,
              currentOptions: toPayload(options),
            }),
        },
      ],
    );
  };

  const startEdit = (option: SelectOption) => {
    if (option.id === undefined) return;
    setEditing({ optionId: option.id, value: option.value, color: option.color });
  };

  const startAdd = () => setEditing(emptyEditing());

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select Options</Text>

      <FlatList
        data={options}
        keyExtractor={(o) => String(o.id ?? o.value)}
        renderItem={({ item }) => (
          <View style={styles.optionRow}>
            <View
              style={[
                styles.colorDot,
                { backgroundColor: COLOR_HEX[item.color] ?? "#888" },
              ]}
            />
            <Text style={styles.optionLabel}>{item.value}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => startEdit(item)}
                style={styles.actionBtn}
                disabled={isBusy}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={[styles.actionBtn, styles.deleteBtn]}
                disabled={isBusy}
              >
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No options yet. Add one below.</Text>
        }
      />

      {editing !== null ? (
        <View style={styles.editPanel}>
          <Text style={styles.editTitle}>
            {editing.optionId === null ? "Add Option" : "Edit Option"}
          </Text>
          <TextInput
            style={styles.input}
            value={editing.value}
            onChangeText={(v) => setEditing((e) => e && { ...e, value: v })}
            placeholder="Option label"
            autoFocus
          />
          <Text style={styles.colorLabel}>Color</Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setEditing((e) => e && { ...e, color: c.value })}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: COLOR_HEX[c.value] ?? "#888" },
                  editing.color === c.value && styles.colorSwatchSelected,
                ]}
              />
            ))}
          </View>
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={() => setEditing(null)}
              style={[styles.btn, styles.cancelBtn]}
              disabled={isBusy}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.btn, styles.saveBtn]}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={startAdd}
          style={styles.addBtn}
          disabled={isBusy}
        >
          <Text style={styles.addBtnText}>+ Add Option</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  header: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  optionLabel: { flex: 1, fontSize: 14 },
  actions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e8e8e8",
    borderRadius: 4,
  },
  deleteBtn: { backgroundColor: "#fde8e8" },
  actionText: { fontSize: 12, color: "#333" },
  deleteText: { color: "#c0392b" },
  emptyText: { fontSize: 13, color: "#888", textAlign: "center", paddingVertical: 8 },
  editPanel: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  editTitle: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  colorLabel: { fontSize: 12, color: "#666", marginBottom: 6 },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: { borderColor: "#333" },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  cancelBtn: { backgroundColor: "#e8e8e8" },
  saveBtn: { backgroundColor: "#3D7DD4" },
  saveBtnText: { color: "#fff", fontWeight: "600" },
  addBtn: {
    marginTop: 10,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3D7DD4",
    borderRadius: 6,
  },
  addBtnText: { color: "#3D7DD4", fontWeight: "600" },
});

export default SelectOptionsEditor;
