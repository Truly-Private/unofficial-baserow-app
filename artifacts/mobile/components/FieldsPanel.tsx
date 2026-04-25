import React, { useState } from "react";
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

function AddFieldModal({
  visible,
  onClose,
  onSubmit,
  loading,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
  loading: boolean;
}) {
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<BaserowFieldType>("text");

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), type: fieldType });
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
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
});