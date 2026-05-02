import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { useCreds } from "@/contexts/AuthContext";
import { createComment, listComments, type BaserowComment } from "@/lib/baserow";
import { useComments } from "@/hooks/useComments";
import { useColors } from "@/hooks/useColors";

interface CommentsPanelProps {
  tableId: number;
  rowId: number;
  onClose?: () => void;
}

export function CommentsPanel({ tableId, rowId }: CommentsPanelProps) {
  const colors = useColors();
  const creds = useCreds();
  const commentsQuery = useComments(tableId, rowId);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await createComment(creds, tableId, rowId, newComment.trim());
      setNewComment("");
      commentsQuery.refetch();
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  };

  if (commentsQuery.isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const commentsResponse = commentsQuery.data;
  const comments = commentsResponse?.results ?? [];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Comments
        </Text>
        <Text style={[styles.commentCount, { color: colors.mutedForeground }]}>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </Text>
      </View>

      {/* Comments list */}
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="message-circle"
            title="No comments yet"
            description="Be the first to add a comment"
          />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.commentsList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.commentItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              {/* Avatar */}
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.avatarText}>
                  {getInitials(item.user_first_name, item.user_last_name)}
                </Text>
              </View>

              {/* Content */}
              <View style={styles.commentContent}>
                <View style={styles.commentMeta}>
                  <Text style={[styles.userName, { color: colors.foreground }]}>
                    {item.user_first_name} {item.user_last_name}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                    {formatDate(item.created_on)}
                  </Text>
                </View>
                <Text style={[styles.commentText, { color: colors.foreground }]}>
                  {item.comment}
                </Text>
              </View>
            </View>
          )}
        />
      )}


      {/* New comment input */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          placeholder="Add a comment..."
          placeholderTextColor={colors.mutedForeground}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={2000}
        />
        <Button
          title="Post"
          onPress={handleSubmit}
          disabled={!newComment.trim()}
          loading={isSubmitting}
          style={styles.postButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  commentCount: {
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
  },
  commentsList: {
    padding: 16,
    gap: 12,
  },
  commentItem: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  commentContent: {
    flex: 1,
  },
  commentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
