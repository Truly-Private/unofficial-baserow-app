import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ApiClient } from "../api/client";
import {
  fetchWorkspaces,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  fetchWorkspaceUsers,
  updateWorkspaceUser,
  removeWorkspaceUser,
  fetchWorkspaceInvitations,
  sendWorkspaceInvitation,
  acceptWorkspaceInvitation,
  rejectWorkspaceInvitation,
  Workspace,
  WorkspaceUser,
  WorkspaceInvitation,
} from "../api/database";

const PERMISSIONS = ["ADMIN", "MEMBER", "VIEWER"] as const;
type Permission = (typeof PERMISSIONS)[number];

// ─── Tabs ────────────────────────────────────────────────────
type Tab = "workspaces" | "members" | "invitations";
const TABS: { key: Tab; label: string }[] = [
  { key: "workspaces", label: "Workspaces" },
  { key: "members", label: "Members" },
  { key: "invitations", label: "Invitations" },
];

export default function WorkspacesScreen() {
  const navigation = useNavigation();
  const [client] = useState(() => new ApiClient());
  const [tab, setTab] = useState<Tab>("workspaces");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceUser[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);

  // Modals
  const [showCreateWS, setShowCreateWS] = useState(false);
  const [showEditWS, setShowEditWS] = useState(false);
  const [showDeleteWS, setShowDeleteWS] = useState(false);
  const [showLeaveWS, setShowLeaveWS] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [pendingRoleUser, setPendingRoleUser] = useState<WorkspaceUser | null>(null);
  const [pendingRemoveUser, setPendingRemoveUser] = useState<WorkspaceUser | null>(null);

  // Form fields
  const [wsName, setWsName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Permission>("MEMBER");

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  // ── Load data on tab/workspace change ─────────────────────
  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    if (tab === "members") loadMembers();
    if (tab === "invitations") loadInvitations();
  }, [tab, selectedWorkspaceId]);

  // ── API calls ──────────────────────────────────────────────
  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkspaces(client);
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!selectedWorkspaceId) return;
    setLoading(true);
    try {
      const data = await fetchWorkspaceUsers(client, selectedWorkspaceId);
      setMembers(data);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    if (!selectedWorkspaceId) return;
    setLoading(true);
    try {
      const data = await fetchWorkspaceInvitations(client, selectedWorkspaceId);
      setInvitations(Array.isArray(data) ? data : []);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWS = async () => {
    if (!wsName.trim()) { Alert.alert("Error", "Workspace name is required."); return; }
    setSaving(true);
    try {
      const ws = await createWorkspace(client, { name: wsName.trim() });
      setWorkspaces((prev) => [...prev, ws]);
      setSelectedWorkspaceId(ws.id);
      setShowCreateWS(false);
      setWsName("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditWS = async () => {
    if (!selectedWorkspaceId || !wsName.trim()) return;
    setSaving(true);
    try {
      const updated = await updateWorkspace(client, selectedWorkspaceId, { name: wsName.trim() });
      setWorkspaces((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      setShowEditWS(false);
      setWsName("");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWS = async () => {
    if (!selectedWorkspaceId) return;
    setSaving(true);
    try {
      await deleteWorkspace(client, selectedWorkspaceId);
      const remaining = workspaces.filter((w) => w.id !== selectedWorkspaceId);
      setWorkspaces(remaining);
      setSelectedWorkspaceId(remaining.length > 0 ? remaining[0].id : null);
      setShowDeleteWS(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveWS = async () => {
    if (!selectedWorkspaceId) return;
    setSaving(true);
    try {
      await leaveWorkspace(client, selectedWorkspaceId);
      const remaining = workspaces.filter((w) => w.id !== selectedWorkspaceId);
      setWorkspaces(remaining);
      setSelectedWorkspaceId(remaining.length > 0 ? remaining[0].id : null);
      setShowLeaveWS(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedWorkspaceId || !inviteEmail.trim()) return;
    setSaving(true);
    try {
      const inv = await sendWorkspaceInvitation(client, selectedWorkspaceId, inviteEmail.trim(), inviteRole);
      setInvitations((prev) => [...prev, inv]);
      setShowInvite(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAcceptInvite = async (invitationId: number) => {
    try {
      await acceptWorkspaceInvitation(client, invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      await loadWorkspaces();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRejectInvite = async (invitationId: number) => {
    try {
      await rejectWorkspaceInvitation(client, invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleChangeRole = async (user: WorkspaceUser, newRole: Permission) => {
    try {
      const updated = await updateWorkspaceUser(client, user.id, newRole);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleRemoveUser = async (user: WorkspaceUser) => {
    Alert.alert("Remove Member", `Remove ${user.name} from this workspace?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeWorkspaceUser(client, user.id);
            setMembers((prev) => prev.filter((m) => m.id !== user.id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  // ── Render helpers ────────────────────────────────────────
  const openEditWS = (ws: Workspace) => {
    setWsName(ws.name);
    setShowEditWS(true);
  };

  const openInvite = () => {
    setInviteEmail("");
    setInviteRole("MEMBER");
    setShowInvite(true);
  };

  const openRolePicker = (user: WorkspaceUser) => {
    setPendingRoleUser(user);
    setShowRolePicker(true);
  };

  const roleColor = (role: string) => {
    if (role === "ADMIN") return "#FF9500";
    if (role === "VIEWER") return "#8E8E93";
    return "#34C759";
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          testID="back-btn"
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workspaces</Text>
        {tab === "workspaces" && (
          <TouchableOpacity
            testID="btn-create-ws"
            style={styles.headerAction}
            onPress={() => { setWsName(""); setShowCreateWS(true); }}
          >
            <Text style={styles.headerActionText}>+ New</Text>
          </TouchableOpacity>
        )}
        {tab === "invitations" && selectedWorkspaceId && (
          <TouchableOpacity
            testID="btn-invite"
            style={styles.headerAction}
            onPress={openInvite}
          >
            <Text style={styles.headerActionText}>+ Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Workspace selector pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wsPills}>
        {workspaces.map((ws) => (
          <TouchableOpacity
            key={ws.id}
            testID={`ws-pill-${ws.id}`}
            style={[styles.wsPill, selectedWorkspaceId === ws.id && styles.wsPillActive]}
            onPress={() => setSelectedWorkspaceId(ws.id)}
          >
            <Text style={[styles.wsPillText, selectedWorkspaceId === ws.id && styles.wsPillTextActive]}>
              {ws.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            testID={`tab-${t.key}`}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentPad}>

          {/* ── Workspaces Tab ── */}
          {tab === "workspaces" && (
            <>
              {!selectedWorkspace ? (
                <View testID="empty-workspaces" style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Workspaces</Text>
                  <Text style={styles.emptyText}>Tap "+ New" to create your first workspace.</Text>
                </View>
              ) : (
                <View testID="ws-detail">
                  <Text testID="ws-detail-name" style={styles.wsDetailName}>{selectedWorkspace.name}</Text>
                  <Text style={styles.wsDetailId}>ID: {selectedWorkspace.id}</Text>

                  <TouchableOpacity
                    testID="btn-edit-ws"
                    style={styles.btn}
                    onPress={() => openEditWS(selectedWorkspace)}
                  >
                    <Text style={styles.btnText}>Edit Workspace</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="btn-leave-ws"
                    style={[styles.btn, styles.btnOutline]}
                    onPress={() => setShowLeaveWS(true)}
                  >
                    <Text style={[styles.btnText, styles.btnOutlineText]}>Leave Workspace</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="btn-delete-ws"
                    style={[styles.btn, styles.btnDanger]}
                    onPress={() => setShowDeleteWS(true)}
                  >
                    <Text style={[styles.btnText, styles.btnDangerText]}>Delete Workspace</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── Members Tab ── */}
          {tab === "members" && (
            <>
              {!selectedWorkspaceId ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Select a Workspace</Text>
                </View>
              ) : members.length === 0 ? (
                <View testID="empty-members" style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Members</Text>
                  <Text style={styles.emptyText}>Invite people via the Invitations tab.</Text>
                </View>
              ) : (
                members.map((user) => (
                  <View key={user.id} testID={`member-${user.id}`} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text testID={`member-name-${user.id}`} style={styles.memberName}>{user.name}</Text>
                      <Text testID={`member-email-${user.id}`} style={styles.memberEmail}>{user.email}</Text>
                      <TouchableOpacity
                        testID={`btn-role-${user.id}`}
                        onPress={() => openRolePicker(user)}
                      >
                        <Text style={[styles.memberRole, { color: roleColor(user.permissions) }]}>
                          {user.permissions}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      testID={`btn-remove-${user.id}`}
                      style={styles.btnIcon}
                      onPress={() => handleRemoveUser(user)}
                    >
                      <Text style={styles.btnIconText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </>
          )}

          {/* ── Invitations Tab ── */}
          {tab === "invitations" && (
            <>
              {!selectedWorkspaceId ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Select a Workspace</Text>
                </View>
              ) : invitations.length === 0 ? (
                <View testID="empty-invitations" style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Pending Invitations</Text>
                  <Text style={styles.emptyText}>Tap "+ Invite" to send one.</Text>
                </View>
              ) : (
                invitations.map((inv) => (
                  <View key={inv.id} testID={`invitation-${inv.id}`} style={styles.inviteCard}>
                    <View>
                      <Text testID={`inv-email-${inv.id}`} style={styles.inviteEmail}>{inv.email}</Text>
                      <Text style={styles.inviteRole}>Role: {inv.permissions}</Text>
                    </View>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        testID={`btn-accept-${inv.id}`}
                        style={[styles.btnSmall, styles.btnSuccess]}
                        onPress={() => handleAcceptInvite(inv.id)}
                      >
                        <Text style={styles.btnSmallText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID={`btn-reject-${inv.id}`}
                        style={[styles.btnSmall, styles.btnDanger]}
                        onPress={() => handleRejectInvite(inv.id)}
                      >
                        <Text style={styles.btnSmallText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Modals ── */}

      {/* Create Workspace */}
      <Modal visible={showCreateWS} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Workspace</Text>
            <TextInput
              testID="input-ws-name"
              style={styles.input}
              placeholder="Workspace name"
              placeholderTextColor="#999"
              value={wsName}
              onChangeText={setWsName}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btn} onPress={handleCreateWS} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setShowCreateWS(false)}>
                <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Workspace */}
      <Modal visible={showEditWS} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Edit Workspace</Text>
            <TextInput
              testID="input-ws-name-edit"
              style={styles.input}
              placeholder="Workspace name"
              placeholderTextColor="#999"
              value={wsName}
              onChangeText={setWsName}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btn} onPress={handleEditWS} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setShowEditWS(false)}>
                <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Workspace */}
      <Modal visible={showDeleteWS} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Delete Workspace</Text>
            <Text style={styles.modalText}>This action cannot be undone. All tables, rows, and files will be permanently deleted.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleDeleteWS} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, styles.btnDangerText]}>Delete</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setShowDeleteWS(false)}>
                <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Leave Workspace */}
      <Modal visible={showLeaveWS} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Leave Workspace</Text>
            <Text style={styles.modalText}>You will lose access to all tables and data in this workspace.</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleLeaveWS} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={[styles.btnText, styles.btnDangerText]}>Leave</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setShowLeaveWS(false)}>
                <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Send Invitation */}
      <Modal visible={showInvite} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Invite Member</Text>
            <TextInput
              testID="input-invite-email"
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#999"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleChips}>
              {PERMISSIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  testID={`invite-role-${r.toLowerCase()}`}
                  style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.btn} onPress={handleSendInvite} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Invite</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => setShowInvite(false)}>
                <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Role Picker */}
      <Modal visible={showRolePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Change Role — {pendingRoleUser?.name}</Text>
            {PERMISSIONS.map((r) => (
              <TouchableOpacity
                key={r}
                testID={`role-option-${r.toLowerCase()}`}
                style={[styles.roleOption, pendingRoleUser?.permissions === r && styles.roleOptionActive]}
                onPress={async () => {
                  if (pendingRoleUser) await handleChangeRole(pendingRoleUser, r);
                  setShowRolePicker(false);
                  setPendingRoleUser(null);
                }}
              >
                <View style={[styles.roleDot, { backgroundColor: roleColor(r) }]} />
                <Text style={styles.roleOptionText}>{r}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={() => { setShowRolePicker(false); setPendingRoleUser(null); }}>
              <Text style={[styles.btnText, styles.btnOutlineText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: {
    flexDirection: "row", alignItems: "center", paddingTop: 60, paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E5EA",
  },
  backBtn: { paddingRight: 16, paddingVertical: 8 },
  backBtnText: { fontSize: 24, color: "#007AFF" },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: "600", color: "#000" },
  headerAction: { paddingHorizontal: 12, paddingVertical: 6 },
  headerActionText: { fontSize: 15, color: "#007AFF", fontWeight: "600" },
  wsPills: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 12, maxHeight: 50 },
  wsPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E5E5EA",
    marginRight: 8,
  },
  wsPillActive: { backgroundColor: "#007AFF" },
  wsPillText: { fontSize: 13, color: "#3C3C43" },
  wsPillTextActive: { color: "#fff" },
  tabBar: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E5EA" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#007AFF" },
  tabText: { fontSize: 13, color: "#8E8E93" },
  tabTextActive: { color: "#007AFF", fontWeight: "600" },
  loader: { marginTop: 40 },
  content: { flex: 1 },
  contentPad: { padding: 16, paddingBottom: 40 },
  emptyState: { alignItems: "center", marginTop: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "600", color: "#3C3C43", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#8E8E93", textAlign: "center" },
  // Workspace detail
  wsDetailName: { fontSize: 22, fontWeight: "700", color: "#000", marginBottom: 4 },
  wsDetailId: { fontSize: 12, color: "#8E8E93", marginBottom: 24 },
  // Member card
  memberCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    borderRadius: 12, padding: 12, marginBottom: 8,
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#007AFF",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  memberAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: "600", color: "#000" },
  memberEmail: { fontSize: 12, color: "#8E8E93" },
  memberRole: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  btnIcon: { padding: 8 },
  btnIconText: { fontSize: 16, color: "#FF3B30" },
  // Invite card
  inviteCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8,
  },
  inviteEmail: { fontSize: 15, fontWeight: "600", color: "#000" },
  inviteRole: { fontSize: 12, color: "#8E8E93", marginTop: 2 },
  inviteActions: { flexDirection: "row", gap: 8 },
  // Buttons
  btn: {
    backgroundColor: "#007AFF", borderRadius: 10, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", marginBottom: 10, minHeight: 48,
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#007AFF" },
  btnOutlineText: { color: "#007AFF" },
  btnDanger: { backgroundColor: "#FF3B30" },
  btnDangerText: { color: "#fff" },
  btnSuccess: { backgroundColor: "#34C759" },
  btnSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnSmallText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  // Inputs
  input: {
    backgroundColor: "#F2F2F7", borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 16, color: "#000", marginBottom: 16,
  },
  inputLabel: { fontSize: 13, color: "#8E8E93", marginBottom: 8 },
  // Role chips
  roleChips: { flexDirection: "row", gap: 8, marginBottom: 16 },
  roleChip: {
    flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: "#F2F2F7",
    alignItems: "center", borderWidth: 1, borderColor: "#E5E5EA",
  },
  roleChipActive: { backgroundColor: "#007AFF", borderColor: "#007AFF" },
  roleChipText: { fontSize: 13, fontWeight: "600", color: "#3C3C43" },
  roleChipTextActive: { color: "#fff" },
  roleOption: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#E5E5EA",
  },
  roleOptionActive: { backgroundColor: "#E8F0FE", borderRadius: 8 },
  roleDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  roleOptionText: { fontSize: 16, fontWeight: "500", color: "#000" },
  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#000", marginBottom: 16, textAlign: "center" },
  modalText: { fontSize: 14, color: "#8E8E93", marginBottom: 16, lineHeight: 20 },
  modalBtns: { marginTop: 8 },
});
