/**
 * WorkspaceMembersScreen — manage members and pending invitations for a workspace.
 *
 * Route: /workspace-members?workspaceId=&workspaceName=
 *
 * Two tabs:
 *   Members     — list all members, change role, remove member
 *   Invitations — list pending invites, send new invite, revoke invite
 *
 * API endpoints used:
 *   GET    /api/workspaces/users/workspace/{workspace_id}/
 *   PATCH  /api/workspaces/users/{workspace_user_id}/
 *   DELETE /api/workspaces/users/{workspace_user_id}/
 *   GET    /api/workspaces/invitations/workspace/{workspace_id}/
 *   POST   /api/workspaces/invitations/workspace/{workspace_id}/
 *   PATCH  /api/workspaces/invitations/{invitation_id}/
 *   DELETE /api/workspaces/invitations/{invitation_id}/
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createWorkspaceInvitation,
  deleteWorkspaceInvitation,
  listWorkspaceInvitations,
  listWorkspaceMembers,
  removeWorkspaceMember,
  updateWorkspaceMember,
  type WorkspaceInvitation,
  type WorkspaceMember,
} from "@/lib/baserow";

// ─── Role Picker ─────────────────────────────────────────────────────────────

const ROLES = ["ADMIN", "MEMBER", "VIEWER"] as const;
type Role = (typeof ROLES)[number];

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "#ef4444",
  MEMBER: "#3b82f6",
  VIEWER: "#6b7280",
};

function RoleBadge({ role, colors }: { role: string; colors: ReturnType<typeof useColors> }) {
  const c = ROLE_COLORS[role as Role] ?? colors.mutedForeground;
  return (
    <View style={[rs.badge, { borderColor: c + "40", backgroundColor: c + "18" }]}>
      <Text style={[rs.badgeText, { color: c }]}>{role}</Text>
    </View>
  );
}

function RolePicker({
  current,
  onSelect,
  colors,
}: {
  current: string;
  onSelect: (r: Role) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[rs.rolePicker, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      {ROLES.map((r) => (
        <Pressable
          key={r}
          style={[rs.roleOption, { backgroundColor: r === current ? ROLE_COLORS[r] + "22" : "transparent" }]}
          onPress={() => onSelect(r)}
          testID={`role-option-${r}`}
        >
          <Text style={[rs.roleOptionText, { color: r === current ? ROLE_COLORS[r] : colors.mutedForeground, fontWeight: r === current ? "700" : "400" }]}>
            {r}
          </Text>
          {r === current && <Feather name="check" size={12} color={ROLE_COLORS[r]} />}
        </Pressable>
      ))}
    </View>
  );
}

// ─── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
  member,
  currentUserId,
  colors,
  onChangeRole,
  onRemove,
}: {
  member: WorkspaceMember;
  currentUserId: number;
  colors: ReturnType<typeof useColors>;
  onChangeRole: (m: WorkspaceMember, role: Role) => void;
  onRemove: (m: WorkspaceMember) => void;
}) {
  const [showRolePicker, setShowRolePicker] = useState(false);
  const isCurrentUser = member.user_id === currentUserId;

  return (
    <View testID={`member-row-${member.id}`}>
      <View style={[rs.row, { borderBottomColor: colors.border }]}>
        {/* Avatar */}
        <View style={[rs.avatar, { backgroundColor: colors.primary }]}>
          <Text style={rs.avatarText}>{(member.name?.[0] ?? member.email?.[0] ?? "?").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[rs.memberName, { color: colors.text }]} numberOfLines={1}>
            {member.name || member.email}
            {isCurrentUser ? " (you)" : ""}
          </Text>
          <Text style={[rs.memberEmail, { color: colors.mutedForeground }]} numberOfLines={1}>
            {member.email}
          </Text>
        </View>
        <Pressable onPress={() => setShowRolePicker((v) => !v)} testID={`member-role-${member.id}`}>
          <RoleBadge role={member.permissions} colors={colors} />
        </Pressable>
        {!isCurrentUser && (
          <Pressable
            onPress={() => onRemove(member)}
            hitSlop={8}
            style={{ padding: 4 }}
            testID={`member-remove-${member.id}`}
          >
            <Feather name="user-x" size={15} color={colors.destructive} />
          </Pressable>
        )}
      </View>
      {showRolePicker && (
        <RolePicker
          current={member.permissions}
          onSelect={(r) => { onChangeRole(member, r); setShowRolePicker(false); }}
          colors={colors}
        />
      )}
    </View>
  );
}

