import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import {
  fetchRowComments,
  createRowComment,
  updateRowComment,
  deleteRowComment,
  setRowCommentNotificationMode,
  RowComment,
} from "../api/database";

type Props = {
  tableId: number;
  rowId: number;
  workspaceId?: number;
  onBack?: () => void;
};

export const RowCommentsScreen: React.FC<Props> = ({
  tableId,
  rowId,
  workspaceId,
  onBack,
}) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();

  const [newMessage, setNewMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [notificationMode, setNotificationMode] = useState<"all" | "mentions">("all");
  const [showModeSheet, setShowModeSheet] = useState(false);

  // List comments
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["rowComments", tableId, rowId],
    queryFn: () => apiCall((c) => c.get(Endpoints.rowComments.list(tableId, rowId))),
  });

  // Create comment
  const createMut = useMutation({
    mutationFn: (message: string) =>
      apiCall((c) => c.post(Endpoints.rowComments.create(tableId, rowId), { message })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rowComments", tableId, rowId] });
      setNewMessage("");
    },
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to create comment"),
  });

  // Update comment
  const updateMut = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      apiCall((c) => c.patch(Endpoints.rowComments.update(tableId, id), { message })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rowComments", tableId, rowId] });
      setEditingId(null);
      setEditText("");
    },
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to update comment"),
  });

  // Delete comment
  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiCall((c) => c.delete(Endpoints.rowComments.delete(tableId, id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rowComments", tableId, rowId] });
    },
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to delete comment"),
  });

  // Set notification mode
  const modeMut = useMutation({
    mutationFn: (mode: "all" | "mentions") =>
      apiCall((c) => c.put(Endpoints.rowComments.notificationMode(tableId, rowId), { mode })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rowComments", tableId, rowId] });
      setShowModeSheet(false);
    },
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to set notification mode"),
  });

  const commentList: RowComment[] = comments?.results ?? comments ?? [];

  const confirmDelete = (comment: RowComment) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMut.mutate(comment.id),
        },
      ],
    );
  };

  const renderComment = ({ item }: { item: RowComment }) => {
    if (editingId === item.id) {
      return (
        <View style={styles.commentCard}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
            testID="comment-edit-input"
          />
          <View style={styles.rowActions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => updateMut.mutate({ id: item.id, message: editText })}
              disabled={updateMut.isPending}
              testID="comment-save-btn"
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setEditingId(null); setEditText(""); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.commentCard} testID={`comment-${item.id}`}>
        <View style={styles.commentHeader}>
          <Text style={styles.authorName}>{item.first_name ?? `User ${item.user_id}`}</Text>
          <Text style={styles.commentDate}>
            {new Date(item.created_on).toLocaleDateString()}
            {item.edited === "yes" && " (edited)"}
          </Text>
        </View>
        <Text style={styles.commentMessage}>{item.message}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => { setEditingId(item.id); setEditText(item.message); }}
            testID={`comment-edit-${item.id}`}
          >
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(item)}
            testID={`comment-delete-${item.id}`}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} testID="back-btn">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Comments</Text>
        <TouchableOpacity
          style={styles.modeBtn}
          onPress={() => setShowModeSheet(true)}
          testID="notification-mode-btn"
        >
          <Text style={styles.modeBtnText}>🔔 {notificationMode}</Text>
        </TouchableOpacity>
      </View>

      {/* Comment list */}
      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>Failed to load comments.</Text>
      ) : commentList.length === 0 ? (
        <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
      ) : (
        <FlatList
          data={commentList}
          renderItem={renderComment}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          testID="comments-list"
        />
      )}

      {/* New comment input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          testID="new-comment-input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
          onPress={() => createMut.mutate(newMessage.trim())}
          disabled={!newMessage.trim() || createMut.isPending}
          testID="send-comment-btn"
        >
          <Text style={styles.sendBtnText}>
            {createMut.isPending ? "..." : "Send"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification mode modal */}
      <Modal
        visible={showModeSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModeSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notification Mode</Text>
            {(["all", "mentions"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeOption,
                  notificationMode === mode && styles.modeOptionActive,
                ]}
                onPress={() => {
                  setNotificationMode(mode);
                  modeMut.mutate(mode);
                }}
                testID={`mode-${mode}`}
              >
                <Text style={styles.modeOptionText}>
                  {mode === "all"
                    ? "🔔 All — notify on all new comments"
                    : "🏷 Mentions — notify only when mentioned"}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowModeSheet(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backText: { fontSize: 16, color: "#007AFF" },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  modeBtn: { padding: 4 },
  modeBtnText: { fontSize: 13, color: "#007AFF" },
  loader: { marginTop: 40 },
  errorText: { textAlign: "center", marginTop: 40, color: "red" },
  emptyText: { textAlign: "center", marginTop: 40, color: "#888" },
  listContent: { padding: 16 },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  authorName: { fontWeight: "700", fontSize: 14, color: "#1a1a1a" },
  commentDate: { fontSize: 12, color: "#888" },
  commentMessage: { fontSize: 15, color: "#333", lineHeight: 20 },
  rowActions: { flexDirection: "row", marginTop: 8, gap: 12 },
  editBtn: { paddingVertical: 4 },
  editBtnText: { fontSize: 13, color: "#007AFF" },
  deleteBtn: { paddingVertical: 4 },
  deleteBtnText: { fontSize: 13, color: "#FF3B30" },
  editInput: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 60,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  cancelBtnText: { color: "#888", fontSize: 14 },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: "#f5f5f5",
  },
  sendBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: "#b0d4ff" },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  modeOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  modeOptionActive: { backgroundColor: "#e8f0ff", borderWidth: 1, borderColor: "#007AFF" },
  modeOptionText: { fontSize: 15 },
  modalClose: { marginTop: 8, paddingVertical: 14, alignItems: "center" },
  modalCloseText: { fontSize: 15, color: "#888" },
});
