import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  getFieldPermissions,
  updateFieldPermissions,
  listWorkspaceMembers,
  type FieldPermission,
  type WorkspaceMember,
} from "@/lib/baserow";

export default function FieldPermissionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();

  const params = useLocalSearchParams<{ 
    fieldId: string; 
    fieldName?: string;
    workspaceId: string;
  }>();
  
  const fieldId = Number(params.fieldId);
  const fieldName = params.fieldName ?? "Field";
  const workspaceId = Number(params.workspaceId);

  const [activeTab, setActiveTab] = useState<"read" | "write">("read");

  // ─── Queries ───────────────────────────────────────────────────────────────

  const permissionsQuery = useQuery({
    queryKey: ["field-permissions", fieldId],
    queryFn: () => apiCall((c) => getFieldPermissions(c, fieldId)),
    enabled: Number.isFinite(fieldId),
  });

  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: () => apiCall((c) => listWorkspaceMembers(c, workspaceId)),
    enabled: Number.isFinite(workspaceId),
  });

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const updatePermissionsMutation = useMutation({
    mutationFn: (data: Partial<FieldPermission>) =>
      apiCall((c) => updateFieldPermissions(c, fieldId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["field-permissions", fieldId] });
      Alert.alert("Success", "Permissions updated successfully.");
    },
    onError: (e) => Alert.alert("Error", e instanceof Error ? e.message : "Could not update permissions."),
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const toggleMember = (memberId: number, type: "read" | "write") => {
    if (!permissionsQuery.data) return;
    
    const data: any = (Array.isArray(permissionsQuery.data) ? permissionsQuery.data[0] : permissionsQuery.data) ?? {};
    const current: string[] = data[type === "read" ? "read_allowed_roles" : "write_allowed_roles"] || [];
    const role = `member:${memberId}`;
    
    let next: string[];
    if (current.includes(role)) {
      next = current.filter((r: string) => r !== role);
    } else {
      next = [...current, role];
    }

    updatePermissionsMutation.mutate({
      [type === "read" ? "read_allowed_roles" : "write_allowed_roles"]: next,
    });
  };

  const setRoleType = (roleType: "everyone" | "admins" | "members", type: "read" | "write") => {
    updatePermissionsMutation.mutate({
      [type === "read" ? "read_permission_type" : "write_permission_type"]: roleType,
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (permissionsQuery.isLoading || membersQuery.isLoading) return <LoadingState />;
  if (permissionsQuery.isError) return <ErrorState title="Error" message="Could not load permissions" />;

  const permissions: any = (Array.isArray(permissionsQuery.data) ? permissionsQuery.data[0] : permissionsQuery.data) ?? {};
  const members = membersQuery.data || [];
  
  const currentType = activeTab === "read" ? permissions.read_permission_type : permissions.write_permission_type;
  const currentRoles = activeTab === "read" ? permissions.read_allowed_roles : permissions.write_allowed_roles;

  const topPad = Math.max(insets.top, webInsets.top, 16);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Field Permissions — ${fieldName}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, activeTab === "read" && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab("read")}
        >
          <Text style={[styles.tabText, { color: activeTab === "read" ? colors.primary : colors.mutedForeground }]}>
            Who can Read
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "write" && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab("write")}
        >
          <Text style={[styles.tabText, { color: activeTab === "write" ? colors.primary : colors.mutedForeground }]}>
            Who can Write
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 20 }}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Permission Type
        </Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["everyone", "admins", "members"] as const).map((type) => (
            <Pressable
              key={type}
              style={[styles.option, { borderBottomColor: colors.border }]}
              onPress={() => setRoleType(type, activeTab)}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                  {type === "everyone" && "Everyone in the workspace can perform this action."}
                  {type === "admins" && "Only administrators can perform this action."}
                  {type === "members" && "Specific members or roles can perform this action."}
                </Text>
              </View>
              {currentType === type && (
                <Feather name="check" size={20} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {currentType === "members" && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 24 }]}>
              Specific Members
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {members.map((member) => {
                const isAllowed = currentRoles?.includes(`member:${member.user_id}`);
                return (
                  <Pressable
                    key={member.id}
                    style={[styles.option, { borderBottomColor: colors.border }]}
                    onPress={() => toggleMember(member.user_id, activeTab)}
                  >
                    <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.avatarText, { color: colors.foreground }]}>
                        {member.name?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.optionLabel, { color: colors.foreground }]}>
                        {member.name || member.email}
                      </Text>
                      <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>
                        {member.email}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: isAllowed ? colors.primary : colors.border },
                        isAllowed && { backgroundColor: colors.primary }
                      ]}
                    >
                      {isAllowed && <Feather name="check" size={12} color={colors.primaryForeground} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  optionLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
