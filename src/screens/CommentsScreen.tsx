import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import {
  fetchRowComments,
  createRowComment,
  deleteRowComment,
} from "../api/database";
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
  rowId: number;
  onBack?: () => void;
};

interface Comment {
  id: number;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    email: string;
  };
  message: string;
  created_on: string;
  modified_on: string;
}

export const CommentsScreen: React.FC<Props> = ({ tableId, rowId, onBack }) => {
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", tableId, rowId],
    queryFn: async () => {
      const result = await apiCall((client) =>
        fetchRowComments(client, tableId, rowId)
      );
      return result;
    },
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (message: string) =>
      apiCall((client) => createRowComment(client, tableId, rowId, message)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tableId, rowId] });
      setNewMessage("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to create comment");
    },
  });

  // Delete comment mutation
  const deleteMutation = useMutation({
    mutationFn: (commentId: number) =>
      apiCall((client) => deleteRowComment(client, tableId, commentId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tableId, rowId] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to delete comment");
    },
  });

  const handleCreateComment = () => {
    if (!newMessage.trim()) return;
    createMutation.mutate(newMessage.trim());
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(commentId),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const commentList = Array.isArray(comments)
    ? comments
    : comments?.results || [];

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <Text style={styles.userName}>
          {item.user.first_name}
          {item.user.last_name ? ` ${item.user.last_name}` : ""}
        </Text>
        <Text style={styles.timestamp}>{formatDate(item.created_on)}</Text>
      </View>
      <Text style={styles.commentMessage}>{item.message}</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteComment(item.id)}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Comments</Text>

      {/* Add new comment */}
      <View style={styles.createForm}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.createButton,
            createMutation.isPending && styles.buttonDisabled,
          ]}
          onPress={handleCreateComment}
          disabled={createMutation.isPending || !newMessage.trim()}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Add Comment</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Comments list */}
      {isLoading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={commentList as Comment[]}
          keyExtractor={(item: Comment) => String(item.id)}
          renderItem={renderComment}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No comments yet. Be the first to comment!
            </Text>
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
    minHeight: 60,
    textAlignVertical: "top",
  },
  createButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  createButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  loader: { marginTop: 40 },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: { fontSize: 14, fontWeight: "600", color: "#333" },
  timestamp: { fontSize: 12, color: "#999" },
  commentMessage: { fontSize: 15, color: "#444", lineHeight: 20 },
  deleteButton: { alignSelf: "flex-start", marginTop: 8 },
  deleteText: { color: "#ff3b30", fontSize: 14 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});

export default CommentsScreen;
