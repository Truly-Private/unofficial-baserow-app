import React, { useState } from "react";
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
  Switch,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchAccount,
  updateAccount,
  changePassword,
  sendChangeEmailConfirmation,
  sendVerifyEmail,
  fetchDashboard,
  scheduleAccountDeletion,
  UserAccount,
  WorkspaceInvitation,
} from "../api/database";

const EMAIL_FREQUENCIES = [
  { label: "Instant", value: "instant" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Never", value: "never" },
] as const;

const LANGUAGES = [
  { label: "English", value: "en" },
  { label: "English (UK)", value: "en-GB" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Dutch", value: "nl" },
  { label: "Portuguese", value: "pt" },
  { label: "Italian", value: "it" },
];

type Props = {
  onBack?: () => void;
  onLogout?: () => void;
};

type ActiveTab = "profile" | "notifications" | "invitations" | "danger";

export const ProfileScreen: React.FC<Props> = ({ onBack, onLogout }) => {
  const { apiCall, user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [language, setLanguage] = useState("en");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteDays, setDeleteDays] = useState("7");

  // Fetch account
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => fetchAccount(apiCall),
  });

  // Fetch dashboard (invitations)
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(apiCall),
  });

  const invitations: WorkspaceInvitation[] = dashboard?.workspace_invitations ?? [];

  // Populate form when account loads
  React.useEffect(() => {
    if (account) {
      setFirstName(account.first_name ?? "");
      setLanguage(account.language ?? "en");
    }
  }, [account]);

  // Update account mutation
  const updateMut = useMutation({
    mutationFn: (payload: Partial<UserAccount>) =>
      updateAccount(apiCall, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["account"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
    onError: (err: any) =>
      Alert.alert("Error", err?.message ?? "Failed to update profile"),
  });

  // Change password mutation
  const passwordMut = useMutation({
    mutationFn: () =>
      changePassword(apiCall, {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: confirmPassword,
      }),
    onSuccess: () => {
      Alert.alert("Success", "Password changed successfully.");
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: any) =>
      Alert.alert("Error", err?.message ?? "Failed to change password"),
  });

  // Change email mutation
  const emailMut = useMutation({
    mutationFn: () =>
      sendChangeEmailConfirmation(apiCall, {
        new_email: newEmail,
        password: emailPassword,
        base_url: "baserow://email-confirm",
      }),
    onSuccess: () => {
      Alert.alert(
        "Check your email",
        `A confirmation link was sent to ${newEmail}. Open the link to confirm the change.`,
      );
      setShowEmailModal(false);
      setNewEmail("");
      setEmailPassword("");
    },
    onError: (err: any) =>
      Alert.alert("Error", err?.message ?? "Failed to send confirmation email"),
  });

  // Send verify email mutation
  const verifyEmailMut = useMutation({
    mutationFn: () => sendVerifyEmail(apiCall),
    onSuccess: () => Alert.alert("Sent", "Verification email sent."),
    onError: (err: any) =>
      Alert.alert("Error", err?.message ?? "Failed to send verification email"),
  });

  // Schedule deletion mutation
  const deleteMut = useMutation({
    mutationFn: () =>
      scheduleAccountDeletion(apiCall, { days: parseInt(deleteDays, 10) }),
    onSuccess: () => {
      Alert.alert(
        "Account scheduled for deletion",
        `Your account will be deleted in ${deleteDays} days. You can cancel by logging in before then.`,
      );
      setShowDeleteModal(false);
    },
    onError: (err: any) =>
      Alert.alert("Error", err?.message ?? "Failed to schedule deletion"),
  });

  const handleSave = () => {
    updateMut.mutate({
      first_name: firstName,
      language,
    });
  };

  const handleFrequencyChange = (freq: string) => {
    updateMut.mutate({
      email_notification_frequency: freq as UserAccount["email_notification_frequency"],
    });
  };

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "notifications", label: "Notifications" },
    { key: "invitations", label: "Invitations" },
    { key: "danger", label: "Danger Zone" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} testID="back-btn">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Profile</Text>
        {user?.email && (
          <Text style={styles.headerEmail}>{user.email}</Text>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar} testID="profile-tabs">
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            testID={`tab-${tab.key}`}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* ── Profile Tab ── */}
        {activeTab === "profile" && (
          <View style={styles.section}>
            {accountLoading ? (
              <ActivityIndicator size="large" />
            ) : (
              <>
                {/* Avatar placeholder */}
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(account?.first_name ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.avatarHint}>Avatar</Text>
                </View>

                {/* First name */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Your name"
                    testID="input-first-name"
                  />
                </View>

                {/* Language */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Language</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {LANGUAGES.map((lang) => (
                      <TouchableOpacity
                        key={lang.value}
                        style={[
                          styles.chip,
                          language === lang.value && styles.chipActive,
                        ]}
                        onPress={() => setLanguage(lang.value)}
                        testID={`lang-${lang.value}`}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            language === lang.value && styles.chipTextActive,
                          ]}
                        >
                          {lang.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Save button */}
                <TouchableOpacity
                  style={[styles.btnPrimary, updateMut.isPending && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={updateMut.isPending}
                  testID="btn-save-profile"
                >
                  <Text style={styles.btnPrimaryText}>
                    {updateMut.isPending ? "Saving..." : saveSuccess ? "✓ Saved!" : "Save Changes"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Change password */}
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setShowPasswordModal(true)}
                  testID="btn-change-password"
                >
                  <Text style={styles.btnSecondaryText}>🔒 Change Password</Text>
                </TouchableOpacity>

                {/* Change email */}
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setShowEmailModal(true)}
                  testID="btn-change-email"
                >
                  <Text style={styles.btnSecondaryText}>✉️ Change Email</Text>
                </TouchableOpacity>

                {/* Verify email */}
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => verifyEmailMut.mutate()}
                  disabled={verifyEmailMut.isPending}
                  testID="btn-verify-email"
                >
                  <Text style={styles.btnSecondaryText}>
                    📧 {verifyEmailMut.isPending ? "Sending..." : "Resend Verification Email"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === "notifications" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Notification Frequency</Text>
            <Text style={styles.sectionSub}>
              Choose how often you want to receive email notifications about Baserow activity.
            </Text>

            <View style={styles.freqList}>
              {EMAIL_FREQUENCIES.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.freqItem,
                    account?.email_notification_frequency === opt.value &&
                      styles.freqItemActive,
                  ]}
                  onPress={() => handleFrequencyChange(opt.value)}
                  testID={`freq-${opt.value}`}
                >
                  <View style={styles.freqLabel}>
                    <Text style={styles.freqTitle}>{opt.label}</Text>
                    <Text style={styles.freqDesc}>
                      {opt.value === "instant"
                        ? "Get notified immediately"
                        : opt.value === "daily"
                          ? "Daily summary digest"
                          : opt.value === "weekly"
                            ? "Weekly summary digest"
                            : "No email notifications"}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      account?.email_notification_frequency === opt.value &&
                        styles.radioActive,
                    ]}
                  >
                    {account?.email_notification_frequency === opt.value && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Invitations Tab ── */}
        {activeTab === "invitations" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workspace Invitations</Text>
            {invitations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={styles.emptyText}>No pending invitations</Text>
                <Text style={styles.emptySubtext}>
                  You haven't been invited to any workspaces.
                </Text>
              </View>
            ) : (
              invitations.map((inv) => (
                <View key={inv.id} style={styles.inviteCard} testID={`invitation-${inv.id}`}>
                  <Text style={styles.inviteWorkspace}>{inv.workspace}</Text>
                  <Text style={styles.inviteDetail}>Invited by {inv.invited_by}</Text>
                  <Text style={styles.inviteDetail}>
                    {new Date(inv.created_on).toLocaleDateString()}
                  </Text>
                  <View style={styles.inviteActions}>
                    <TouchableOpacity
                      style={[styles.btnSmall, styles.btnAccept]}
                      testID={`accept-invite-${inv.id}`}
                    >
                      <Text style={styles.btnAcceptText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btnSmall, styles.btnDecline]}
                      testID={`decline-invite-${inv.id}`}
                    >
                      <Text style={styles.btnDeclineText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── Danger Zone Tab ── */}
        {activeTab === "danger" && (
          <View style={styles.section}>
            <View style={styles.dangerBanner}>
              <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
              <Text style={styles.dangerDesc}>
                These actions are permanent and cannot be undone.
              </Text>
            </View>

            <View style={styles.dangerItem}>
              <Text style={styles.dangerItemTitle}>Schedule Account Deletion</Text>
              <Text style={styles.dangerItemDesc}>
                Permanently delete your account and all associated data after a grace period.
              </Text>
              <TouchableOpacity
                style={styles.btnDanger}
                onPress={() => setShowDeleteModal(true)}
                testID="btn-delete-account"
              >
                <Text style={styles.btnDangerText}>Delete My Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dangerItem}>
              <Text style={styles.dangerItemTitle}>Log Out</Text>
              <Text style={styles.dangerItemDesc}>
                Sign out of your account on this device.
              </Text>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={onLogout}
                testID="btn-logout"
              >
                <Text style={styles.btnSecondaryText}>🚪 Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Change Password Modal ── */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>🔒 Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              testID="input-old-password"
            />
            <TextInput
              style={styles.input}
              placeholder="New password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              testID="input-new-password"
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              testID="input-confirm-password"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, passwordMut.isPending && styles.btnDisabled]}
                onPress={() => passwordMut.mutate()}
                disabled={passwordMut.isPending}
                testID="btn-submit-password"
              >
                <Text style={styles.btnPrimaryText}>
                  {passwordMut.isPending ? "Changing..." : "Change Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Change Email Modal ── */}
      <Modal visible={showEmailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>✉️ Change Email</Text>
            <TextInput
              style={styles.input}
              placeholder="New email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={newEmail}
              onChangeText={setNewEmail}
              testID="input-new-email"
            />
            <TextInput
              style={styles.input}
              placeholder="Current password (for verification)"
              secureTextEntry
              value={emailPassword}
              onChangeText={setEmailPassword}
              testID="input-email-password"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowEmailModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPrimary, emailMut.isPending && styles.btnDisabled]}
                onPress={() => emailMut.mutate()}
                disabled={emailMut.isPending}
                testID="btn-submit-email"
              >
                <Text style={styles.btnPrimaryText}>
                  {emailMut.isPending ? "Sending..." : "Send Confirmation"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete Account Modal ── */}
      <Modal visible={showDeleteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>⚠️ Delete Account</Text>
            <Text style={styles.modalDesc}>
              This will permanently delete your account and all your data. This action cannot be undone.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Days until deletion (default 7)"
              keyboardType="number-pad"
              value={deleteDays}
              onChangeText={setDeleteDays}
              testID="input-delete-days"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnDanger, deleteMut.isPending && styles.btnDisabled]}
                onPress={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
                testID="btn-confirm-delete"
              >
                <Text style={styles.btnDangerText}>
                  {deleteMut.isPending ? "Scheduling..." : "Schedule Deletion"}
                </Text>
              </TouchableOpacity>
            </View>
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
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backText: { fontSize: 16, color: "#007AFF", marginRight: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  headerEmail: { fontSize: 13, color: "#888", marginLeft: "auto" },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#007AFF" },
  tabText: { fontSize: 13, color: "#888" },
  tabTextActive: { color: "#007AFF", fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  sectionSub: { fontSize: 13, color: "#888", marginBottom: 16, lineHeight: 18 },
  avatarContainer: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  avatarText: { fontSize: 32, color: "#fff", fontWeight: "700" },
  avatarHint: { fontSize: 13, color: "#aaa" },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1a1a1a",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#eee",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#007AFF" },
  chipText: { fontSize: 13, color: "#555" },
  chipTextActive: { color: "#fff", fontWeight: "600" },
  btnPrimary: {
    backgroundColor: "#007AFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  btnSecondary: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  btnSecondaryText: { fontSize: 15, color: "#1a1a1a", fontWeight: "500" },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 20 },
  freqList: {},
  freqItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  freqItemActive: { borderColor: "#007AFF", backgroundColor: "#f0f7ff" },
  freqLabel: { flex: 1 },
  freqTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  freqDesc: { fontSize: 13, color: "#888", marginTop: 2 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: { borderColor: "#007AFF" },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007AFF",
  },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#333" },
  emptySubtext: { fontSize: 13, color: "#888", marginTop: 4 },
  inviteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  inviteWorkspace: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  inviteDetail: { fontSize: 13, color: "#888", marginTop: 4 },
  inviteActions: { flexDirection: "row", marginTop: 12, gap: 10 },
  btnSmall: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  btnAccept: { backgroundColor: "#007AFF" },
  btnAcceptText: { color: "#fff", fontWeight: "700" },
  btnDecline: { backgroundColor: "#f5f5f5" },
  btnDeclineText: { color: "#888", fontWeight: "600" },
  dangerBanner: {
    backgroundColor: "#fff5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fcc",
  },
  dangerTitle: { fontSize: 16, fontWeight: "700", color: "#cc0000", marginBottom: 4 },
  dangerDesc: { fontSize: 13, color: "#666" },
  dangerItem: { marginBottom: 24 },
  dangerItemTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a", marginBottom: 6 },
  dangerItemDesc: { fontSize: 13, color: "#888", marginBottom: 12 },
  btnDanger: {
    backgroundColor: "#cc0000",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  btnDangerText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  modalDesc: { fontSize: 14, color: "#666", marginBottom: 16, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 16 },
  btnCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
});
