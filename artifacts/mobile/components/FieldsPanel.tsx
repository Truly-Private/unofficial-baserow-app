import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { createField, updateField, deleteField, listFields, type BaserowField, type BaserowFieldType } from "@/lib/baserow";

// Preset colors for select options (matching Baserow's palette)
const OPTION_COLORS: { label: string; value: string; hex: string }[] = [
  { label: "Blue", value: "blue", hex: "#4B73B0" },
  { label: "Red", value: "red", hex: "#D94035" },
  { label: "Green", value: "green", hex: "#3D9A6A" },
  { label: "Yellow", value: "yellow", hex: "#E6C040" },
  { label: "Orange", value: "orange", hex: "#E07B39" },
  { label: "Purple", value: "purple", hex: "#8A63B4" },
  { label: "Pink", value: "pink", hex: "#D45B8A" },
  { label: "Cyan", value: "cyan", hex: "#3AACBB" },
  { label: "Gray", value: "gray", hex: "#A0A0A0" },
  { label: "Dark", value: "dark", hex: "#333333" },
];

// Available field types in Baserow
const FIELD_TYPES: { type: BaserowFieldType; label: string; icon: string }[] = [
  { type: "text", label: "Short Text", icon: "Aa" },
  { type: "long_text", label: "Long Text", icon: "¶" },
  { type: "number", label: "Number", icon: "#" },
  { type: "rating", label: "Rating", icon: "★" },
  { type: "boolean", label: "Boolean", icon: "☑" },
  { type: "date", label: "Date", icon: "📅" },
  { type: "email", label: "Email", icon: "✉" },
  { type: "url", label: "URL", icon: "🔗" },
  { type: "file", label: "File", icon: "📎" },
  { type: "single_select", label: "Single Select", icon: "▼" },
  { type: "multiple_select", label: "Multiple Select", icon: "☰" },
  { type: "link_row", label: "Link to Table", icon: "🔗" },
];

export function FieldsPanel({
  tableId,
  visible,
  onClose,
}: {
  tableId: number;
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<BaserowField | null>(null);

  // Fetch fields
  const fieldsQuery = useQuery({
    queryKey: ["fields", creds?.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: visible && Number.isFinite(tableId),
  });

  // Create field mutation
  const createMutation = useMutation({
    mutationFn: (payload: Parameters<typeof createField>[2]) =>
      apiCall((c) => createField(c, tableId, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", creds?.baseUrl, tableId] });
      setShowAddModal(false);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to create field");
    },
  });

  // Update field mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { fieldId: number; data: Parameters<typeof updateField>[2] }) =>
      apiCall((c) => updateField(c, payload.fieldId, payload.data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", creds?.baseUrl, tableId] });
      setEditingField(null);
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update field");
    },
  });

  // Delete field mutation
  const deleteMutation = useMutation({
    mutationFn: (fieldId: number) => apiCall((c) => deleteField(c, fieldId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields", creds?.baseUrl, tableId] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete field");
    },
  });

  function getFieldIcon(type: BaserowFieldType): string {
    return FIELD_TYPES.find((f) => f.type === type)?.icon || "?";
  }

  function getFieldLabel(type: BaserowFieldType): string {
    return FIELD_TYPES.find((f) => f.type === type)?.label || type;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
        <View
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              paddingBottom: insets.bottom + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Columns</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeBtn, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Add button */}
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddModal(true)}
          >
            <Text style={styles.addBtnText}>+ Add Column</Text>
          </TouchableOpacity>

          {/* Fields List */}
          {fieldsQuery.isLoading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : fieldsQuery.data?.length === 0 ? (
            <Text style={styles.emptyText}>No columns yet</Text>
          ) : (
            <FlatList
              data={fieldsQuery.data}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.fieldRow, { borderBottomColor: colors.border }]}
                  onPress={() => setEditingField(item)}
                >
                  <View style={styles.fieldInfo}>
                    <Text style={[styles.fieldIcon]}>
                      {getFieldIcon(item.type as BaserowFieldType)}
                    </Text>
                    <View>
                      <Text style={[styles.fieldName, { color: colors.foreground }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.fieldType, { color: colors.mutedForeground }]}>
                        {getFieldLabel(item.type as BaserowFieldType)}
                      </Text>
                    </View>
                  </View>
                  {item.primary && (
                    <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.primaryText}>Primary</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>

      {/* Add Field Modal */}
      <AddFieldModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(payload) => createMutation.mutate(payload)}
        loading={createMutation.isPending}
      />

      {/* Edit Field Modal */}
      {editingField && (
        <EditFieldModal
          visible={true}
          field={editingField}
          onClose={() => setEditingField(null)}
          onUpdate={(data) =>
            updateMutation.mutate({ fieldId: editingField.id, data })
          }
          onDelete={() => {
            Alert.alert(
              "Delete Column",
              `Are you sure you want to delete "${editingField.name}"? This will also delete all values in this column.`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteMutation.mutate(editingField.id);
                    setEditingField(null);
                  },
                },
              ]
            );
          }}
          loading={updateMutation.isPending || deleteMutation.isPending}
        />
      )}
    </Modal>
  );
}

