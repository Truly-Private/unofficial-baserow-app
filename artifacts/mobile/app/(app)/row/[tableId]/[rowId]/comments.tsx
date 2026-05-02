/**
 * RowCommentsScreen — view, post, edit and delete comments on a table row.
 *
 * Route: /row/[tableId]/[rowId]/comments
 * Accessible via a comments button in the row edit screen header.
 *
 * API endpoints used:
 *   GET    /api/row_comments/{tableId}/{rowId}/
 *   POST   /api/row_comments/{tableId}/{rowId}/
 *   PATCH  /api/row_comments/{tableId}/comment/{commentId}/
 *   DELETE /api/row_comments/{tableId}/comment/{commentId}/
 *   PUT    /api/row_comments/{tableId}/{rowId}/notification-mode/
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  BaserowComment,
  createComment,
  deleteComment,
  listComments,
  setRowCommentNotificationMode,
  updateComment,
} from "@/lib/baserow";

// ─── Notification Mode Modal ─────────────────────────────────────────────────

type NotifMode = "all" | "only_mentions" | "nothing";

const MODE_LABELS: Record<NotifMode, string> = {
  all: "All comments",
  only_mentions: "Only @mentions",
  nothing: "Off",
};
const MODE_ICONS: Record<NotifMode, "bell" | "at-sign" | "bell-off"> = {
  all: "bell",
  only_mentions: "at-sign",
  nothing: "bell-off",
};

function NotifModeSheet({
  current,
  colors,
  onSelect,
  onClose,
}: {
  current: NotifMode;
  colors: ReturnType<typeof useColors>;
  onSelect: (m: NotifMode) => void;
  onClose: () => void;
}) {
  return (
    <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>Notification Mode</Text>
        <Pressable onPress={onClose} hitSlop={8} testID="notif-mode-close">
          <Feather name="x" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>
      {(["all", "only_mentions", "nothing"] as NotifMode[]).map((mode) => (
        <Pressable
          key={mode}
          style={[styles.modeRow, { borderBottomColor: colors.border }]}
          onPress={() => onSelect(mode)}
          testID={`mode-${mode}`}
        >
          <Feather name={MODE_ICONS[mode]} size={16} color={mode === current ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.modeLabel, { color: mode === current ? colors.primary : colors.text }]}>
            {MODE_LABELS[mode]}
          </Text>
          {mode === current && <Feather name="check" size={14} color={colors.primary} />}
        </Pressable>
      ))}
      <Pressable style={[styles.cancelBtn, { borderTopColor: colors.border }]} onPress={onClose}>
        <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// ─── Comment Card ─────────────────────────────────────────────────────────────

function CommentCard({
  comment,
  currentUserId,
  colors,
  onEdit,
  onDelete,
}: {
  comment: BaserowComment;
  currentUserId: number;
  colors: ReturnType<typeof useColors>;
  onEdit: (c: BaserowComment) => void;
  onDelete: (c: BaserowComment) => void;
}) {
  const isOwn = comment.user_id === currentUserId;
  const date = new Date(comment.created_on);
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <View
      style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
      testID={`comment-card-${comment.id}`}
    >
      {/* Avatar + name + time */}
      <View style={styles.commentHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(comment.user_first_name?.[0] ?? comment.user_email?.[0] ?? "?").toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.commentAuthor, { color: colors.text }]}>
            {comment.user_first_name
              ? `${comment.user_first_name} ${comment.user_last_name ?? ""}`.trim()
              : comment.user_email}
          </Text>
          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
            {dateStr} · {timeStr}
          </Text>
        </View>
        {isOwn && (
          <View style={styles.commentActions}>
            <Pressable
              onPress={() => onEdit(comment)}
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: colors.muted }]}
              testID={`comment-edit-${comment.id}`}
            >
              <Feather name="edit-2" size={12} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => onDelete(comment)}
              hitSlop={8}
              style={[styles.actionBtn, { backgroundColor: colors.muted }]}
              testID={`comment-delete-${comment.id}`}
            >
              <Feather name="trash-2" size={12} color={colors.destructive} />
            </Pressable>
          </View>
        )}
      </View>

      {/* Body */}
      <Text style={[styles.commentBody, { color: colors.text }]}>{comment.comment}</Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RowCommentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall, user } = useAuth();
  const queryClient = useQueryClient();
  const scrollRef = useRef<ScrollView>(null);

  const params = useLocalSearchParams<{ tableId: string; rowId: string; tableName?: string }>();
  const tableId = Number(params.tableId);
  const rowId = Number(params.rowId);
  const tableName = params.tableName ?? "Row";

  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<BaserowComment | null>(null);
  const [editText, setEditText] = useState("");
  const [showNotifSheet, setShowNotifSheet] = useState(false);
  const [notifMode, setNotifMode] = useState<NotifMode>("all");

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  // ─── Queries ───────────────────────────────────────────────────────────────

  const commentsQuery = useQuery({
    queryKey: ["comments", tableId, rowId],
    queryFn: () => apiCall((c) => listComments(c, tableId, rowId)),
    enabled: Number.isFinite(tableId) && Number.isFinite(rowId),
    select: (data) => data.results ?? [],
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const postMutation = useMutation({
    mutationFn: (text: string) => apiCall((c) => createComment(c, tableId, rowId, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tableId, rowId] });
      setNewComment("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not post comment."),
  });

  const editMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: number; text: string }) =>
      apiCall((c) => updateComment(c, tableId, commentId, text)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", tableId, rowId] });
      setEditingComment(null);
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update comment."),
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => apiCall((c) => deleteComment(c, tableId, commentId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", tableId, rowId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not delete comment."),
  });

  const notifModeMutation = useMutation({
    mutationFn: (mode: NotifMode) => apiCall((c) => setRowCommentNotificationMode(c, tableId, rowId, mode)),
    onSuccess: (_, mode) => { setNotifMode(mode); setShowNotifSheet(false); },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update notification mode."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function confirmDelete(comment: BaserowComment) {
    Alert.alert("Delete comment?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(comment.id) },
    ]);
  }

  function startEdit(comment: BaserowComment) {
    setEditingComment(comment);
    setEditText(comment.comment);
  }

  function submitEdit() {
    if (!editingComment || !editText.trim()) return;
    editMutation.mutate({ commentId: editingComment.id, text: editText.trim() });
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const comments = commentsQuery.data ?? [];
  const currentUserId = user?.id ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Comments",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerRight: () => (
            <Pressable
              onPress={() => setShowNotifSheet(true)}
              hitSlop={8}
              style={{ paddingHorizontal: 4 }}
              testID="notification-mode-btn"
            >
              <Feather name={MODE_ICONS[notifMode]} size={18} color={colors.primary} />
            </Pressable>
          ),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingHorizontal: 4 }} testID="back-btn">
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {/* Row label */}
      <View style={[styles.rowLabel, { backgroundColor: colors.muted, borderBottomColor: colors.border }]}>
        <Feather name="database" size={12} color={colors.mutedForeground} />
        <Text style={[styles.rowLabelText, { color: colors.mutedForeground }]}>
          {tableName} · Row #{rowId}
        </Text>
      </View>

      {/* Comment list */}
      {commentsQuery.isLoading ? (
        <LoadingState />
      ) : commentsQuery.isError ? (
        <ErrorState
          title="Could not load comments"
          message={commentsQuery.error instanceof Error ? commentsQuery.error.message : undefined}
          onRetry={() => commentsQuery.refetch()}
        />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.commentList, { paddingBottom: bottomPad + 80 }]}
          keyboardShouldPersistTaps="handled"
          testID="comments-scroll"
        >
          {comments.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={40} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No comments yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Be the first to leave a comment on this row.</Text>
            </View>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                currentUserId={currentUserId}
                colors={colors}
                onEdit={startEdit}
                onDelete={confirmDelete}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Input area */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.inputArea, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
          {editingComment ? (
            /* Edit mode */
            <View style={{ flex: 1, gap: 8 }}>
              <View style={[styles.editBanner, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
                <Feather name="edit-2" size={12} color={colors.mutedForeground} />
                <Text style={[styles.editBannerText, { color: colors.mutedForeground }]}>Editing comment</Text>
                <Pressable onPress={() => setEditingComment(null)} hitSlop={8}>
                  <Feather name="x" size={14} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  placeholder="Edit comment…"
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus
                  testID="edit-comment-input"
                />
                <Pressable
                  style={[styles.sendBtn, { backgroundColor: editText.trim() ? colors.primary : colors.muted }]}
                  onPress={submitEdit}
                  disabled={!editText.trim() || editMutation.isPending}
                  testID="save-edit-btn"
                >
                  <Feather name="check" size={16} color={editText.trim() ? "#fff" : colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          ) : (
            /* New comment mode */
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={2000}
                placeholder="Add a comment…"
                placeholderTextColor={colors.mutedForeground}
                testID="new-comment-input"
              />
              <Pressable
                style={[styles.sendBtn, { backgroundColor: newComment.trim() ? colors.primary : colors.muted }]}
                onPress={() => { if (newComment.trim()) postMutation.mutate(newComment.trim()); }}
                disabled={!newComment.trim() || postMutation.isPending}
                testID="send-comment-btn"
              >
                <Feather name="send" size={16} color={newComment.trim() ? "#fff" : colors.mutedForeground} />
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Notification mode bottom sheet */}
      {showNotifSheet && (
        <>
          <Pressable style={styles.overlay} onPress={() => setShowNotifSheet(false)} />
          <NotifModeSheet
            current={notifMode}
            colors={colors}
            onSelect={(mode) => notifModeMutation.mutate(mode)}
            onClose={() => setShowNotifSheet(false)}
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  rowLabel: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  rowLabelText: { fontSize: 12, fontWeight: "500" },
  commentList: { gap: 10, padding: 14 },
  commentCard: { padding: 12, borderWidth: 1, gap: 8 },
  commentHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  commentAuthor: { fontSize: 13, fontWeight: "600" },
  commentTime: { fontSize: 11, marginTop: 1 },
  commentActions: { flexDirection: "row", gap: 6 },
  actionBtn: { padding: 5, borderRadius: 6 },
  commentBody: { fontSize: 14, lineHeight: 20 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "600", marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  inputArea: { padding: 12, borderTopWidth: 1, gap: 8 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: { flex: 1, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 40, maxHeight: 120 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  editBanner: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8 },
  editBannerText: { flex: 1, fontSize: 12, fontWeight: "500" },
  // Notification mode sheet
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 16, fontWeight: "700" },
  modeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 0.5 },
  modeLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  cancelBtn: { padding: 16, alignItems: "center", borderTopWidth: 1 },
  cancelText: { fontSize: 15, fontWeight: "500" },
});
