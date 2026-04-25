import { Feather } from "@expo/vector-icons";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createApplication,
  createWorkspace,
  listApplications,
  listWorkspaces,
  type BaserowApplication,
  type BaserowApplicationType,
  type BaserowWorkspace,
} from "@/lib/baserow";

type WorkspaceGroup = {
  id: number;
  name: string;
  order?: number;
  applications: BaserowApplication[];
};

type CreateMenuOption = {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  type?: BaserowApplicationType;
  beta?: boolean;
  unavailableDescription?: string;
};

type CreateApplicationDraft = {
  workspaceId: number;
  workspaceName: string;
  option: CreateMenuOption;
  name: string;
};

const CREATE_MENU_OPTIONS: CreateMenuOption[] = [
  {
    key: "database",
    label: "Database",
    description: "Create an organized collection of structured data.",
    icon: "database",
    type: "database",
  },
  {
    key: "builder",
    label: "Application",
    description: "Easily build websites, web apps and portals without code.",
    icon: "layout",
    type: "builder",
    beta: true,
  },
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Visualize your data and metrics with charts, tables or graphs.",
    icon: "grid",
    type: "dashboard",
    beta: true,
  },
  {
    key: "automation",
    label: "Automation",
    description: "Automate repetitive tasks and workflows.",
    icon: "cpu",
    type: "automation",
    beta: true,
  },
  {
    key: "template",
    label: "From template",
    description: "Quickly start with one of our recommended templates.",
    icon: "file-text",
    unavailableDescription:
      "Template creation is not available in mobile yet. Use desktop Baserow for this flow.",
  },
  {
    key: "import",
    label: "Import data",
    description: "Add existing data from a Baserow instance.",
    icon: "download",
    unavailableDescription:
      "Import data is not available in mobile yet. Use desktop Baserow for this flow.",
  },
];

function defaultAppName(option: CreateMenuOption) {
  switch (option.type) {
    case "database":
      return "Untitled database";
    case "builder":
      return "Untitled application";
    case "dashboard":
      return "Untitled dashboard";
    case "automation":
      return "Untitled automation";
    default:
      return `Untitled ${option.label.toLowerCase()}`;
  }
}

function getApplicationMeta(app: BaserowApplication) {
  if (app.type === "database") {
    const tableCount = app.tables?.length ?? 0;
    return {
      icon: "database" as const,
      badge: null,
      hint:
        tableCount === 0
          ? "No tables"
          : tableCount === 1
            ? "1 table"
            : `${tableCount} tables`,
    };
  }

  if (app.type === "builder") {
    return {
      icon: "layout" as const,
      badge: "Beta",
      hint: "Application",
    };
  }

  if (app.type === "dashboard") {
    return {
      icon: "grid" as const,
      badge: "Beta",
      hint: "Dashboard",
    };
  }

  if (app.type === "automation") {
    return {
      icon: "cpu" as const,
      badge: "Beta",
      hint: "Automation",
    };
  }

  return {
    icon: "box" as const,
    badge: null,
    hint: app.type,
  };
}

