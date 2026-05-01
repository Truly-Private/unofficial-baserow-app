import * as React from "react";
/**
 * NotificationsScreen — full Baserow notifications management.
 * Two tabs:
 *   1. Notifications — list, mark read/unread, mark all read, delete
 *   2. Push Settings — local push notification preferences
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  clearWorkspaceNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  listWorkspaces,
  type BaserowNotification,
} from "@/lib/baserow";

type NotificationTab = "notifications" | "settings";


// ─── Notification row ───────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationIcon(type: string): keyof typeof Feather.glyphMap {
  if (type.includes("comment") || type.includes("mention")) return "message-circle";
  if (type.includes("automation") || type.includes("workflow")) return "zap";
  if (type.includes("invitation") || type.includes("invite")) return "mail";
  if (type.includes("share") || type.includes("access")) return "share";
  return "bell";
}

function notificationColor(type: string, colors: { primary: string; muted: string; mutedForeground: string }): string {
  if (type.includes("comment") || type.includes("mention")) return "#8b5cf6";
  if (type.includes("automation") || type.includes("workflow")) return "#f59e0b";
  if (type.includes("invitation") || type.includes("invite")) return "#3b82f6";
  return colors.primary;
}

function NotificationRow({
  notification,
  workspaceId,
  onRefresh,
  colors,
}: {
  notification: BaserowNotification;
  workspaceId: number;
  onRefresh: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const creds = useCreds();
  const queryClient = useQueryClient();

  const markMutation = useMutation({
    mutationFn: () => markNotificationRead(creds, workspaceId, notification.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
      onRefresh();
    },
  });

  const typeLabel = notification.type ?? "notification";
  const notificationData = notification.data ?? {};
  const title = typeof notificationData["title"] == "string" ? notificationData["title"] : null;
  const message = typeof notificationData["message"] == "string" ? notificationData["message"] : null;
  const senderName = notification.sender?.first_name ?? notification.sender?.username ?? null;
  const isRead = Boolean(notification.read);

  const icon = notificationIcon(typeLabel);
  const iconColor = notificationColor(typeLabel, colors);

  return (
    <View
      style={[
        styles.notifRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          borderLeftWidth: 3,
          borderLeftColor: isRead ? "transparent" : colors.primary,
        },
      ]}
      data-testid={`notif-row-${notification.id}`}
    >
      <View style={[styles.notifIconWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={14} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.notifHeader}>
          <Text
            style={[
              styles.notifTitle,
              { color: isRead ? colors.mutedForeground : colors.text },
              !isRead && styles.notifTitleUnread,
            ]}
            numberOfLines={1}
          >
            {title || typeLabel.replace(/_/g, " ")}
          </Text>
          <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
            {timeAgo(notification.created_on)}
          </Text>
        </View>
        {message ? (
          <Text style={[styles.notifMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
            {message}
          </Text>
        ) : null}
        {senderName && (
          <Text style={[styles.notifSender, { color: colors.mutedForeground }]}>
            by {senderName}
          </Text>
        )}
      </View>
      {!isRead ? (
        <Pressable
          style={[styles.notifAction, { backgroundColor: colors.muted }]}
          onPress={() => markMutation.mutate()}
          disabled={markMutation.isPending}
          hitSlop={8}
          data-testid={`notif-mark-read-${notification.id}`}
          accessibilityLabel={`Mark notification ${notification.id} as read`}
        >
          <Feather name="bell" size={14} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ─── Notifications tab ───────────────────────────────────────────────────────

function NotificationsTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { apiCall } = useAuth();
  const creds = useCreds();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [loadedNotifications, setLoadedNotifications] = useState<BaserowNotification[]>([]);
  const PAGE_SIZE = 30;
  const [selectedWsId, setSelectedWsId] = useState<number | null>(null);
  const [wsPickerOpen, setWsPickerOpen] = useState(false);

  // Fetch workspaces for the workspace selector
  const wsQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
  });

  const workspaceId = selectedWsId ?? wsQuery.data?.[0]?.id ?? 0;

  const notifQuery = useQuery({
    queryKey: ["notifications", workspaceId, page],
    queryFn: () => listNotifications(creds, workspaceId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    enabled: workspaceId > 0,
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(creds, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
      setPage(0);
      setLoadedNotifications([]);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearWorkspaceNotifications(creds, workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", workspaceId] });
      setPage(0);
      setLoadedNotifications([]);
    },
  });

  const pageResults = notifQuery.data?.results ?? [];
  const total = notifQuery.data?.count ?? 0;
  const notifications = loadedNotifications.length > 0 || page > 0 ? loadedNotifications : pageResults;
  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasMore = notifications.length < total;

  const selectedWs = wsQuery.data?.find((ws) => ws.id === workspaceId);

  React.useEffect(() => {
    if (!notifQuery.data) return;
    if (page === 0) {
      setLoadedNotifications(pageResults);
      return;
    }
    setLoadedNotifications((current) => {
      const seen = new Set(current.map((n) => n.id));
      const merged = [...current];
      for (const item of pageResults) {
        if (!seen.has(item.id)) merged.push(item);
      }
      return merged;
    });
  }, [notifQuery.data, page, pageResults]);

  return (
    <>
      {/* Workspace selector + actions bar */}
      <View style={[styles.notifBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.wsPicker, { backgroundColor: colors.muted, borderColor: colors.border }]}
          onPress={() => setWsPickerOpen(!wsPickerOpen)}
          data-testid="ws-picker-btn"
        >
          <Feather name="grid" size={12} color={colors.mutedForeground} />
          <Text style={[styles.wsPickerText, { color: colors.text }]} numberOfLines={1}>
            {selectedWs?.name ?? "Select workspace"}
          </Text>
          <Feather name={wsPickerOpen ? "chevron-up" : "chevron-down"} size={12} color={colors.mutedForeground} />
        </Pressable>

        {wsPickerOpen && (
          <View style={[styles.wsDropdown, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
            {wsQuery.data?.map((ws) => (
              <Pressable
                key={ws.id}
                style={[styles.wsDropdownItem, { borderBottomColor: colors.border }]}
                onPress={() => { setSelectedWsId(ws.id); setWsPickerOpen(false); setPage(0); setLoadedNotifications([]); }}
                data-testid={`ws-option-${ws.id}`}
              >
                <Text style={[styles.wsDropdownText, { color: ws.id === workspaceId ? colors.primary : colors.text }]}>
                  {ws.name}
                </Text>
                {ws.id === workspaceId && <Feather name="check" size={14} color={colors.primary} />}
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.notifActions}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={() => { setLoadedNotifications([]); setPage(0); notifQuery.refetch(); }}
            hitSlop={8}
            data-testid="refresh-notifs"
          >
            <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
          </Pressable>
          {unreadCount > 0 && (
            <Pressable
              style={[styles.markAllBtn, { backgroundColor: colors.primary }]}
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              data-testid="mark-all-read"
            >
              <Feather name="bell-off" size={12} color="#fff" />
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
          {notifications.length > 0 && (
            <Pressable
              style={[styles.clearBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
              onPress={() => clearMutation.mutate()}
              disabled={clearMutation.isPending}
              data-testid="clear-notifs"
            >
              <Feather name="trash-2" size={12} color={colors.mutedForeground} />
              <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Notification list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={notifQuery.isFetching && !notifQuery.isLoading}
            onRefresh={() => { setLoadedNotifications([]); setPage(0); notifQuery.refetch(); }}
            tintColor={colors.primary}
          />
        }
      >
        {notifQuery.isLoading ? (
          <LoadingState />
        ) : notifQuery.isError ? (
          <ErrorState
            message={notifQuery.error instanceof Error ? notifQuery.error.message : "Failed to load"}
            onRetry={() => { setLoadedNotifications([]); setPage(0); notifQuery.refetch(); }}
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No Notifications"
            description="You're all caught up! New notifications will appear here."
          />
        ) : (
          <View style={styles.notifList}>
            {unreadCount > 0 && (
              <Text style={[styles.unreadLabel, { color: colors.primary }]}>
                {unreadCount} unread
              </Text>
            )}
            {notifications.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                workspaceId={workspaceId}
                onRefresh={() => { setLoadedNotifications([]); setPage(0); notifQuery.refetch(); }}
                colors={colors}
              />
            ))}
            {hasMore && (
              <Pressable
                style={[styles.loadMore, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                onPress={() => setPage((p) => p + 1)}
                disabled={notifQuery.isFetching}
                data-testid="load-more-notifs"
              >
                <Text style={[styles.loadMoreText, { color: colors.primary }]}>
                  Load more
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

// ─── Push Settings tab (existing UI) ─────────────────────────────────────────

function PushSettingsTab({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { hasPermission, expoPushToken, settings, updateSettings } = usePushNotifications();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {/* Permission Status */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>PERMISSION STATUS</Text>
        <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Push Notifications</Text>
            <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
              {hasPermission ? "Enabled" : "Tap to enable in your device settings"}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: hasPermission ? "#22c55e" : "#ef4444" }]}>
            <Text style={styles.badgeText}>{hasPermission ? "ON" : "OFF"}</Text>
          </View>
        </View>
        {expoPushToken && (
          <View style={[styles.tokenContainer, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tokenLabel, { color: colors.mutedForeground }]}>Device Token</Text>
            <Text style={[styles.tokenValue, { color: colors.foreground }]} numberOfLines={2}>
              {expoPushToken.substring(0, 40)}...
            </Text>
          </View>
        )}
      </View>

      {/* Notification Types */}
      <View style={[styles.section, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>NOTIFICATION TYPES</Text>
        <PushToggle title="Table Updates" subtitle="Get notified when rows are added or modified" value={settings.tableUpdates} onValueChange={(v) => updateSettings({ tableUpdates: v })} colors={colors} testId="push-toggle-table-updates" />
        <PushToggle title="Mentions" subtitle="Get alerted when someone mentions you" value={settings.mentionAlerts} onValueChange={(v) => updateSettings({ mentionAlerts: v })} colors={colors} testId="push-toggle-mentions" />
        <PushToggle title="Weekly Digest" subtitle="Summary of your Baserow activity" value={settings.weeklyDigest} onValueChange={(v) => updateSettings({ weeklyDigest: v })} colors={colors} testId="push-toggle-weekly-digest" />
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          To receive notifications, make sure push notifications are enabled for this app in your device settings.
        </Text>
      </View>
    </ScrollView>
  );
}

function PushToggle({ title, subtitle, value, onValueChange, colors, testId }: {
  title: string; subtitle: string; value: boolean;
  onValueChange: (v: boolean) => void; colors: ReturnType<typeof useColors>; testId: string;
}) {
  return (
    <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <Switch testID={testId} value={value} onValueChange={onValueChange} trackColor={{ false: colors.muted, true: colors.primary }} thumbColor="#fff" />
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<NotificationTab>("notifications");

  return (
    <>
      <Stack.Screen
        options={{ title: "Notifications", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }}
      />
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {/* Tab switcher */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.tab, activeTab === "notifications" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("notifications")}
            data-testid="tab-notifications"
          >
            <Feather name="bell" size={15} color={activeTab === "notifications" ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === "notifications" ? colors.primary : colors.mutedForeground }]}>Notifications</Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === "settings" && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab("settings")}
            data-testid="tab-settings"
          >
            <Feather name="settings" size={15} color={activeTab === "settings" ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: activeTab === "settings" ? colors.primary : colors.mutedForeground }]}>Push Settings</Text>
          </Pressable>
        </View>

        {activeTab === "notifications" ? (
          <NotificationsTab colors={colors} />
        ) : (
          <PushSettingsTab colors={colors} />
        )}
      </View>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, gap: 6 },
  tabText: { fontSize: 14, fontWeight: "600" },
  notifBar: { flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, gap: 8, zIndex: 10 },
  wsPicker: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, gap: 4, flex: 1 },
  wsPickerText: { fontSize: 13, fontWeight: "500", flex: 1 },
  wsDropdown: { position: "absolute", top: 52, left: 12, right: 12, borderWidth: 1, zIndex: 100, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8 },
  wsDropdownItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 0.5 },
  wsDropdownText: { fontSize: 14, fontWeight: "500" },
  notifActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtn: { padding: 6, borderRadius: 6 },
  markAllBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  markAllText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  clearBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, borderWidth: 1 },
  clearBtnText: { fontSize: 12, fontWeight: "600" },
  notifList: { gap: 8 },
  unreadLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  notifRow: { flexDirection: "row", alignItems: "flex-start", padding: 12, borderWidth: 1, gap: 10 },
  notifIconWrap: { width: 30, height: 30, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 2 },
  notifTitle: { fontSize: 14, fontWeight: "500", flex: 1 },
  notifTitleUnread: { fontWeight: "700" },
  notifTime: { fontSize: 11 },
  notifMessage: { fontSize: 13, lineHeight: 18 },
  notifSender: { fontSize: 11, marginTop: 2 },
  notifAction: { padding: 6, borderRadius: 6 },
  loadMore: { alignItems: "center", padding: 12, marginTop: 8, borderWidth: 1 },
  loadMoreText: { fontSize: 13, fontWeight: "600" },
  section: { marginTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 12, fontWeight: "600", marginBottom: 10, letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1 },
  rowTitle: { fontSize: 15, fontWeight: "500" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  tokenContainer: { marginTop: 10, padding: 12, borderRadius: 8 },
  tokenLabel: { fontSize: 11, fontWeight: "500", marginBottom: 4 },
  tokenValue: { fontSize: 11, fontFamily: "monospace" },
  toggleRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  infoSection: { marginTop: 20, paddingHorizontal: 4 },
  infoText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