type DraftOption = { value: string; color: string };

type CreateFieldPayload = {
  name: string;
  type: BaserowFieldType;
  select_options?: DraftOption[];
};

function AddFieldModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateFieldPayload) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<BaserowFieldType>("text");
  const [draftOptions, setDraftOptions] = useState<DraftOption[]>([]);
  const [newOptionValue, setNewOptionValue] = useState("");
  const [newOptionColor, setNewOptionColor] = useState("blue");

  const isSelectType =
    fieldType === "single_select" || fieldType === "multiple_select";

  // Reset all state when modal closes
  useEffect(() => {
    if (!visible) {
      setName("");
      setFieldType("text");
      setDraftOptions([]);
      setNewOptionValue("");
      setNewOptionColor("blue");
    }
  }, [visible]);

  function handleAddOption() {
    const trimmed = newOptionValue.trim();
    if (!trimmed) return;
    setDraftOptions((prev) => [...prev, { value: trimmed, color: newOptionColor }]);
    setNewOptionValue("");
    setNewOptionColor("blue");
  }

  function handleRemoveOption(index: number) {
    setDraftOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    const payload: CreateFieldPayload = { name: name.trim(), type: fieldType };
    if (isSelectType && draftOptions.length > 0) {
      payload.select_options = draftOptions;
    }
    onSubmit(payload);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Column</Text>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Column name"
              autoFocus
            />

            <Text style={styles.inputLabel}>Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {FIELD_TYPES.map((ft) => (
                  <TouchableOpacity
                    key={ft.type}
                    style={[
                      styles.typeBtn,
                      fieldType === ft.type && styles.typeBtnActive,
                    ]}
                    onPress={() => setFieldType(ft.type)}
                  >
                    <Text style={styles.typeIcon}>{ft.icon}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        fieldType === ft.type && styles.typeLabelActive,
                      ]}
                    >
                      {ft.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {isSelectType && (
              <View style={styles.optionsSection}>
                <Text style={styles.inputLabel}>Options</Text>

                {draftOptions.map((opt, idx) => (
                  <View key={idx} style={styles.draftOptionRow}>
                    <View
                      style={[
                        styles.optionColorDot,
                        {
                          backgroundColor:
                            OPTION_COLORS.find((c) => c.value === opt.color)
                              ?.hex ?? "#888",
                        },
                      ]}
                    />
                    <Text style={styles.draftOptionLabel}>{opt.value}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveOption(idx)}
                      style={styles.removeOptionBtn}
                    >
                      <Text style={styles.removeOptionText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                <View style={styles.newOptionRow}>
                  <TextInput
                    style={[styles.input, styles.newOptionInput]}
                    value={newOptionValue}
                    onChangeText={setNewOptionValue}
                    placeholder="Option label"
                    returnKeyType="done"
                    onSubmitEditing={handleAddOption}
                  />
                  <TouchableOpacity
                    style={styles.addOptionBtn}
                    onPress={handleAddOption}
                    disabled={!newOptionValue.trim()}
                  >
                    <Text style={styles.addOptionBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.colorPickerRow}>
                  {OPTION_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      onPress={() => setNewOptionColor(c.value)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c.hex },
                        newOptionColor === c.value && styles.colorSwatchSelected,
                      ]}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, !name.trim() && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!name.trim() || loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? "Adding..." : "Add"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditFieldModal({
  visible,
  field,
  onClose,
  onUpdate,
  onDelete,
  loading,
}: {
  visible: boolean;
  field: BaserowField;
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(field.name);

  function handleSubmit() {
    if (!name.trim() || name === field.name) return;
    onUpdate({ name: name.trim() });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Column</Text>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Column name"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  (name === field.name || !name.trim()) && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmit}
                disabled={name === field.name || !name.trim() || loading}
              >
                <Text style={styles.submitBtnText}>
                  {loading ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  panel: {
    maxHeight: "70%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeBtn: {
    fontSize: 16,
    fontWeight: "600",
  },
  addBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    textAlign: "center",
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  fieldInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fieldIcon: {
    fontSize: 20,
    width: 32,
    textAlign: "center",
  },
  fieldName: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldType: {
    fontSize: 12,
    marginTop: 2,
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  primaryText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 8,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  typeIcon: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  typeLabelActive: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: "#666",
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#ccc",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  deleteBtnText: {
    color: "#FF3B30",
    fontSize: 16,
  },
  rightActions: {
    flexDirection: "row",
    gap: 10,
  },
  // Select options editor styles
  optionsSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  draftOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  optionColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  draftOptionLabel: {
    flex: 1,
    fontSize: 14,
  },
  removeOptionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  removeOptionText: {
    fontSize: 14,
    color: "#999",
  },
  newOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  newOptionInput: {
    flex: 1,
    marginBottom: 0,
  },
  addOptionBtn: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addOptionBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  colorPickerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  colorSwatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorSwatchSelected: {
    borderColor: "#333",
  },
});