export default function WorkspacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { signOut, apiCall } = useAuth();
  const queryClient = useQueryClient();

  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("Untitled Workspace");
  const [menuWorkspace, setMenuWorkspace] = useState<WorkspaceGroup | null>(null);
  const [createAppDraft, setCreateAppDraft] =
    useState<CreateApplicationDraft | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) =>
      apiCall((c) =>
        createWorkspace(c, {
          name: name.trim() || "Untitled Workspace",
        }),
      ),
    onSuccess: async (workspace) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["workspaces", creds.baseUrl, creds.user.id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["applications", creds.baseUrl, creds.user.id],
        }),
      ]);
      setWorkspaceModalOpen(false);
      setWorkspaceName("Untitled Workspace");
      setMenuWorkspace({
        id: workspace.id,
        name: workspace.name,
        order: workspace.order,
        applications: [],
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not create workspace", message);
    },
  });

  const createApplicationMutation = useMutation({
    mutationFn: (draft: CreateApplicationDraft) =>
      apiCall((c) =>
        createApplication(c, draft.workspaceId, {
          name: draft.name.trim() || defaultAppName(draft.option),
          type: draft.option.type!,
          init_with_data: false,
        }),
      ),
    onSuccess: async (application, draft) => {
      await queryClient.invalidateQueries({
        queryKey: ["applications", creds.baseUrl, creds.user.id],
      });
      setCreateAppDraft(null);
      if (application.type === "database") {
        router.push({
          pathname: "/(app)/database/[id]",
          params: {
            id: String(application.id),
            name: application.name,
          },
        });
        return;
      }
      Alert.alert(
        `${draft.option.label} created`,
        `"${application.name}" was added to ${draft.workspaceName}. Opening this type in mobile is coming next.`,
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not create item", message);
    },
  });

  const groups = useMemo<WorkspaceGroup[]>(() => {
    const workspaces = workspacesQuery.data ?? [];
    const apps = applicationsQuery.data ?? [];
    const map = new Map<number, WorkspaceGroup>();

    for (const workspace of workspaces) {
      map.set(workspace.id, {
        id: workspace.id,
        name: workspace.name,
        order: workspace.order,
        applications: [],
      });
    }

    for (const app of apps) {
      const ws = app.workspace ?? app.group ?? { id: 0, name: "Workspace" };
      const existing = map.get(ws.id);
      if (existing) {
        existing.applications.push(app);
      } else {
        map.set(ws.id, {
          id: ws.id,
          name: ws.name,
          order: ws.order,
          applications: [app],
        });
      }
    }

    return Array.from(map.values())
      .map((group) => ({
        ...group,
        applications: group.applications.sort((a, b) => a.order - b.order),
      }))
      .sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      });
  }, [applicationsQuery.data, workspacesQuery.data]);

  const loading = workspacesQuery.isLoading || applicationsQuery.isLoading;
  const errored = workspacesQuery.isError || applicationsQuery.isError;
  const error =
    (workspacesQuery.error as Error | null) ??
    (applicationsQuery.error as Error | null);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  const refreshAll = () => {
    workspacesQuery.refetch();
    applicationsQuery.refetch();
  };

  const openCreateMenu = (workspace: WorkspaceGroup) => {
    setMenuWorkspace(workspace);
  };

  const handleMenuOptionPress = (option: CreateMenuOption) => {
    if (!menuWorkspace) return;
    if (!option.type) {
      setMenuWorkspace(null);
      Alert.alert(option.label, option.unavailableDescription ?? "Coming soon.");
      return;
    }
    setMenuWorkspace(null);
    setCreateAppDraft({
      workspaceId: menuWorkspace.id,
      workspaceName: menuWorkspace.name,
      option,
      name: defaultAppName(option),
    });
  };

  const handleApplicationPress = (app: BaserowApplication) => {
    if (app.type === "database") {
      router.push({
        pathname: "/(app)/database/[id]",
        params: {
          id: String(app.id),
          name: app.name,
        },
      });
      return;
    }

    const meta = getApplicationMeta(app);
    Alert.alert(
      app.name,
      `${meta.hint} creation is now available on mobile. Opening and editing this type in mobile is coming next.`,
    );
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Your data",
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                hitSlop={10}
                onPress={() => setWorkspaceModalOpen(true)}
                style={({ pressed }) => [
                  styles.headerIconButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather
                  name="plus"
                  size={16}
                  color={colors.primaryForeground}
                />
              </Pressable>
              <Pressable
                hitSlop={10}
                onPress={() => router.push("/(app)/settings")}
                style={styles.headerPlainButton}
              >
                <Feather
                  name="settings"
                  size={20}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
          ),
        }}
      />

      {loading ? (
        <LoadingState />
      ) : errored ? (
        <ErrorState
          title="Could not load your workspaces"
          message={error?.message ?? "Please try again."}
          onRetry={refreshAll}
        />
      ) : groups.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="folder"
            title="No workspaces yet"
            description="Create a workspace to start adding databases, applications, dashboards, and automations."
          />
          <Button
            title="Create workspace"
            onPress={() => setWorkspaceModalOpen(true)}
            style={styles.emptyButton}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={
                workspacesQuery.isRefetching || applicationsQuery.isRefetching
              }
              onRefresh={refreshAll}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: colors.mutedForeground }]}>
              Signed in as
            </Text>
            <Text style={[styles.greetingEmail, { color: colors.foreground }]}>
              {creds.user.email}
            </Text>
          </View>

          {groups.map((group) => (
            <View key={group.id} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.mutedForeground }]}
                >
                  {group.name}
                </Text>
                <Pressable
                  onPress={() => openCreateMenu(group)}
                  style={({ pressed }) => [
                    styles.addNewButton,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.88 : 1,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Feather
                    name="plus"
                    size={15}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.addNewButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Add new...
                  </Text>
                </Pressable>
              </View>

              {group.applications.length === 0 ? (
                <View
                  style={[
                    styles.emptyWorkspaceCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.emptyWorkspaceTitle,
                      { color: colors.foreground },
                    ]}
                  >
                    This workspace is empty
                  </Text>
                  <Text
                    style={[
                      styles.emptyWorkspaceText,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    Add a database or one of the desktop-style beta surfaces to get
                    started.
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  {group.applications.map((app, idx) => {
                    const meta = getApplicationMeta(app);
                    return (
                      <Pressable
                        key={app.id}
                        onPress={() => handleApplicationPress(app)}
                        style={({ pressed }) => [
                          styles.dbRow,
                          {
                            backgroundColor: pressed
                              ? colors.surface
                              : "transparent",
                            borderTopColor: colors.border,
                            borderTopWidth: idx === 0 ? 0 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.dbIcon,
                            {
                              backgroundColor: colors.muted,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <Feather
                            name={meta.icon}
                            size={16}
                            color={colors.mutedForeground}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.appNameRow}>
                            <Text
                              style={[styles.dbName, { color: colors.foreground }]}
                              numberOfLines={1}
                            >
                              {app.name}
                            </Text>
                            {meta.badge ? (
                              <View
                                style={[
                                  styles.betaBadge,
                                  { backgroundColor: colors.secondary },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.betaBadgeText,
                                    { color: colors.primary },
                                  ]}
                                >
                                  {meta.badge}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={[
                              styles.dbHint,
                              { color: colors.mutedForeground },
                            ]}
                          >
                            {meta.hint}
                          </Text>
                        </View>
                        <Feather
                          name="chevron-right"
                          size={18}
                          color={colors.mutedForeground}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}

          <Pressable
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
            style={({ pressed }) => [
              styles.signOut,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="log-out" size={14} color={colors.mutedForeground} />
            <Text
              style={[styles.signOutText, { color: colors.mutedForeground }]}
            >
              Sign out
            </Text>
          </Pressable>
        </ScrollView>
      )}

      <NamePromptModal
        visible={workspaceModalOpen}
        title="Create new workspace"
        label="Name"
        value={workspaceName}
        onChangeText={setWorkspaceName}
        onClose={() => {
          setWorkspaceModalOpen(false);
          setWorkspaceName("Untitled Workspace");
        }}
        actionLabel="Add workspace"
        onSubmit={() => createWorkspaceMutation.mutate(workspaceName)}
        loading={createWorkspaceMutation.isPending}
      />

      <CreateMenuModal
        open={!!menuWorkspace}
        workspaceName={menuWorkspace?.name ?? ""}
        options={CREATE_MENU_OPTIONS}
        onClose={() => setMenuWorkspace(null)}
        onSelect={handleMenuOptionPress}
      />

      <NamePromptModal
        visible={!!createAppDraft}
        title={
          createAppDraft
            ? `Create ${createAppDraft.option.label.toLowerCase()}`
            : "Create"
        }
        label="Name"
        value={createAppDraft?.name ?? ""}
        onChangeText={(text) =>
          setCreateAppDraft((current) =>
            current ? { ...current, name: text } : current,
          )
        }
        onClose={() => setCreateAppDraft(null)}
        actionLabel={
          createAppDraft?.option.label === "Database"
            ? "Add database"
            : `Add ${createAppDraft?.option.label.toLowerCase() ?? "item"}`
        }
        onSubmit={() => {
          if (createAppDraft) createApplicationMutation.mutate(createAppDraft);
        }}
        loading={createApplicationMutation.isPending}
        helperText={
          createAppDraft
            ? `This will be added to ${createAppDraft.workspaceName}.`
            : undefined
        }
      />
    </View>
  );
}

function CreateMenuModal({
  open,
  workspaceName,
  options,
  onClose,
  onSelect,
}: {
  open: boolean;
  workspaceName: string;
  options: CreateMenuOption[];
  onClose: () => void;
  onSelect: (option: CreateMenuOption) => void;
}) {
  const colors = useColors();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={open}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.menuSheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius + 8,
            },
          ]}
        >
          <Text style={[styles.menuTitle, { color: colors.foreground }]}>
            Add new...
          </Text>
          <Text style={[styles.menuSubtitle, { color: colors.mutedForeground }]}>
            {workspaceName}
          </Text>

          {options.map((option, idx) => (
            <Pressable
              key={option.key}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.menuItem,
                {
                  borderTopWidth: idx === 0 ? 0 : 1,
                  borderTopColor: colors.border,
                  backgroundColor: pressed ? colors.surface : "transparent",
                },
              ]}
            >
              <View
                style={[
                  styles.menuIconWrap,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Feather
                  name={option.icon}
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.menuItemTitleRow}>
                  <Text
                    style={[styles.menuItemTitle, { color: colors.foreground }]}
                  >
                    {option.label}
                  </Text>
                  {option.beta ? (
                    <View
                      style={[
                        styles.betaBadge,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text
                        style={[styles.betaBadgeText, { color: colors.primary }]}
                      >
                        Beta
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.menuItemDescription,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {option.description}
                </Text>
              </View>
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function NamePromptModal({
  visible,
  title,
  label,
  value,
  onChangeText,
  onClose,
  actionLabel,
  onSubmit,
  loading,
  helperText,
}: {
  visible: boolean;
  title: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  actionLabel: string;
  onSubmit: () => void;
  loading?: boolean;
  helperText?: string;
}) {
  const colors = useColors();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.promptCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius + 8,
            },
          ]}
        >
          <View style={styles.promptHeader}>
            <Text style={[styles.promptTitle, { color: colors.foreground }]}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View
            style={[
              styles.promptDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <Text style={[styles.promptLabel, { color: colors.foreground }]}>
            {label}
          </Text>

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={label}
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="sentences"
            autoCorrect={false}
            style={[
              styles.promptInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.primary,
                borderRadius: colors.radius,
              },
            ]}
          />

          {helperText ? (
            <Text
              style={[styles.promptHelperText, { color: colors.mutedForeground }]}
            >
              {helperText}
            </Text>
          ) : null}

          <View style={styles.promptActionRow}>
            <Button
              title={actionLabel}
              onPress={onSubmit}
              loading={loading}
              style={styles.promptActionButton}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPlainButton: {
    paddingHorizontal: 4,
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greetingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  greetingEmail: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    flex: 1,
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  addNewButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  dbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dbIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  appNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dbName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    flexShrink: 1,
  },
  dbHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  betaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  betaBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyButton: {
    marginTop: 20,
  },
  emptyWorkspaceCard: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyWorkspaceTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  emptyWorkspaceText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 20,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  menuSheet: {
    width: "100%",
    maxWidth: 560,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  menuSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  menuItemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
  },
  menuItemDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  promptCard: {
    width: "100%",
    maxWidth: 720,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  promptTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    flex: 1,
  },
  promptDivider: {
    height: 1,
    marginTop: 16,
    marginBottom: 18,
  },
  promptLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 10,
  },
  promptInput: {
    minHeight: 56,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  promptHelperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },
  promptActionRow: {
    marginTop: 24,
    alignItems: "flex-end",
  },
  promptActionButton: {
    minWidth: 200,
  },
});
