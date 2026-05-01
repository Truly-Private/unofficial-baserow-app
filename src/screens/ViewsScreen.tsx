import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

type Props = {
  tableId: number;
  onBack?: () => void;
};

export const ViewsScreen: React.FC<Props> = ({ tableId, onBack }) => {
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const [newViewName, setNewViewName] = useState("");
  const [viewType, setViewType] = useState<"grid" | "gallery" | "kanban" | "calendar">("grid");

  // Fetch views
  const { data: views, isLoading } = useQuery({
    queryKey: ["views", tableId],
    queryFn: () => apiCall((c) => c.get(Endpoints.viewsFull.list(tableId))),
  });

  // Create view mutation
  const createMutation = useMutation({
    mutationFn: (payload: { name: string; type: string }) =>
      apiCall((c) => c.post(Endpoints.viewsFull.create(tableId), payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views", tableId] });
      setNewViewName("");
    },
  });

  // Delete view mutation
  const deleteMutation = useMutation({
    mutationFn: (viewId: number) =>
      apiCall((c) => c.delete(Endpoints.viewsFull.delete(viewId))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["views", tableId] });
    },
  });

  const handleCreateView = () => {
    if (!newViewName.trim()) return;
    createMutation.mutate({ name: newViewName.trim(), type: viewType });
  };

  const handleDeleteView = (viewId: number, viewName: string) => {
    Alert.alert(
      "Delete View",
      `Are you sure you want to delete "${viewName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(viewId),
        },
      ]
    );
  };

  const viewList = Array.isArray(views) ? views : views?.results || [];

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Views</Text>

      {/* Create new view */}
      <View style={styles.createForm}>
        <TextInput
          style={styles.input}
          placeholder="New view name"
          value={newViewName}
          onChangeText={setNewViewName}
        />
        <View style={styles.typeSelector}>
          {(["grid", "gallery", "kanban", "calendar"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeButton, viewType === t && styles.typeButtonActive]}
              onPress={() => setViewType(t)}
            >
              <Text style={[styles.typeText, viewType === t && styles.typeTextActive]}>
                {t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.createButton, createMutation.isPending && styles.buttonDisabled]}
          onPress={handleCreateView}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create View</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* View list */}
      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={viewList}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.viewItem}>
              <View style={styles.viewInfo}>
                <Text style={styles.viewName}>{item.name}</Text>
                <Text style={styles.viewType}>{item.type}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteView(item.id, item.name)}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No views yet. Create one above!</Text>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  backButton: { marginBottom: 8 },
  backText: { color: "#007AFF", fontSize: 16 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 16 },
  createForm: { marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 16,
  },
  typeSelector: { flexDirection: "row", marginBottom: 8 },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: "#ddd",
    marginRight: 6,
  },
  typeButtonActive: { backgroundColor: "#007AFF" },
  typeText: { fontSize: 12, color: "#333" },
  typeTextActive: { color: "#fff" },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loader: { marginTop: 40 },
  viewItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  viewInfo: { flex: 1 },
  viewName: { fontSize: 16, fontWeight: "500" },
  viewType: { fontSize: 12, color: "#666", marginTop: 2 },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 6 },
  deleteText: { color: "#ff3b30", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default ViewsScreen;