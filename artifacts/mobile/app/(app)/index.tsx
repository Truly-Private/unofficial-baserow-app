import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  getJob,
  importApplicationsAsync,
  installTemplateAsync,
  listApplications,
  listTemplates,
  listWorkspaces,
  uploadImportResource,
  type BaserowApplication,
  type BaserowApplicationType,
  type BaserowJob,
  type BaserowTemplate,
  type BaserowTemplateCategory,
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
  action?: "template" | "import";
};

type CreateApplicationDraft = {
  workspaceId: number;
  workspaceName: string;
  option: CreateMenuOption;
  name: string;
};

type ImportFileDraft = {
  uri: string;
  name: string;
  type?: string;
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
    action: "template",
  },
  {
    key: "import",
    label: "Import data",
    description: "Add existing data from a Baserow instance.",
    icon: "download",
    action: "import",
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

function appRouteFor(application: Pick<BaserowApplication, "id" | "name" | "type">) {
  if (application.type === "database") return "/(app)/database/[id]" as const;
  if (application.type === "dashboard") return "/(app)/dashboard/[id]" as const;
  if (application.type === "automation") return "/(app)/automation/[id]" as const;
  if (application.type === "builder") return "/(app)/builder/[id]" as const;
  return null;
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

function getApplicationWebUrl(baseUrl: string, app: { id: number; type: BaserowApplicationType }) {
  const base = baseUrl.replace(/\/+$/, "");
  switch (app.type) {
    case "builder":
      return `${base}/builder/${app.id}`;
    case "dashboard":
      return `${base}/dashboard/${app.id}`;
    case "automation":
      return `${base}/automation/${app.id}`;
    default:
      return base;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const [templateWorkspace, setTemplateWorkspace] =
    useState<WorkspaceGroup | null>(null);
  const [importWorkspace, setImportWorkspace] =
    useState<WorkspaceGroup | null>(null);
  const [importFile, setImportFile] = useState<ImportFileDraft | null>(null);

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
  });

  const applicationsQuery = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const templatesQuery = useQuery({
    queryKey: ["templates", creds.baseUrl],
    queryFn: () => apiCall((c) => listTemplates(c)),
    enabled: !!templateWorkspace,
  });

  const refreshAll = async () => {
    await Promise.all([
      workspacesQuery.refetch(),
      applicationsQuery.refetch(),
      templateWorkspace ? templatesQuery.refetch() : Promise.resolve(),
    ]);
  };

  const invalidateWorkspaceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["workspaces", creds.baseUrl, creds.user.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["applications", creds.baseUrl, creds.user.id],
      }),
    ]);
  };

  const monitorJobUntilSettled = async (jobId: number): Promise<BaserowJob> => {
    let lastJob: BaserowJob | null = null;

    for (let attempt = 0; attempt < 45; attempt += 1) {
      const job = await apiCall((c) => getJob(c, jobId));
      lastJob = job;

      if (job.state === "finished") {
        await invalidateWorkspaceData();
        return job;
      }

      if (job.state === "failed" || job.state === "cancelled") {
        throw new Error(job.human_readable_error || `Job ${job.state}`);
      }

      await delay(2000);
    }

    if (lastJob) return lastJob;
    throw new Error("Timed out waiting for background job");
  };

  const createWorkspaceMutation = useMutation({
    mutationFn: (name: string) =>
      apiCall((c) =>
        createWorkspace(c, {
          name: name.trim() || "Untitled Workspace",
        }),
      ),
    onSuccess: async (workspace) => {
      await invalidateWorkspaceData();
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
      await invalidateWorkspaceData();
      setCreateAppDraft(null);
      const route = appRouteFor(application);
      if (route) {
        router.push({
          pathname: route,
          params: {
            id: String(application.id),
            name: application.name,
          },
        });
        return;
      }
      Alert.alert(
        `${draft.option.label} created`,
        `"${application.name}" was added to ${draft.workspaceName}. Opening in browser...`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open",
            onPress: () =>
              void WebBrowser.openBrowserAsync(
                getApplicationWebUrl(creds.baseUrl, application),
              ),
          },
        ],
      );
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not create item", message);
    },
  });

  const installTemplateMutation = useMutation({
    mutationFn: async ({
      workspace,
      template,
    }: {
      workspace: WorkspaceGroup;
      template: BaserowTemplate;
    }) => {
      const job = await apiCall((c) =>
        installTemplateAsync(c, workspace.id, template.id),
      );
      return { workspace, template, job };
    },
    onSuccess: ({ workspace, template, job }) => {
      setTemplateWorkspace(null);
      Alert.alert(
        "Template install started",
        `Installing "${template.name}" into ${workspace.name}. We'll refresh your workspace when it's finished.`,
      );

      void monitorJobUntilSettled(job.id)
        .then(() => {
          Alert.alert(
            "Template installed",
            `"${template.name}" is now available in ${workspace.name}.`,
          );
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Please try again.";
          Alert.alert("Template install failed", message);
        });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not install template", message);
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({
      workspace,
      file,
    }: {
      workspace: WorkspaceGroup;
      file: ImportFileDraft;
    }) => {
      const resource = await apiCall((c) =>
        uploadImportResource(c, workspace.id, file),
      );
      const job = await apiCall((c) =>
        importApplicationsAsync(c, workspace.id, resource.id),
      );
      return { workspace, file, job };
    },
    onSuccess: ({ workspace, file, job }) => {
      setImportWorkspace(null);
      setImportFile(null);
      Alert.alert(
        "Import started",
        `Uploading and importing "${file.name}" into ${workspace.name}. We'll refresh the workspace when the import finishes.`,
      );

      void monitorJobUntilSettled(job.id)
        .then(() => {
          Alert.alert(
            "Import finished",
            `Imported data is now available in ${workspace.name}.`,
          );
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : "Please try again.";
          Alert.alert("Import failed", message);
        });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not import data", message);
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

  const openCreateMenu = (workspace: WorkspaceGroup) => {
    setMenuWorkspace(workspace);
  };

  const handleMenuOptionPress = (option: CreateMenuOption) => {
    if (!menuWorkspace) return;

    if (option.action === "template") {
      setTemplateWorkspace(menuWorkspace);
      setMenuWorkspace(null);
      return;
    }

    if (option.action === "import") {
      setImportWorkspace(menuWorkspace);
      setImportFile(null);
      setMenuWorkspace(null);
      return;
    }

    if (!option.type) return;

    setCreateAppDraft({
      workspaceId: menuWorkspace.id,
      workspaceName: menuWorkspace.name,
      option,
      name: defaultAppName(option),
    });
    setMenuWorkspace(null);
  };

  const handleApplicationPress = (app: BaserowApplication) => {
    const route = appRouteFor(app);
    if (route) {
      router.push({
        pathname: route,
        params: {
          id: String(app.id),
          name: app.name,
        },
      });
      return;
    }

    void WebBrowser.openBrowserAsync(getApplicationWebUrl(creds.baseUrl, app));
  };

  const pickImportFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    setImportFile({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? undefined,
    });
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
          onRetry={() => void refreshAll()}
        />
      ) : groups.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="folder"
            title="No workspaces yet"
            description="Create a workspace to start adding databases, applications, dashboards, automations, templates, and imports."
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
              onRefresh={() => void refreshAll()}
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
                    Add a database, install a template, or import existing data to
                    get started.
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

      <TemplatePickerModal
        visible={!!templateWorkspace}
        workspaceName={templateWorkspace?.name ?? ""}
        categories={templatesQuery.data ?? []}
        loading={templatesQuery.isLoading}
        installing={installTemplateMutation.isPending}
        onClose={() => setTemplateWorkspace(null)}
        onSelect={(template) => {
          if (!templateWorkspace) return;
          installTemplateMutation.mutate({
            workspace: templateWorkspace,
            template,
          });
        }}
      />

      <ImportDataModal
        visible={!!importWorkspace}
        workspaceName={importWorkspace?.name ?? ""}
        file={importFile}
        loading={importMutation.isPending}
        onClose={() => {
          setImportWorkspace(null);
          setImportFile(null);
        }}
        onPickFile={() => void pickImportFile()}
        onImport={() => {
          if (!importWorkspace || !importFile) return;
          importMutation.mutate({
            workspace: importWorkspace,
            file: importFile,
          });
        }}
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

type TemplateSelection = {
  template: BaserowTemplate;
  category: BaserowTemplateCategory;
};

function trimmedKeywords(template: BaserowTemplate): string {
  return template.keywords?.trim() ?? "";
}

const ICONOIR_TO_FEATHER: Record<string, keyof typeof Feather.glyphMap> = {
  "database-star": "database",
  "calendar-check": "calendar",
  "check-circle": "check-circle",
  "check-square": "check-square",
  "bar-chart": "bar-chart-2",
  "pie-chart": "pie-chart",
  "shopping-bag": "shopping-bag",
  "shopping-cart": "shopping-cart",
  "book-open": "book-open",
  "map-pin": "map-pin",
  "home-simple": "home",
  database: "database",
  calendar: "calendar",
  task: "check-square",
  briefcase: "briefcase",
  users: "users",
  user: "user",
  chart: "bar-chart-2",
  shopping: "shopping-cart",
  inbox: "inbox",
  mail: "mail",
  book: "book",
  map: "map",
  star: "star",
  heart: "heart",
  settings: "settings",
  home: "home",
  code: "code",
  phone: "phone",
  camera: "camera",
  image: "image",
  folder: "folder",
  file: "file-text",
  page: "file-text",
  notes: "edit",
  edit: "edit",
  tag: "tag",
  layers: "layers",
  layout: "layout",
  grid: "grid",
  list: "list",
  cpu: "cpu",
  clock: "clock",
  activity: "activity",
  truck: "truck",
  package: "package",
  box: "box",
  globe: "globe",
  link: "link",
  target: "target",
  award: "award",
  flag: "flag",
  tool: "tool",
  wrench: "tool",
  zap: "zap",
};

function templateIconName(icon?: string): keyof typeof Feather.glyphMap {
  if (!icon) return "file-text";
  const part = icon.replace(/^iconoir-/, "").toLowerCase();
  const sortedKeys = Object.keys(ICONOIR_TO_FEATHER).sort(
    (a, b) => b.length - a.length,
  );
  for (const key of sortedKeys) {
    if (part === key || part.includes(key)) return ICONOIR_TO_FEATHER[key]!;
  }
  return "file-text";
}

function TemplatePickerModal({
  visible,
  workspaceName,
  categories,
  loading,
  installing,
  onClose,
  onSelect,
}: {
  visible: boolean;
  workspaceName: string;
  categories: BaserowTemplateCategory[];
  loading: boolean;
  installing: boolean;
  onClose: () => void;
  onSelect: (template: BaserowTemplate) => void;
}) {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [templateDetail, setTemplateDetail] = useState<TemplateSelection | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setSelectedCategoryId(null);
      setTemplateDetail(null);
    }
  }, [visible]);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = categories;
    if (selectedCategoryId !== null) {
      result = result.filter((c) => c.id === selectedCategoryId);
    }
    if (!term) return result;
    return result
      .map((category) => ({
        ...category,
        templates: category.templates.filter((template) => {
          const haystack = `${template.name} ${template.slug} ${template.keywords ?? ""}`.toLowerCase();
          return haystack.includes(term);
        }),
      }))
      .filter((category) => category.templates.length > 0);
  }, [categories, search, selectedCategoryId]);

  const handleCategoryChipPress = (id: number | null) => {
    setSelectedCategoryId(id);
    setSearch("");
  };

  const handleTemplatePress = (template: BaserowTemplate, category: BaserowTemplateCategory) => {
    setTemplateDetail({ template, category });
  };

  const handleInstall = () => {
    if (!templateDetail) return;
    onSelect(templateDetail.template);
    setTemplateDetail(null);
  };

  const handleDetailClose = () => {
    setTemplateDetail(null);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={templateDetail ? handleDetailClose : onClose}
    >
      <Pressable
        style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]}
        onPress={templateDetail ? handleDetailClose : onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            styles.largeModalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius + 8,
            },
          ]}
        >
          {templateDetail ? (
            <TemplateDetailView
              selection={templateDetail}
              installing={installing}
              colors={colors}
              onBack={handleDetailClose}
              onInstall={handleInstall}
            />
          ) : (
            <>
              <View style={styles.promptHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promptTitle, { color: colors.foreground }]}>
                    Start from template
                  </Text>
                  <Text
                    style={[styles.promptHelperText, { color: colors.mutedForeground }]}
                  >
                    Install a Baserow template into {workspaceName}.
                  </Text>
                </View>
                <Pressable onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <TextInput
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  if (text.trim()) setSelectedCategoryId(null);
                }}
                placeholder="Search templates"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              />

              {!loading && categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChipsRow}
                  style={styles.categoryChipsScroll}
                >
                  <Pressable
                    onPress={() => handleCategoryChipPress(null)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          selectedCategoryId === null
                            ? colors.primary
                            : colors.muted,
                        borderColor:
                          selectedCategoryId === null
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color:
                            selectedCategoryId === null
                              ? colors.primaryForeground
                              : colors.mutedForeground,
                        },
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>
                  {categories.map((category) => (
                    <Pressable
                      key={category.id}
                      onPress={() => handleCategoryChipPress(category.id)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            selectedCategoryId === category.id
                              ? colors.primary
                              : colors.muted,
                          borderColor:
                            selectedCategoryId === category.id
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color:
                              selectedCategoryId === category.id
                                ? colors.primaryForeground
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {loading ? (
                <LoadingState />
              ) : filteredCategories.length === 0 ? (
                <View style={styles.modalEmptyWrap}>
                  <EmptyState
                    icon="file-text"
                    title="No templates found"
                    description="Try a different search or category."
                  />
                </View>
              ) : (
                <ScrollView
                  style={styles.modalScroll}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {filteredCategories.map((category) => (
                    <View key={category.id} style={styles.templateSection}>
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: colors.mutedForeground, marginLeft: 0 },
                        ]}
                      >
                        {category.name}
                      </Text>

                      <View
                        style={[
                          styles.card,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                            borderRadius: colors.radius,
                          },
                        ]}
                      >
                        {category.templates.map((template, idx) => (
                          <Pressable
                            key={template.id}
                            onPress={() => handleTemplatePress(template, category)}
                            disabled={installing}
                            style={({ pressed }) => [
                              styles.templateRow,
                              {
                                backgroundColor: pressed ? colors.surface : "transparent",
                                borderTopColor: colors.border,
                                borderTopWidth: idx === 0 ? 0 : 1,
                                opacity: installing ? 0.6 : 1,
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.templateIconBox,
                                { backgroundColor: colors.secondary },
                              ]}
                            >
                              <Feather
                                name={templateIconName(template.icon)}
                                size={16}
                                color={colors.primary}
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.menuItemTitle,
                                  { color: colors.foreground },
                                ]}
                              >
                                {template.name}
                              </Text>
                              {!!trimmedKeywords(template) && (
                                <Text
                                  style={[
                                    styles.menuItemDescription,
                                    { color: colors.mutedForeground, marginTop: 2 },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {trimmedKeywords(template)}
                                </Text>
                              )}
                            </View>
                            <Feather
                              name="chevron-right"
                              size={18}
                              color={colors.mutedForeground}
                            />
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TemplateDetailView({
  selection,
  installing,
  colors,
  onBack,
  onInstall,
}: {
  selection: TemplateSelection;
  installing: boolean;
  colors: ReturnType<typeof useColors>;
  onBack: () => void;
  onInstall: () => void;
}) {
  const { template, category } = selection;
  const iconName = templateIconName(template.icon);

  return (
    <View style={styles.templateDetailWrap}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.templateDetailBack}>
        <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
        <Text style={[styles.templateDetailBackText, { color: colors.mutedForeground }]}>
          {category.name}
        </Text>
      </Pressable>

      <View style={styles.templateDetailBody}>
        <View
          style={[
            styles.templateDetailIcon,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Feather name={iconName} size={32} color={colors.primary} />
        </View>

        <Text style={[styles.templateDetailName, { color: colors.foreground }]}>
          {template.name}
        </Text>

        <View
          style={[
            styles.templateDetailCategoryBadge,
            { backgroundColor: colors.muted },
          ]}
        >
          <Text
            style={[
              styles.templateDetailCategoryText,
              { color: colors.mutedForeground },
            ]}
          >
            {category.name}
          </Text>
        </View>

        {!!trimmedKeywords(template) && (
          <Text
            style={[
              styles.templateDetailDescription,
              { color: colors.mutedForeground },
            ]}
          >
            {trimmedKeywords(template)}
          </Text>
        )}
      </View>

      <View style={styles.templateDetailActions}>
        <Button
          title={installing ? "Installing…" : "Use this template"}
          onPress={onInstall}
          disabled={installing}
          style={styles.templateDetailInstallBtn}
        />
        <Pressable onPress={onBack} hitSlop={10} style={styles.templateDetailCancelBtn}>
          <Text style={[styles.templateDetailCancelText, { color: colors.mutedForeground }]}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ImportDataModal({
  visible,
  workspaceName,
  file,
  loading,
  onClose,
  onPickFile,
  onImport,
}: {
  visible: boolean;
  workspaceName: string;
  file: ImportFileDraft | null;
  loading: boolean;
  onClose: () => void;
  onPickFile: () => void;
  onImport: () => void;
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
              Import data
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <Text
            style={[styles.promptHelperText, { color: colors.mutedForeground }]}
          >
            Import an exported Baserow package into {workspaceName}. Pick a file
            from your device to upload and import.
          </Text>

          <Pressable
            onPress={onPickFile}
            style={({ pressed }) => [
              styles.importPicker,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderRadius: colors.radius,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Feather name="paperclip" size={18} color={colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemTitle, { color: colors.foreground }]}>
                {file ? file.name : "Choose import file"}
              </Text>
              <Text
                style={[
                  styles.menuItemDescription,
                  { color: colors.mutedForeground, marginTop: 4 },
                ]}
              >
                Supported by Baserow import endpoints after upload.
              </Text>
            </View>
          </Pressable>

          <View style={styles.promptActionRow}>
            <Button
              title="Start import"
              onPress={onImport}
              loading={loading}
              disabled={!file}
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
  largeModalCard: {
    width: "100%",
    maxWidth: 760,
    maxHeight: "85%",
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
  searchInput: {
    minHeight: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    marginTop: 16,
    marginBottom: 16,
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
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  modalEmptyWrap: {
    paddingVertical: 32,
  },
  templateSection: {
    marginBottom: 20,
  },
  templateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  importPicker: {
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 18,
  },
  categoryChipsScroll: {
    marginBottom: 12,
  },
  categoryChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  templateIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  templateDetailWrap: {
    flex: 1,
    justifyContent: "space-between",
  },
  templateDetailBack: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 16,
  },
  templateDetailBackText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  templateDetailBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 16,
    gap: 12,
  },
  templateDetailIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  templateDetailName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  templateDetailCategoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  templateDetailCategoryText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  templateDetailDescription: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 4,
  },
  templateDetailActions: {
    gap: 10,
    paddingTop: 8,
  },
  templateDetailInstallBtn: {
    width: "100%",
  },
  templateDetailCancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  templateDetailCancelText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
