/**
 * AdminScreen — full instance admin panel for Baserow.
 * Covers: Dashboard, Users, Workspaces, Audit Log, Data Scanner, Auth Providers.
 * Requires Baserow superuser/admin privileges.
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tabs } from "react-native-tab-view-ui";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  type BaserowAdminDashboard,
  type BaserowAdminUser,
  type BaserowAdminUserCreate,
  type BaserowAdminUserUpdate,
  type BaserowAdminWorkspace,
  type BaserowAuditLog,
  type BaserowAuditLogActionType,
  type BaserowAuthProvider,
  type BaserowDataScan,
  type BaserowDataScanCreate,
  type BaserowDataScanResult,
  createAdminUser,
  createAuthProvider,
  createDataScan,
  deleteAdminUser,
  deleteAdminWorkspace,
  deleteAuthProvider,
  deleteDataScan,
  deleteDataScanResult,
  exportAuditLog,
  exportDataScanResults,
  getAdminDashboard,
  getAuthProvider,
  getDataScan,
  impersonateAdminUser,
  listAdminUsers,
  listAdminWorkspaces,
  listAdminWorkspaceOptions,
  listAuditLog,
  listAuditLogActionTypes,
  listAuthProviders,
  listDataScanResults,
  listDataScans,
  triggerDataScan,
  updateAdminUser,
  updateAuthProvider,
  updateDataScan,
} from "@/lib/admin";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useAdminQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  enabled = true,
) {
  return useQuery({ queryKey, queryFn, enabled, retry: 1 });
}

function StatCard({
  label,
  value,
  change,
  colors,
}: {
  label: string;
  value: string | number;
  change?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      {change && (
        <Text style={[styles.statChange, { color: colors.primary }]}>
          {change}
        </Text>
      )}
    </View>
  );
}

function SectionHeader({
  title,
  action,
  colors,
}: {
  title: string;
  action?: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {title.toUpperCase()}
      </Text>
      {action}
    </View>
  );
}

function RowCard({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.rowCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.divider, { backgroundColor: colors.border }]} />
  );
}

function Badge({
  label,
  variant,
  colors,
}: {
  label: string;
  variant: "success" | "warning" | "danger" | "info";
  colors: ReturnType<typeof useColors>;
}) {
  const colors_map = {
    success: colors.primary,
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#6366f1",
  };
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors_map[variant] + "20" },
      ]}
    >
      <Text style={[styles.badgeText, { color: colors_map[variant] }]}>
        {label}
      </Text>
    </View>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const query = useAdminQuery(
    ["admin-dashboard"],
    () => apiCall((c) => getAdminDashboard(c)),
  );

  if (query.isLoading) return <LoadingState colors={colors} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} colors={colors} />;

  const d: BaserowAdminDashboard | undefined = query.data;

  const p = (now: number, prev: number) => {
    if (!prev) return null;
    const pct = ((now - prev) / prev) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
      }
    >
      <SectionHeader title="Overview" colors={colors} />
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={d?.total_users ?? "—"}
          colors={colors}
        />
        <StatCard
          label="Total Workspaces"
          value={d?.total_workspaces ?? "—"}
          colors={colors}
        />
        <StatCard
          label="Total Applications"
          value={d?.total_applications ?? "—"}
          colors={colors}
        />
      </View>

      <SectionHeader title="New Users" colors={colors} />
      <View style={styles.statsGrid}>
        <StatCard
          label="Last 24h"
          value={d?.new_users_last_24_hours ?? "—"}
          change={p(d?.new_users_last_24_hours ?? 0, d?.previous_new_users_last_24_hours ?? 0) ?? undefined}
          colors={colors}
        />
        <StatCard
          label="Last 7d"
          value={d?.new_users_last_7_days ?? "—"}
          change={p(d?.new_users_last_7_days ?? 0, d?.previous_new_users_last_7_days ?? 0) ?? undefined}
          colors={colors}
        />
        <StatCard
          label="Last 30d"
          value={d?.new_users_last_30_days ?? "—"}
          change={p(d?.new_users_last_30_days ?? 0, d?.previous_new_users_last_30_days ?? 0) ?? undefined}
          colors={colors}
        />
      </View>

      <SectionHeader title="Active Users" colors={colors} />
      <View style={styles.statsGrid}>
        <StatCard
          label="Last 24h"
          value={d?.active_users_last_24_hours ?? "—"}
          change={p(d?.active_users_last_24_hours ?? 0, d?.previous_active_users_last_24_hours ?? 0) ?? undefined}
          colors={colors}
        />
        <StatCard
          label="Last 7d"
          value={d?.active_users_last_7_days ?? "—"}
          change={p(d?.active_users_last_7_days ?? 0, d?.previous_active_users_last_7_days ?? 0) ?? undefined}
          colors={colors}
        />
        <StatCard
          label="Last 30d"
          value={d?.active_users_last_30_days ?? "—"}
          change={p(d?.active_users_last_30_days ?? 0, d?.previous_active_users_last_30_days ?? 0) ?? undefined}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<BaserowAdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const query = useAdminQuery(
    ["admin-users", page, search],
    () => apiCall((c) => listAdminUsers(c, { page, page_size: 20, search: search || undefined })),
  );

  const createMut = useMutation({
    mutationFn: (payload: BaserowAdminUserCreate) =>
      apiCall((c) => createAdminUser(c, payload)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setCreateOpen(false); },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BaserowAdminUserUpdate }) =>
      apiCall((c) => updateAdminUser(c, id, payload)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditUser(null); },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteAdminUser(c, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const impersonateMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => impersonateAdminUser(c, id)),
    onSuccess: (data) => {
      Alert.alert("Impersonation", `Access token obtained. In a multi-user app this would switch the active session to user ID ${JSON.stringify(data).slice(0, 80)}...`);
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const users = query.data?.results ?? [];
  const totalPages = query.data ? Math.ceil(query.data.count / 20) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Search + Create */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Search users…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
        />
        <Button title="+ New" onPress={() => setCreateOpen(true)} size="sm" style={{ marginLeft: 8 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
        }
      >
        {query.isLoading ? (
          <LoadingState colors={colors} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} colors={colors} />
        ) : users.length === 0 ? (
          <EmptyState message="No users found." icon="users" colors={colors} />
        ) : (
          users.map((user) => (
            <RowCard key={user.id} colors={colors}>
              <Pressable onPress={() => setEditUser(user)} style={styles.rowPressable}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{user.name || user.username}</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{user.username}</Text>
                  <View style={styles.rowBadges}>
                    {user.is_active ? (
                      <Badge label="Active" variant="success" colors={colors} />
                    ) : (
                      <Badge label="Inactive" variant="warning" colors={colors} />
                    )}
                    {user.is_staff && <Badge label="Staff" variant="info" colors={colors} />}
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <Divider colors={colors} />
              <View style={styles.rowActions}>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => {
                    Alert.alert("Impersonate", `Impersonate ${user.username}?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Impersonate", onPress: () => impersonateMut.mutate(user.id) },
                    ]);
                  }}
                >
                  <Feather name="user" size={16} color={colors.primary} />
                  <Text style={[styles.rowActionText, { color: colors.primary }]}>Impersonate</Text>
                </Pressable>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => {
                    Alert.alert("Delete User", `Delete ${user.username}? This cannot be undone.`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(user.id) },
                    ]);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={[styles.rowActionText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </RowCard>
          ))
        )}
      </ScrollView>

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border }]}>
          <Button title="← Prev" size="sm" variant="ghost" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
          <Text style={{ color: colors.mutedForeground }}>{page} / {totalPages}</Text>
          <Button title="Next →" size="sm" variant="ghost" disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} />
        </View>
      )}

      {/* Create User Modal */}
      <Modal visible={createOpen} animationType="slide" transparent>
        <UserFormModal
          colors={colors}
          onSubmit={(payload) => createMut.mutate(payload)}
          onClose={() => setCreateOpen(false)}
          submitting={createMut.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal visible={!!editUser} animationType="slide" transparent>
        {editUser && (
          <UserFormModal
            colors={colors}
            initial={editUser}
            onSubmit={(payload) => updateMut.mutate({ id: editUser.id, payload })}
            onClose={() => setEditUser(null)}
            submitting={updateMut.isPending}
          />
        )}
      </Modal>
    </View>
  );
}

function UserFormModal({
  colors,
  initial,
  onSubmit,
  onClose,
  submitting,
}: {
  colors: ReturnType<typeof useColors>;
  initial?: BaserowAdminUser;
  onSubmit: (p: BaserowAdminUserCreate | BaserowAdminUserUpdate) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [isStaff, setIsStaff] = useState(initial?.is_staff ?? false);

  const submit = () => {
    if (!username.trim()) { Alert.alert("Error", "Username is required"); return; }
    if (!initial && !password) { Alert.alert("Error", "Password is required for new users"); return; }
    const payload: BaserowAdminUserCreate | BaserowAdminUserUpdate = {
      username: username.trim(),
      name: name.trim() || undefined,
      is_active: isActive,
      is_staff: isStaff,
      ...(password ? { password } : {}),
    };
    onSubmit(payload as never);
  };

  return (
    <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
      <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {initial ? "Edit User" : "Create User"}
          </Text>
          <Pressable onPress={onClose}><Feather name="x" size={20} color={colors.foreground} /></Pressable>
        </View>
        <ScrollView style={{ maxHeight: 500 }}>
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Username *</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={username}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Display Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.mutedForeground}
            />
            {!initial && (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Password *</Text>
                <TextInput
                  style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry
                />
              </>
            )}
            <Pressable style={styles.toggleRow} onPress={() => setIsActive(!isActive)}>
              <Text style={{ color: colors.foreground }}>Active</Text>
              <View style={[styles.toggle, { borderColor: colors.primary }]}>
                {isActive && <View style={[styles.toggleDot, { backgroundColor: colors.primary }]} />}
              </View>
            </Pressable>
            <Pressable style={styles.toggleRow} onPress={() => setIsStaff(!isStaff)}>
              <Text style={{ color: colors.foreground }}>Staff (superuser)</Text>
              <View style={[styles.toggle, { borderColor: colors.primary }]}>
                {isStaff && <View style={[styles.toggleDot, { backgroundColor: colors.primary }]} />}
              </View>
            </Pressable>
          </View>
        </ScrollView>
        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <Button title="Cancel" variant="ghost" onPress={onClose} />
          <Button title={submitting ? "Saving…" : "Save"} onPress={submit} disabled={submitting} />
        </View>
      </View>
    </View>
  );
}

// ─── Workspaces Tab ──────────────────────────────────────────────────────────

function WorkspacesTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const query = useAdminQuery(
    ["admin-workspaces", page, search],
    () => apiCall((c) => listAdminWorkspaces(c, { page, page_size: 20, search: search || undefined })),
  );

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteAdminWorkspace(c, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-workspaces"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const workspaces: BaserowAdminWorkspace[] = query.data?.results ?? [];
  const totalPages = query.data ? Math.ceil(query.data.count / 20) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Search workspaces…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={(t) => { setSearch(t); setPage(1); }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
        }
      >
        {query.isLoading ? (
          <LoadingState colors={colors} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} colors={colors} />
        ) : workspaces.length === 0 ? (
          <EmptyState message="No workspaces found." icon="grid" colors={colors} />
        ) : (
          workspaces.map((ws) => (
            <RowCard key={ws.id} colors={colors}>
              <View style={styles.rowPressable}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{ws.name}</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    {ws.application_count} apps · {ws.row_count.toLocaleString()} rows · {ws.users.length} users
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    Created {new Date(ws.created_on).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Divider colors={colors} />
              <View style={styles.rowBadges}>
                <Badge label={`${ws.seats_taken} seats`} variant="info" colors={colors} />
                {ws.storage_usage > 0 && (
                  <Badge label={`${(ws.storage_usage / 1024 / 1024).toFixed(1)} MB`} variant="success" colors={colors} />
                )}
              </View>
              <Divider colors={colors} />
              <View style={styles.rowActions}>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => {
                    Alert.alert("Delete Workspace", `Delete workspace "${ws.name}"? All data will be permanently removed.`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(ws.id) },
                    ]);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={[styles.rowActionText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </RowCard>
          ))
        )}
      </ScrollView>

      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border }]}>
          <Button title="← Prev" size="sm" variant="ghost" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
          <Text style={{ color: colors.mutedForeground }}>{page} / {totalPages}</Text>
          <Button title="Next →" size="sm" variant="ghost" disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} />
        </View>
      )}
    </View>
  );
}

// ─── Audit Log Tab ───────────────────────────────────────────────────────────

function AuditLogTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterUser, setFilterUser] = useState("");
  const [filterWorkspace, setFilterWorkspace] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [exportUrl, setExportUrl] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const actionTypesQ = useAdminQuery(
    ["audit-log-action-types"],
    () => apiCall((c) => listAuditLogActionTypes(c)),
  );

  const query = useAdminQuery(
    ["audit-log", page, filterUser, filterWorkspace, filterAction],
    () => apiCall((c) =>
      listAuditLog(c, {
        page,
        page_size: 30,
        user_id: filterUser ? Number(filterUser) : undefined,
        workspace_id: filterWorkspace ? Number(filterWorkspace) : undefined,
        action_type: filterAction || undefined,
      }),
    ),
  );

  const exportMut = useMutation({
    mutationFn: () => {
      if (!exportUrl) throw new Error("Export URL is required");
      return apiCall((c) =>
        exportAuditLog(c, {
          url: exportUrl,
          filter_user_id: filterUser ? Number(filterUser) : undefined,
          filter_workspace_id: filterWorkspace ? Number(filterWorkspace) : undefined,
          filter_action_type: filterAction || undefined,
        }),
      );
    },
    onSuccess: (job) => {
      Alert.alert("Export started", `Job ${job.id} will produce a CSV at the provided URL when complete.`);
      qc.invalidateQueries({ queryKey: ["audit-log"] });
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const logs: BaserowAuditLog[] = query.data?.results ?? [];
  const totalPages = query.data ? Math.ceil(query.data.count / 30) : 0;
  const actionTypes = actionTypesQ.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border, flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingVertical: 8 }]}>
        <Pressable
          style={[styles.filterToggle, { backgroundColor: showFilters ? colors.primary : colors.card, borderColor: colors.border }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather name="filter" size={14} color={showFilters ? "#fff" : colors.foreground} />
          <Text style={{ color: showFilters ? "#fff" : colors.foreground, fontSize: 13, marginLeft: 4 }}>
            Filters
          </Text>
        </Pressable>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border, flex: 1, minWidth: 120 }]}
          placeholder="User ID…"
          placeholderTextColor={colors.mutedForeground}
          value={filterUser}
          onChangeText={(t) => { setFilterUser(t); setPage(1); }}
          keyboardType="number-pad"
        />
        <Button
          title="Export"
          size="sm"
          variant="ghost"
          onPress={() => {
            Alert.prompt?.("Export URL", "URL to POST the CSV to:", [
              { text: "Cancel", style: "cancel" },
              { text: "Export", onPress: (url) => { if (url) { setExportUrl(url); exportMut.mutate(); } } },
            ]) ?? Alert.alert("Export", "Configure an export URL in the API call to download the audit log as CSV.");
          }}
        />
      </View>

      {/* Expanded Filters */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="Workspace ID…"
            placeholderTextColor={colors.mutedForeground}
            value={filterWorkspace}
            onChangeText={(t) => { setFilterWorkspace(t); setPage(1); }}
            keyboardType="number-pad"
          />
          {actionTypes.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {actionTypes.map((at) => (
                <Pressable
                  key={at.id}
                  style={[
                    styles.chip,
                    { backgroundColor: filterAction === at.id ? colors.primary : colors.background, borderColor: colors.border },
                  ]}
                  onPress={() => { setFilterAction(filterAction === at.id ? "" : at.id); setPage(1); }}
                >
                  <Text style={{ color: filterAction === at.id ? "#fff" : colors.foreground, fontSize: 12 }}>
                    {at.value}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        refreshControl={
          <RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />
        }
      >
        {query.isLoading ? (
          <LoadingState colors={colors} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} colors={colors} />
        ) : logs.length === 0 ? (
          <EmptyState message="No audit log entries." icon="activity" colors={colors} />
        ) : (
          logs.map((log) => (
            <RowCard key={log.id} colors={colors}>
              <View style={styles.rowPressable}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{log.description}</Text>
                  <View style={styles.rowBadges}>
                    <Badge label={log.action_type} variant="info" colors={colors} />
                    {log.workspace && (
                      <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                        {log.workspace.name}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              <Divider colors={colors} />
              <View style={{ flexDirection: "row", gap: 16 }}>
                {log.user && (
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    👤 {log.user.username}
                  </Text>
                )}
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  🕐 {new Date(log.timestamp).toLocaleString()}
                </Text>
                {log.ip_address && (
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    🌐 {log.ip_address}
                  </Text>
                )}
              </View>
            </RowCard>
          ))
        )}
      </ScrollView>

      {totalPages > 1 && (
        <View style={[styles.pagination, { borderTopColor: colors.border }]}>
          <Button title="← Prev" size="sm" variant="ghost" disabled={page <= 1} onPress={() => setPage((p) => p - 1)} />
          <Text style={{ color: colors.mutedForeground }}>{page} / {totalPages}</Text>
          <Button title="Next →" size="sm" variant="ghost" disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} />
        </View>
      )}
    </View>
  );
}

// ─── Data Scanner Tab ─────────────────────────────────────────────────────────

function DataScannerTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"scans" | "results">("scans");
  const [createOpen, setCreateOpen] = useState(false);

  const scansQ = useAdminQuery(
    ["data-scans"],
    () => apiCall((c) => listDataScans(c)),
  );

  const resultsQ = useAdminQuery(
    ["data-scan-results"],
    () => apiCall((c) => listDataScanResults(c)),
  );

  const triggerMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => triggerDataScan(c, id)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["data-scans"] }); Alert.alert("Scan triggered", "The scan is now running."); },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const deleteScanMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteDataScan(c, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-scans"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const deleteResultMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteDataScanResult(c, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["data-scan-results"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const scans: BaserowDataScan[] = scansQ.data?.results ?? [];
  const results: BaserowDataScanResult[] = resultsQ.data?.results ?? [];

  const subTabs = [
    { key: "scans", label: `Scans (${scans.length})` },
    { key: "results", label: `Results (${results.length})` },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Sub-tab switcher */}
      <View style={[styles.subTabs, { borderBottomColor: colors.border }]}>
        {subTabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.subTab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.subTabText,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
        {activeTab === "scans" && (
          <Button title="+ New Scan" size="sm" onPress={() => setCreateOpen(true)} style={{ marginLeft: "auto", marginRight: 12 }} />
        )}
      </View>

      {activeTab === "scans" ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.tabContent}
          refreshControl={<RefreshControl refreshing={scansQ.isFetching} onRefresh={scansQ.refetch} />}
        >
          {scansQ.isLoading ? <LoadingState colors={colors} /> :
           scansQ.isError ? <ErrorState error={scansQ.error} onRetry={scansQ.refetch} colors={colors} /> :
           scans.length === 0 ? <EmptyState message="No data scans configured." icon="search" colors={colors} /> :
           scans.map((scan) => (
            <RowCard key={scan.id} colors={colors}>
              <View style={styles.rowPressable}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{scan.name}</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                    {scan.scan_type} · {scan.pattern ?? "no pattern"} · {scan.is_running ? "🔄 Running" : "✅ Idle"}
                  </Text>
                  {scan.last_run_finished_at && (
                    <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                      Last run: {new Date(scan.last_run_finished_at).toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
              <Divider colors={colors} />
              <View style={styles.rowBadges}>
                <Badge label={`${scan.results_count} results`} variant="info" colors={colors} />
                {scan.is_running ? (
                  <Badge label="Running" variant="warning" colors={colors} />
                ) : (
                  <Badge label="Idle" variant="success" colors={colors} />
                )}
              </View>
              <Divider colors={colors} />
              <View style={styles.rowActions}>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => triggerMut.mutate(scan.id)}
                  disabled={triggerMut.isPending}
                >
                  <Feather name="play" size={16} color={colors.primary} />
                  <Text style={[styles.rowActionText, { color: colors.primary }]}>Run now</Text>
                </Pressable>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => {
                    Alert.alert("Delete Scan", `Delete scan "${scan.name}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteScanMut.mutate(scan.id) },
                    ]);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={[styles.rowActionText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </RowCard>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.tabContent}
          refreshControl={<RefreshControl refreshing={resultsQ.isFetching} onRefresh={resultsQ.refetch} />}
        >
          {resultsQ.isLoading ? <LoadingState colors={colors} /> :
           resultsQ.isError ? <ErrorState error={resultsQ.error} onRetry={resultsQ.refetch} colors={colors} /> :
           results.length === 0 ? <EmptyState message="No scan results yet." icon="check-circle" colors={colors} /> :
           results.map((result) => (
            <RowCard key={result.id} colors={colors}>
              <View>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                  "{result.matched_value}" in {result.field_name}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  {result.table_name} · Row {result.row_id}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  {result.workspace_name} / {result.database_name}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  First: {new Date(result.first_identified_on).toLocaleDateString()} · Last: {new Date(result.last_identified_on).toLocaleDateString()}
                </Text>
              </View>
              <Divider colors={colors} />
              <Pressable
                style={styles.rowAction}
                onPress={() => {
                  Alert.alert("Delete Result", `Dismiss this result?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Dismiss", style: "destructive", onPress: () => deleteResultMut.mutate(result.id) },
                  ]);
                }}
              >
                <Feather name="x" size={16} color="#ef4444" />
                <Text style={[styles.rowActionText, { color: "#ef4444" }]}>Dismiss</Text>
              </Pressable>
            </RowCard>
          ))}
        </ScrollView>
      )}

      {/* Create Scan Modal */}
      <Modal visible={createOpen} animationType="slide" transparent>
        <ScanFormModal
          colors={colors}
          apiCall={apiCall}
          onClose={() => setCreateOpen(false)}
        />
      </Modal>
    </View>
  );
}

function ScanFormModal({
  colors,
  apiCall,
  onClose,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [scanType, setScanType] = useState("pii_email");
  const [pattern, setPattern] = useState("");

  const createMut = useMutation({
    mutationFn: () => {
      const payload: BaserowDataScanCreate = {
        name: name.trim() || "Unnamed Scan",
        scan_type: scanType,
        pattern: pattern || undefined,
      };
      return apiCall((c) => createDataScan(c, payload));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["data-scans"] });
      onClose();
    },
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const SCAN_TYPES = [
    { value: "pii_email", label: "PII — Email addresses" },
    { value: "pii_phone", label: "PII — Phone numbers" },
    { value: "pii_ssn", label: "PII — SSN / national IDs" },
    { value: "duplicate_values", label: "Duplicate values" },
    { value: "formula_errors", label: "Formula errors" },
  ];

  return (
    <View style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
      <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Data Scan</Text>
          <Pressable onPress={onClose}><Feather name="x" size={20} color={colors.foreground} /></Pressable>
        </View>
        <ScrollView style={{ maxHeight: 400 }}>
          <View style={{ padding: 16, gap: 12 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Name</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Email PII scan"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Scan Type</Text>
            {SCAN_TYPES.map((t) => (
              <Pressable
                key={t.value}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: scanType === t.value ? colors.primary : colors.card },
                ]}
                onPress={() => setScanType(t.value)}
              >
                <Text style={{ color: scanType === t.value ? "#fff" : colors.foreground, fontSize: 13 }}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <Button title="Cancel" variant="ghost" onPress={onClose} />
          <Button title="Create" onPress={() => createMut.mutate()} disabled={createMut.isPending} />
        </View>
      </View>
    </View>
  );
}

// ─── Auth Providers Tab ──────────────────────────────────────────────────────

function AuthProvidersTab({
  colors,
  apiCall,
}: {
  colors: ReturnType<typeof useColors>;
  apiCall: ReturnType<typeof useAuth>["apiCall"];
}) {
  const qc = useQueryClient();
  const [editProvider, setEditProvider] = useState<BaserowAuthProvider | null>(null);

  const query = useAdminQuery(
    ["auth-providers"],
    () => apiCall((c) => listAuthProviders(c)),
  );

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiCall((c) => deleteAuthProvider(c, id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-providers"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (provider: BaserowAuthProvider) =>
      apiCall((c) =>
        updateAuthProvider(c, provider.id!, {
          ...provider,
          enabled: !provider.enabled,
        } as never),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-providers"] }),
    onError: (e: Error) => Alert.alert("Error", e.message),
  });

  const providers: BaserowAuthProvider[] = query.data ?? [];
  const PROVIDER_LABELS: Record<string, string> = {
    password: "Password",
    google: "Google OAuth",
    github: "GitHub OAuth",
    gitlab: "GitLab OAuth",
    openidconnect: "OpenID Connect",
    saml: "SAML",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />}
      >
        {query.isLoading ? (
          <LoadingState colors={colors} />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} colors={colors} />
        ) : providers.length === 0 ? (
          <EmptyState message="No auth providers configured." icon="lock" colors={colors} />
        ) : (
          providers.map((provider) => (
            <RowCard key={provider.id} colors={colors}>
              <View style={styles.rowPressable}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBadges}>
                    <Badge label={PROVIDER_LABELS[provider.type] ?? provider.type} variant="info" colors={colors} />
                    {provider.enabled ? (
                      <Badge label="Enabled" variant="success" colors={colors} />
                    ) : (
                      <Badge label="Disabled" variant="warning" colors={colors} />
                    )}
                  </View>
                  {provider.domain && (
                    <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                      🌐 {provider.domain}
                    </Text>
                  )}
                </View>
              </View>
              <Divider colors={colors} />
              <View style={styles.rowActions}>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => toggleMut.mutate(provider)}
                >
                  <Feather name={provider.enabled ? "pause" : "play"} size={16} color={colors.primary} />
                  <Text style={[styles.rowActionText, { color: colors.primary }]}>
                    {provider.enabled ? "Disable" : "Enable"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.rowAction}
                  onPress={() => {
                    Alert.alert("Delete Provider", `Remove this ${PROVIDER_LABELS[provider.type] ?? provider.type} provider?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(provider.id!) },
                    ]);
                  }}
                >
                  <Feather name="trash-2" size={16} color="#ef4444" />
                  <Text style={[styles.rowActionText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </RowCard>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: "bar-chart-2" as const },
  { key: "users", label: "Users", icon: "users" as const },
  { key: "workspaces", label: "Workspaces", icon: "grid" as const },
  { key: "audit", label: "Audit Log", icon: "activity" as const },
  { key: "scanner", label: "Data Scanner", icon: "search" as const },
  { key: "auth", label: "Auth Providers", icon: "lock" as const },
];

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Admin",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      {/* Tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={[styles.tabStrip, { borderBottomColor: colors.border }]}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tabButton,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabButtonText,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      <View style={{ flex: 1, paddingBottom: bottomPad }}>
        {activeTab === "dashboard" && <DashboardTab colors={colors} apiCall={apiCall} />}
        {activeTab === "users" && <UsersTab colors={colors} apiCall={apiCall} />}
        {activeTab === "workspaces" && <WorkspacesTab colors={colors} apiCall={apiCall} />}
        {activeTab === "audit" && <AuditLogTab colors={colors} apiCall={apiCall} />}
        {activeTab === "scanner" && <DataScannerTab colors={colors} apiCall={apiCall} />}
        {activeTab === "auth" && <AuthProvidersTab colors={colors} apiCall={apiCall} />}
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tabStrip: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  subTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 12,
  },
  subTab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  subTabText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 90,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statChange: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    height: 36,
  },
  filterPanel: {
    padding: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  rowCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 10,
  },
  rowPressable: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  rowBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  rowActions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 16,
  },
  rowAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowActionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  divider: {
    height: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.2)",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  toggle: {
    width: 40,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: "flex-end",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
});