// ─── Invitation Row ───────────────────────────────────────────────────────────

function InvitationRow({
  invitation,
  colors,
  onRevoke,
}: {
  invitation: WorkspaceInvitation;
  colors: ReturnType<typeof useColors>;
  onRevoke: (i: WorkspaceInvitation) => void;
}) {
  const date = new Date(invitation.created_on);
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <View style={[rs.row, { borderBottomColor: colors.border }]} testID={`invite-row-${invitation.id}`}>
      <View style={[rs.avatar, { backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }]}>
        <Feather name="mail" size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rs.memberName, { color: colors.text }]} numberOfLines={1}>
          {invitation.email}
        </Text>
        <Text style={[rs.memberEmail, { color: colors.mutedForeground }]}>
          Invited {dateStr} · {invitation.permissions}
        </Text>
      </View>
      <Pressable onPress={() => onRevoke(invitation)} hitSlop={8} style={{ padding: 4 }} testID={`invite-revoke-${invitation.id}`}>
        <Feather name="x" size={16} color={colors.destructive} />
      </Pressable>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = "members" | "invitations";

export default function WorkspaceMembersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall, user } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ workspaceId: string; workspaceName?: string }>();
  const workspaceId = Number(params.workspaceId);
  const workspaceName = params.workspaceName ?? "Workspace";

  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("MEMBER");
  const [showInviteForm, setShowInviteForm] = useState(false);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);
  const currentUserId = user?.id ?? 0;

  // ─── Queries ───────────────────────────────────────────────────────────────

  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => apiCall((c) => listWorkspaceMembers(c, workspaceId)),
    enabled: Number.isFinite(workspaceId),
  });

  const invitationsQuery = useQuery({
    queryKey: ["workspace-invitations", workspaceId],
    queryFn: () => apiCall((c) => listWorkspaceInvitations(c, workspaceId)),
    enabled: Number.isFinite(workspaceId),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: number; role: Role }) =>
      apiCall((c) => updateWorkspaceMember(c, memberId, { permissions: role })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update role."),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: number) => apiCall((c) => removeWorkspaceMember(c, memberId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-members", workspaceId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not remove member."),
  });

  const sendInviteMutation = useMutation({
    mutationFn: () =>
      apiCall((c) => createWorkspaceInvitation(c, workspaceId, { email: inviteEmail.trim(), permissions: inviteRole })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] });
      setInviteEmail("");
      setInviteRole("MEMBER");
      setShowInviteForm(false);
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not send invitation."),
  });

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: number) => apiCall((c) => deleteWorkspaceInvitation(c, inviteId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspace-invitations", workspaceId] }),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not revoke invitation."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function confirmRemove(member: WorkspaceMember) {
    Alert.alert(`Remove ${member.name || member.email}?`, "They will lose access to this workspace.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeMemberMutation.mutate(member.id) },
    ]);
  }

  function confirmRevoke(invitation: WorkspaceInvitation) {
    Alert.alert("Revoke invitation?", `${invitation.email} will no longer be able to join.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Revoke", style: "destructive", onPress: () => revokeInviteMutation.mutate(invitation.id) },
    ]);
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const members = membersQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];
  const isLoading = activeTab === "members" ? membersQuery.isLoading : invitationsQuery.isLoading;
  const isError = activeTab === "members" ? membersQuery.isError : invitationsQuery.isError;

  return (
    <View style={[rs.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: workspaceName,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingHorizontal: 4 }}>
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {/* Tab bar */}
      <View style={[rs.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["members", "invitations"] as Tab[]).map((tab) => {
          const count = tab === "members" ? members.length : invitations.length;
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[rs.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab(tab)}
              testID={`tab-${tab}`}
            >
              <Text style={[rs.tabText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {tab === "members" ? "Members" : "Invitations"}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState
          title="Could not load data"
          onRetry={() => activeTab === "members" ? membersQuery.refetch() : invitationsQuery.refetch()}
        />
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: bottomPad + 80 }}
            refreshControl={
              <RefreshControl
                refreshing={activeTab === "members" ? membersQuery.isRefetching : invitationsQuery.isRefetching}
                onRefresh={() => activeTab === "members" ? membersQuery.refetch() : invitationsQuery.refetch()}
                tintColor={colors.primary}
              />
            }
          >
            {activeTab === "members" ? (
              <View style={[rs.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                {members.length === 0 ? (
                  <View style={rs.emptyState}>
                    <Text style={[rs.emptyText, { color: colors.mutedForeground }]}>No members found.</Text>
                  </View>
                ) : (
                  members.map((m) => (
                    <MemberRow
                      key={m.id}
                      member={m}
                      currentUserId={currentUserId}
                      colors={colors}
                      onChangeRole={(member, role) => updateRoleMutation.mutate({ memberId: member.id, role })}
                      onRemove={confirmRemove}
                    />
                  ))
                )}
              </View>
            ) : (
              <>
                {/* Invite form */}
                {showInviteForm ? (
                  <View style={[rs.inviteForm, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                    <Text style={[rs.inviteFormTitle, { color: colors.text }]}>Invite someone</Text>
                    <TextInput
                      style={[rs.input, { color: colors.text, backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="Email address"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      testID="invite-email-input"
                    />
                    <Text style={[rs.inviteRoleLabel, { color: colors.mutedForeground }]}>ROLE</Text>
                    <RolePicker
                      current={inviteRole}
                      onSelect={setInviteRole}
                      colors={colors}
                    />
                    <View style={rs.inviteFormBtns}>
                      <Pressable
                        style={[rs.btn, rs.btnOutline, { borderColor: colors.border }]}
                        onPress={() => { setShowInviteForm(false); setInviteEmail(""); }}
                      >
                        <Text style={[rs.btnText, { color: colors.mutedForeground }]}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[rs.btn, { backgroundColor: inviteEmail.trim() ? colors.primary : colors.muted }]}
                        onPress={() => { if (inviteEmail.trim()) sendInviteMutation.mutate(); }}
                        disabled={!inviteEmail.trim() || sendInviteMutation.isPending}
                        testID="send-invite-btn"
                      >
                        <Text style={[rs.btnText, { color: inviteEmail.trim() ? colors.primaryForeground : colors.mutedForeground }]}>
                          {sendInviteMutation.isPending ? "Sending…" : "Send invite"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    style={[rs.addInviteBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
                    onPress={() => setShowInviteForm(true)}
                    testID="add-invite-btn"
                  >
                    <Feather name="user-plus" size={16} color={colors.primaryForeground} />
                    <Text style={[rs.addInviteBtnText, { color: colors.primaryForeground }]}>Invite someone</Text>
                  </Pressable>
                )}

                {/* Pending invitations */}
                {invitations.length > 0 && (
                  <View style={[rs.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
                    {invitations.map((inv) => (
                      <InvitationRow
                        key={inv.id}
                        invitation={inv}
                        colors={colors}
                        onRevoke={confirmRevoke}
                      />
                    ))}
                  </View>
                )}

                {invitations.length === 0 && !showInviteForm && (
                  <View style={rs.emptyState}>
                    <Feather name="mail" size={32} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
                    <Text style={[rs.emptyText, { color: colors.mutedForeground }]}>No pending invitations.</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const rs = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  tabText: { fontSize: 14, fontWeight: "600" },
  card: { margin: 14, borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 0.5 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  memberName: { fontSize: 14, fontWeight: "600" },
  memberEmail: { fontSize: 12, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  rolePicker: { flexDirection: "row", borderWidth: 1, marginHorizontal: 14, marginBottom: 10, overflow: "hidden" },
  roleOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 8 },
  roleOptionText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 14 },
  inviteForm: { margin: 14, padding: 14, borderWidth: 1, gap: 12 },
  inviteFormTitle: { fontSize: 16, fontWeight: "700" },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  inviteRoleLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  inviteFormBtns: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: "center" },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 14, fontWeight: "600" },
  addInviteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, margin: 14, padding: 14 },
  addInviteBtnText: { fontSize: 15, fontWeight: "600" },
});
