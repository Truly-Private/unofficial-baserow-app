/**
 * SettingsScreen — full user account & app preferences.
 *
 * Sections:
 *   Profile    — name edit, email display, language, notification frequency
 *   Security   — change password
 *   Email      — change email, resend verification
 *   Appearance — light / dark / system theme
 *   Admin      — link to admin panel (superusers only)
 *   About      — instance URL, app info
 *   Danger Zone — sign out (blacklists token), schedule account deletion
 */

import { Feather } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  blacklistToken,
  changePassword,
  requestEmailChange,
  scheduleAccountDeletion,
  sendVerificationEmail,
  updateUserAccount,
} from "@/lib/baserow";

// ─── Small helpers ────────────────────────────────────────────────────────────

type Colors = ReturnType<typeof useColors>;

function SectionTitle({ label, colors }: { label: string; colors: Colors }) {
  return (
    <Text style={[s.sectionTitle, { color: colors.mutedForeground }]}>
      {label}
    </Text>
  );
}

function Card({
  children,
  colors,
}: {
  children: React.ReactNode;
  colors: Colors;
}) {
  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      {children}
    </View>
  );
}

function Divider({ colors }: { colors: Colors }) {
  return <View style={[s.divider, { backgroundColor: colors.border }]} />;
}

function InfoRow({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  colors: Colors;
}) {
  return (
    <View style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[s.rowValue, { color: colors.foreground }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function NavRow({
  label,
  subtitle,
  icon,
  iconColor,
  onPress,
  colors,
  testID,
}: {
  label: string;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor?: string;
  onPress: () => void;
  colors: Colors;
  testID?: string;
}) {
  return (
    <Pressable style={s.row} onPress={onPress} testID={testID}>
      <View style={[s.rowIcon, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name={icon} size={14} color={iconColor ?? colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowValue, { color: colors.foreground }]}>{label}</Text>
        {subtitle ? (
          <Text style={[s.rowLabel, { color: colors.mutedForeground }]}>{subtitle}</Text>
        ) : null}
      </View>
      <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

function ThemeOption({
  label,
  value,
  currentValue,
  onPress,
  colors,
  icon,
}: {
  label: string;
  value: string;
  currentValue: string;
  onPress: () => void;
  colors: Colors;
  icon: keyof typeof Feather.glyphMap;
}) {
  const isSelected = value === currentValue;
  return (
    <Pressable style={s.row} onPress={onPress}>
      <View
        style={[
          s.rowIcon,
          {
            backgroundColor: isSelected ? colors.primary : colors.muted,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
      >
        <Feather
          name={icon}
          size={14}
          color={isSelected ? colors.primaryForeground : colors.mutedForeground}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.rowValue, { color: isSelected ? colors.primary : colors.foreground }]}>
          {label}
        </Text>
      </View>
      {isSelected && <Feather name="check" size={18} color={colors.primary} />}
    </Pressable>
  );
}

// ─── Inline edit modal ────────────────────────────────────────────────────────

function InlineForm({
  title,
  fields,
  submitLabel,
  onSubmit,
  onCancel,
  pending,
  colors,
}: {
  title: string;
  fields: Array<{ key: string; label: string; placeholder?: string; secure?: boolean; value: string; onChange: (v: string) => void }>;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
  pending: boolean;
  colors: Colors;
}) {
  return (
    <View style={[s.inlineForm, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[s.inlineFormTitle, { color: colors.foreground }]}>{title}</Text>
      {fields.map((f, i) => (
        <View key={f.key} style={{ gap: 4 }}>
          <Text style={[s.fieldLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
          <TextInput
            style={[s.textInput, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            value={f.value}
            onChangeText={f.onChange}
            placeholder={f.placeholder}
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry={f.secure}
            autoCapitalize="none"
            autoCorrect={false}
            testID={`field-${f.key}`}
          />
          {i < fields.length - 1 && <View style={{ height: 8 }} />}
        </View>
      ))}
      <View style={s.inlineFormBtns}>
        <Pressable
          style={[s.inlineBtn, s.inlineBtnCancel, { borderColor: colors.border }]}
          onPress={onCancel}
        >
          <Text style={[s.inlineBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[s.inlineBtn, { backgroundColor: pending ? colors.muted : colors.primary }]}
          onPress={onSubmit}
          disabled={pending}
          testID="form-submit"
        >
          <Text style={[s.inlineBtnText, { color: pending ? colors.mutedForeground : colors.primaryForeground }]}>
            {pending ? "Saving…" : submitLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type ActiveForm = "name" | "password" | "email" | null;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { signOut, apiCall, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  // Form state
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [firstName, setFirstName] = useState(creds.user.first_name ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  function resetForms() {
    setFirstName(creds.user.first_name ?? "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setNewEmail("");
    setEmailPassword("");
    setActiveForm(null);
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const updateNameMutation = useMutation({
    mutationFn: (data?: { first_name?: string; language?: string; notification_email_frequency?: "instant" | "daily" | "weekly" | "never" }) =>
      apiCall((c) => updateUserAccount(c, data ?? { first_name: firstName.trim() })),
    onSuccess: (updated) => {
      updateUser?.({ ...creds.user, ...updated });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      resetForms();
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update settings."),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
      return apiCall((c) => changePassword(c, { old_password: oldPassword, new_password: newPassword }));
    },
    onSuccess: () => {
      resetForms();
      Alert.alert("Password changed", "Your password has been updated successfully.");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not change password."),
  });

  const changeEmailMutation = useMutation({
    mutationFn: () => apiCall((c) => requestEmailChange(c, { new_email: newEmail.trim(), password: emailPassword })),
    onSuccess: () => {
      resetForms();
      Alert.alert("Check your inbox", `A confirmation email has been sent to ${newEmail}.`);
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not request email change."),
  });

  const resendVerificationMutation = useMutation({
    mutationFn: () => apiCall((c) => sendVerificationEmail(c)),
    onSuccess: () => Alert.alert("Sent", "Verification email has been re-sent."),
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not send verification email."),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => apiCall((c) => scheduleAccountDeletion(c)),
    onSuccess: async () => {
      Alert.alert("Account scheduled for deletion", "Your account will be deleted within 30 days. You have been signed out.");
      await signOut();
      router.replace("/login");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not schedule deletion."),
  });

  // ─── Sign out ──────────────────────────────────────────────────────────────

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You will need to sign back in to access your tables.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            // Blacklist the refresh token server-side before clearing local state
            try {
              await blacklistToken(creds.baseUrl, creds.refreshToken);
            } catch {
              // Non-fatal — still sign out locally
            }
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Schedule account deletion?",
      "Your account and all its data will be permanently deleted within 30 days. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete my account",
          style: "destructive",
          onPress: () => deleteAccountMutation.mutate(),
        },
      ],
    );
  }

  const isSuperuser = (creds.user as { is_superuser?: boolean }).is_superuser;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen options={{ title: "Settings", headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground }} />
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ padding: 20, paddingBottom: bottomPad + 24 }}
        keyboardShouldPersistTaps="handled"
        testID="settings-scroll"
      >
        {/* ── Profile ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Profile" colors={colors} />
          <Card colors={colors}>
            <InfoRow label="Signed in as" value={creds.user.email} icon="mail" colors={colors} />
            <Divider colors={colors} />
            {activeForm === "name" ? (
              <View style={{ padding: 14 }}>
                <InlineForm
                  title="Change profile"
                  fields={[
                    { key: "first_name", label: "First name", placeholder: "First name", value: firstName, onChange: setFirstName },
                  ]}
                  submitLabel="Save profile"
                  onSubmit={() => updateNameMutation.mutate({ first_name: firstName })}
                  onCancel={resetForms}
                  pending={updateNameMutation.isPending}
                  colors={colors}
                />
              </View>
            ) : (
              <NavRow
                label="Name"
                subtitle={creds.user.first_name || "Not set"}
                icon="user"
                onPress={() => { setActiveForm("name"); setFirstName(creds.user.first_name ?? ""); }}
                colors={colors}
                testID="edit-name-row"
              />
            )}
          </Card>
        </View>

        {/* ── Language ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Language" colors={colors} />
          <Card colors={colors}>
            <ThemeOption
              label="English"
              value="en"
              currentValue={creds.user.language || "en"}
              onPress={() => updateNameMutation.mutate({ language: "en" })}
              colors={colors}
              icon="globe"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="French (Français)"
              value="fr"
              currentValue={creds.user.language || "en"}
              onPress={() => updateNameMutation.mutate({ language: "fr" })}
              colors={colors}
              icon="globe"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="German (Deutsch)"
              value="de"
              currentValue={creds.user.language || "en"}
              onPress={() => updateNameMutation.mutate({ language: "de" })}
              colors={colors}
              icon="globe"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="Spanish (Español)"
              value="es"
              currentValue={creds.user.language || "en"}
              onPress={() => updateNameMutation.mutate({ language: "es" })}
              colors={colors}
              icon="globe"
            />
          </Card>
        </View>

        {/* ── Notifications ────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Notifications" colors={colors} />
          <Card colors={colors}>
            <ThemeOption
              label="Instant"
              value="instant"
              currentValue={creds.user.notification_email_frequency || "instant"}
              onPress={() => updateNameMutation.mutate({ notification_email_frequency: "instant" })}
              colors={colors}
              icon="zap"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="Daily Digest"
              value="daily"
              currentValue={creds.user.notification_email_frequency || "instant"}
              onPress={() => updateNameMutation.mutate({ notification_email_frequency: "daily" })}
              colors={colors}
              icon="calendar"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="Weekly Digest"
              value="weekly"
              currentValue={creds.user.notification_email_frequency || "instant"}
              onPress={() => updateNameMutation.mutate({ notification_email_frequency: "weekly" })}
              colors={colors}
              icon="list"
            />
            <Divider colors={colors} />
            <ThemeOption
              label="Never"
              value="never"
              currentValue={creds.user.notification_email_frequency || "instant"}
              onPress={() => updateNameMutation.mutate({ notification_email_frequency: "never" })}
              colors={colors}
              icon="x-circle"
            />
          </Card>
        </View>

        {/* ── Security ────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Security" colors={colors} />
          <Card colors={colors}>
            {activeForm === "password" ? (
              <View style={{ padding: 14 }}>
                <InlineForm
                  title="Change password"
                  fields={[
                    { key: "old", label: "Current password", placeholder: "Current password", secure: true, value: oldPassword, onChange: setOldPassword },
                    { key: "new", label: "New password", placeholder: "New password (8+ chars)", secure: true, value: newPassword, onChange: setNewPassword },
                    { key: "confirm", label: "Confirm new password", placeholder: "Confirm new password", secure: true, value: confirmPassword, onChange: setConfirmPassword },
                  ]}
                  submitLabel="Change password"
                  onSubmit={() => changePasswordMutation.mutate()}
                  onCancel={resetForms}
                  pending={changePasswordMutation.isPending}
                  colors={colors}
                />
              </View>
            ) : (
              <NavRow
                label="Change password"
                icon="lock"
                onPress={() => setActiveForm("password")}
                colors={colors}
                testID="change-password-row"
              />
            )}
          </Card>
        </View>

        {/* ── Email ───────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Email" colors={colors} />
          <Card colors={colors}>
            {activeForm === "email" ? (
              <View style={{ padding: 14 }}>
                <InlineForm
                  title="Change email"
                  fields={[
                    { key: "email", label: "New email address", placeholder: "new@example.com", value: newEmail, onChange: setNewEmail },
                    { key: "password", label: "Current password", placeholder: "Confirm with your password", secure: true, value: emailPassword, onChange: setEmailPassword },
                  ]}
                  submitLabel="Send confirmation"
                  onSubmit={() => changeEmailMutation.mutate()}
                  onCancel={resetForms}
                  pending={changeEmailMutation.isPending}
                  colors={colors}
                />
              </View>
            ) : (
              <NavRow
                label="Change email"
                subtitle={creds.user.email}
                icon="at-sign"
                onPress={() => setActiveForm("email")}
                colors={colors}
                testID="change-email-row"
              />
            )}
            <Divider colors={colors} />
            <NavRow
              label="Active sessions"
              subtitle="Manage your signed-in devices"
              icon="monitor"
              onPress={() => router.push("/settings/sessions")}
              colors={colors}
              testID="active-sessions-row"
            />
            <Divider colors={colors} />
            <NavRow
              label="Resend verification email"
              icon="send"
              onPress={() => resendVerificationMutation.mutate()}
              colors={colors}
              testID="resend-verification-row"
            />
          </Card>
        </View>

        {/* ── Appearance ──────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Appearance" colors={colors} />
          <Card colors={colors}>
            <ThemeOption label="System" value="system" currentValue={theme} onPress={() => setTheme("system")} colors={colors} icon="monitor" />
            <Divider colors={colors} />
            <ThemeOption label="Light" value="light" currentValue={theme} onPress={() => setTheme("light")} colors={colors} icon="sun" />
            <Divider colors={colors} />
            <ThemeOption label="Dark" value="dark" currentValue={theme} onPress={() => setTheme("dark")} colors={colors} icon="moon" />
          </Card>
        </View>

        {/* ── Admin (superusers only) ──────────────────────────────────── */}
        {isSuperuser && (
          <View style={s.section}>
            <SectionTitle label="Administration" colors={colors} />
            <Card colors={colors}>
              <NavRow
                label="Admin Panel"
                subtitle="Instance administration"
                icon="shield"
                iconColor={colors.primary}
                onPress={() => router.push("/admin")}
                colors={colors}
                testID="admin-panel-row"
              />
              <Divider colors={colors} />
              <NavRow
                label="Trash"
                subtitle="Restore or permanently delete items"
                icon="trash-2"
                onPress={() => router.push("/trash")}
                colors={colors}
                testID="trash-row"
              />
              <Divider colors={colors} />
              <NavRow
                label="Audit Log"
                subtitle="View workspace activity"
                icon="activity"
                onPress={() => router.push("/audit-log")}
                colors={colors}
              />
              <Divider colors={colors} />
              <NavRow
                label="API Tokens"
                subtitle="Manage database access"
                icon="key"
                onPress={() => router.push("/database-tokens")}
                colors={colors}
              />
            </Card>
          </View>
        )}

        {/* ── Developer ───────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Developer" colors={colors} />
          <Card colors={colors}>
            <NavRow
              label="Database Tokens"
              subtitle="API keys for external access"
              icon="key"
              iconColor={colors.primary}
              onPress={() => router.push("/database-tokens")}
              colors={colors}
              testID="database-tokens-row"
            />
          </Card>
        </View>

        {/* ── About ───────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="About" colors={colors} />
          <Card colors={colors}>
            <InfoRow label="Baserow URL" value={creds.baseUrl} icon="globe" colors={colors} />
            <Divider colors={colors} />
            <View style={[s.row, { paddingTop: 12, paddingBottom: 4 }]}>
              <Text style={[s.aboutText, { color: colors.mutedForeground }]}>
                This app connects directly to the Baserow REST API. Your session token is stored only on this device.
              </Text>
            </View>
          </Card>
        </View>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionTitle label="Danger Zone" colors={colors} />
          <Card colors={colors}>
            <NavRow
              label="Sign out"
              icon="log-out"
              iconColor={colors.destructive}
              onPress={confirmSignOut}
              colors={colors}
              testID="sign-out-row"
            />
            <Divider colors={colors} />
            <NavRow
              label="Delete account"
              subtitle="Schedules your account for permanent deletion"
              icon="user-x"
              iconColor={colors.destructive}
              onPress={confirmDeleteAccount}
              colors={colors}
              testID="delete-account-row"
            />
          </Card>
        </View>
      </ScrollView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderWidth: 1, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  rowValue: { fontFamily: "Inter_500Medium", fontSize: 15 },
  divider: { height: 1, marginLeft: 58 },
  aboutText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20, flex: 1 },
  // Inline form
  inlineForm: { gap: 12, padding: 12, borderWidth: 1 },
  inlineFormTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 4 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  inlineFormBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  inlineBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  inlineBtnCancel: { borderWidth: 1 },
  inlineBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
