import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { Endpoints } from "../api/endpoints";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  NotificationRecipient,
} from "../api/database";

type Props = {
  workspaceId: number;
  onBack?: () => void;
  onNotificationPress?: (n: NotificationRecipient) => void;
};

const NOTIFICATION_ICONS: Record<string, string> = {
  "comment": "💬",
  "mention": "🏷",
  "assign": "👤",
  "update": "✏️",
  "webhook": "🪝",
  "automation": "⚙️",
  "default": "🔔",
};

function getNotificationIcon(type: string): string {
  const key = Object.keys(NOTIFICATION_ICONS).find((k) =>
    type.toLowerCase().includes(k),
  );
  return key ? NOTIFICATION_ICONS[key] : NOTIFICATION_ICONS["default"];
}

function getNotificationTitle(n: NotificationRecipient): string {
  const sender = n.sender?.first_name || n.sender?.username || "Someone";
  const type = n.type?.toLowerCase() || "";
  if (type.includes("comment")) return `${sender} commented`;
  if (type.includes("mention")) return `${sender} mentioned you`;
  if (type.includes("assign")) return `${sender} assigned you`;
  if (type.includes("webhook")) return `Webhook triggered`;
  if (type.includes("automation")) return `Automation ran`;
  return `Notification from ${sender}`;
}

function getNotificationPreview(n: NotificationRecipient): string {
  if (typeof n.data === "object" && n.data !== null) {
    return n.data.message || n.data.text || n.data.body || JSON.stringify(n.data);
  }
  return String(n.data ?? "");
}

export const NotificationsScreen: React.FC<Props> = ({
  workspaceId,
  onBack,
  onNotificationPress,
}) => {
  const { apiCall } = useAuth();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", workspaceId],
    queryFn: () => apiCall((c) => c.get(Endpoints.notifications.list(workspaceId))),
  });

  const notifications: NotificationRecipient[] = data?.results ?? [];

  const markReadMut = useMutation({
    mutationFn: (notificationId: number) =>
      apiCall((c) =>
        c.patch(Endpoints.notifications.markRead(workspaceId, notificationId), { read: true }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", workspaceId] }),
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to mark as read"),
  });

  const markAllReadMut = useMutation({
    mutationFn: () =>
      apiCall((c) => c.post(Endpoints.notifications.markAllRead(workspaceId))),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", workspaceId] }),
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to mark all as read"),
  });

  const deleteMut = useMutation({
    mutationFn: (notificationId: number) =>
      apiCall((c) =>
        c.delete(Endpoints.notifications.markRead(workspaceId, notificationId)),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", workspaceId] }),
    onError: (err: any) => Alert.alert("Error", err?.message ?? "Failed to delete notification"),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ["notifications", workspaceId] });
    setRefreshing(false);
  };

  const handleNotificationPress = (n: NotificationRecipient) => {
    if (!n.read) markReadMut.mutate(n.id);
    onNotificationPress?.(n);
  };

  const confirmDelete = (n: NotificationRecipient) => {
    Alert.alert(
      "Delete Notification",
      "Are you sure you want to delete this notification?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMut.mutate(n.id),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: NotificationRecipient }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.read && styles.notifCardUnread]}
      onPress={() => handleNotificationPress(item)}
      testID={`notification-${item.id}`}
    >
      <View style={styles.notifIcon}>
        <Text style={styles.notifIconText}>{getNotificationIcon(item.type)}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifHeader}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
            {getNotificationTitle(item)}
          </Text>
          {!item.read && <View style={styles.unreadDot} testID={`unread-${item.id}`} />}
        </View>
        <Text style={styles.notifPreview} numberOfLines={2}>
          {getNotificationPreview(item)}
        </Text>
        <Text style={styles.notifDate}>
          {new Date(item.created_on).toLocaleDateString()} at{" "}
          {new Date(item.created_on).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => confirmDelete(item)}
        testID={`notification-delete-${item.id}`}
      >
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} testID="back-btn">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllBtn}
            onPress={() => markAllReadMut.mutate()}
            disabled={markAllReadMut.isPending}
            testID="mark-all-read-btn"
          >
            <Text style={styles.markAllBtnText}>
              {markAllReadMut.isPending ? "..." : `Mark all read (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {isLoading && !refreshing ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>Failed to load notifications.</Text>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
          <Text style={styles.emptySubtext}>No notifications right now.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          testID="notifications-list"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backText: { fontSize: 16, color: "#007AFF", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  markAllBtn: { padding: 4 },
  markAllBtnText: { fontSize: 13, color: "#007AFF", fontWeight: "600" },
  loader: { marginTop: 40 },
  errorText: { textAlign: "center", marginTop: 40, color: "red" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#333" },
  emptySubtext: { fontSize: 14, color: "#888", marginTop: 4 },
  listContent: { padding: 16 },
  notifCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notifIconText: { fontSize: 18 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  notifTitle: { fontSize: 15, color: "#555", fontWeight: "500" },
  notifTitleUnread: { fontWeight: "700", color: "#1a1a1a" },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
    marginLeft: 6,
  },
  notifPreview: { fontSize: 13, color: "#888", lineHeight: 18, marginBottom: 4 },
  notifDate: { fontSize: 12, color: "#aaa" },
  deleteBtn: {
    padding: 4,
    marginLeft: 4,
    marginTop: -2,
  },
  deleteBtnText: { fontSize: 16, color: "#ccc" },
});
