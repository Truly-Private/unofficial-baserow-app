import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import type React from "react";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createApplicationIntegration,
  createApplicationUserSource,
  createApplicationSnapshot,
  askPublicBuilderDomainExists,
  createBuilderDomain,
  createBuilderPage,
  deleteApplicationIntegration,
  deleteBuilderDomain,
  deleteBuilderPage,
  duplicateBuilderPageAsync,
  listApplicationIntegrations,
  listApplicationSnapshots,
  listApplicationUserSourceRoles,
  listApplicationUserSourceUsers,
  listApplicationUserSources,
  listApplications,
  listBuilderDomains,
  listPublishedBuilderPageElements,
  listPublishedBuilderPageDataSources,
  listPublishedBuilderPageWorkflowActions,
  getPublicBuilderById,
  getPublicBuilderByName,
  getBuilderCustomCss,
  getBuilderCustomJs,
  getPublicBuilderCustomCss,
  getPublicBuilderCustomJs,
  moveApplicationIntegration,
  orderBuilderDomains,
  orderBuilderPages,
  publishBuilderDomainAsync,
  dispatchPublishedBuilderPageDataSources,
  updateApplicationIntegration,
  updateBuilderDomain,
  updateBuilderPage,
  updateBuilderTheme,
  type BaserowBuilderPage,
} from "@/lib/baserow";

type IntegrationFormState = {
  type: "local_baserow" | "smtp" | "ai" | "slack_bot";
  name: string;
  host: string;
  port: string;
  username: string;
  password: string;
  token: string;
  advancedJson: string;
};

type UserSourceFormState = {
  name: string;
  integrationId: string;
  tableId: string;
  emailFieldId: string;
  nameFieldId: string;
  roleFieldId: string;
  advancedJson: string;
};

const INTEGRATION_OPTIONS = [
  { type: "local_baserow", label: "Local Baserow", icon: "database" as const, description: "Use the current Baserow instance." },
  { type: "smtp", label: "SMTP", icon: "mail" as const, description: "Connect email sending settings." },
  { type: "ai", label: "AI", icon: "cpu" as const, description: "Use workspace AI settings or overrides." },
  { type: "slack_bot", label: "Slack bot", icon: "slack" as const, description: "Send Slack messages from builder services." },
] as const;

function parseOptionalObjectJson(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return parsed as Record<string, unknown>;
}

function parsePositiveInteger(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return parsed;
}

function blankIntegrationForm(): IntegrationFormState {
  return {
    type: "local_baserow",
    name: "Local Baserow",
    host: "",
    port: "587",
    username: "",
    password: "",
    token: "",
    advancedJson: "{}",
  };
}

function blankUserSourceForm(integrations: { id: number }[]): UserSourceFormState {
  return {
    name: "Users",
    integrationId: integrations[0]?.id ? String(integrations[0].id) : "",
    tableId: "",
    emailFieldId: "",
    nameFieldId: "",
    roleFieldId: "",
    advancedJson: "{}",
  };
}

function buildIntegrationPayload(form: IntegrationFormState) {
  const payload: Record<string, unknown> = { type: form.type, name: form.name.trim() || INTEGRATION_OPTIONS.find((option) => option.type === form.type)?.label };
  if (form.type === "smtp") {
    if (!form.host.trim()) throw new Error("Add an SMTP host.");
    payload.host = form.host.trim();
    payload.port = parsePositiveInteger(form.port, "SMTP port") ?? 587;
    payload.use_tls = true;
    if (form.username.trim()) payload.username = form.username.trim();
    if (form.password.trim()) payload.password = form.password;
  }
  if (form.type === "slack_bot") {
    if (!form.token.trim()) throw new Error("Add a Slack bot token.");
    payload.token = form.token.trim();
  }
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced);
  return payload;
}

function buildUserSourcePayload(form: UserSourceFormState) {
  const integrationId = parsePositiveInteger(form.integrationId, "Integration ID");
  if (!integrationId) throw new Error("Choose an integration ID.");
  const payload: Record<string, unknown> = {
    type: "local_baserow",
    name: form.name.trim() || "Users",
    integration_id: integrationId,
    auth_providers: [],
  };
  const tableId = parsePositiveInteger(form.tableId, "Table ID");
  const emailFieldId = parsePositiveInteger(form.emailFieldId, "Email field ID");
  const nameFieldId = parsePositiveInteger(form.nameFieldId, "Name field ID");
  const roleFieldId = parsePositiveInteger(form.roleFieldId, "Role field ID");
  if (tableId) payload.table_id = tableId;
  if (emailFieldId) payload.email_field_id = emailFieldId;
  if (nameFieldId) payload.name_field_id = nameFieldId;
  if (roleFieldId) payload.role_field_id = roleFieldId;
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced);
  return payload;
}

export default function BuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const builderId = Number(params.id);
  const fallbackName = params.name || "Application";
  const [createOpen, setCreateOpen] = useState(false);
  const [pageName, setPageName] = useState("Untitled page");
  const [jsonAction, setJsonAction] = useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);
  const [integrationForm, setIntegrationForm] = useState<IntegrationFormState | null>(null);
  const [userSourceForm, setUserSourceForm] = useState<UserSourceFormState | null>(null);

  const appsQuery = useQuery({ queryKey: ["applications", creds.baseUrl, creds.user.id], queryFn: () => apiCall((c) => listApplications(c)) });
  const domainsQuery = useQuery({ queryKey: ["builder", builderId, "domains"], queryFn: () => apiCall((c) => listBuilderDomains(c, builderId)) });
  const integrationsQuery = useQuery({ queryKey: ["builder", builderId, "integrations"], queryFn: () => apiCall((c) => listApplicationIntegrations(c, builderId)) });
  const userSourcesQuery = useQuery({ queryKey: ["builder", builderId, "userSources"], queryFn: () => apiCall((c) => listApplicationUserSources(c, builderId)) });
  const snapshotsQuery = useQuery({ queryKey: ["builder", builderId, "snapshots"], queryFn: () => apiCall((c) => listApplicationSnapshots(c, builderId)) });

  const builder = useMemo(() => (appsQuery.data ?? []).find((app) => app.id === builderId), [appsQuery.data, builderId]);
  const pages = ((builder?.pages ?? []) as BaserowBuilderPage[]).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const domains = domainsQuery.data ?? [];
  const integrations = integrationsQuery.data ?? [];
  const userSources = userSourcesQuery.data ?? [];
  const snapshots = snapshotsQuery.data ?? [];
  const firstPage = pages[0];
  const publicBuilderQuery = useQuery({
    queryKey: ["builder", builderId, "public"],
    queryFn: () => getPublicBuilderById(builderId, creds.baseUrl),
    enabled: domains.length > 0,
  });
  const publishedPageElementsQuery = useQuery({
    queryKey: ["builder", builderId, "public", "elements", firstPage?.id],
    queryFn: () =>
      firstPage
        ? listPublishedBuilderPageElements(firstPage.id, creds.baseUrl)
        : Promise.resolve(null),
    enabled: !!firstPage && domains.length > 0,
  });
  const publishedPageDataSourcesQuery = useQuery({
    queryKey: ["builder", builderId, "public", "dataSources", firstPage?.id],
    queryFn: () =>
      firstPage
        ? listPublishedBuilderPageDataSources(firstPage.id, creds.baseUrl)
        : Promise.resolve(null),
    enabled: !!firstPage && domains.length > 0,
  });
  const publishedPageActionsQuery = useQuery({
    queryKey: ["builder", builderId, "public", "workflowActions", firstPage?.id],
    queryFn: () =>
      firstPage
        ? listPublishedBuilderPageWorkflowActions(firstPage.id, creds.baseUrl)
        : Promise.resolve(null),
    enabled: !!firstPage && domains.length > 0,
  });
  const customCssQuery = useQuery({
    queryKey: ["builder", builderId, "customCode", "css"],
    queryFn: () => apiCall((c) => getBuilderCustomCss(c, builderId)),
  });
  const customJsQuery = useQuery({
    queryKey: ["builder", builderId, "customCode", "js"],
    queryFn: () => apiCall((c) => getBuilderCustomJs(c, builderId)),
  });
  const publicCustomCssQuery = useQuery({
    queryKey: ["builder", builderId, "customCode", "css", "public"],
    queryFn: () => getPublicBuilderCustomCss(builderId, creds.baseUrl),
    enabled: domains.length > 0,
  });
  const publicCustomJsQuery = useQuery({
    queryKey: ["builder", builderId, "customCode", "js", "public"],
    queryFn: () => getPublicBuilderCustomJs(builderId, creds.baseUrl),
    enabled: domains.length > 0,
  });
  const builderName = builder?.name || fallbackName;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  const refresh = async () => {
    await Promise.all([
      appsQuery.refetch(),
      domainsQuery.refetch(),
      integrationsQuery.refetch(),
      userSourcesQuery.refetch(),
      snapshotsQuery.refetch(),
      publicBuilderQuery.refetch(),
      publishedPageElementsQuery.refetch(),
      publishedPageDataSourcesQuery.refetch(),
      publishedPageActionsQuery.refetch(),
      customCssQuery.refetch(),
      customJsQuery.refetch(),
      publicCustomCssQuery.refetch(),
      publicCustomJsQuery.refetch(),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => apiCall((c) => createBuilderPage(c, builderId, { name: name.trim() || "Untitled page", path: "/" + (name.trim() || "untitled-page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
    onSuccess: async (page) => { await queryClient.invalidateQueries({ queryKey: ["applications", creds.baseUrl, creds.user.id] }); setCreateOpen(false); setPageName("Untitled page"); router.push({ pathname: "/(app)/builder/page/[id]", params: { id: String(page.id), name: page.name, builder: builderName } }); },
    onError: (error) => Alert.alert("Could not create page", error instanceof Error ? error.message : "Please try again."),
  });

  const actionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => { setJsonAction(null); setIntegrationForm(null); setUserSourceForm(null); await refresh(); },
    onError: (error) => Alert.alert("Builder action failed", error instanceof Error ? error.message : "Please try again."),
  });

  const publishMutation = useMutation({
    mutationFn: (domainId: number) => apiCall((c) => publishBuilderDomainAsync(c, domainId)),
    onSuccess: () => Alert.alert("Publish started", "Baserow is publishing this domain."),
    onError: (error) => Alert.alert("Could not publish domain", error instanceof Error ? error.message : "Please try again."),
  });

  return <View style={[styles.fill, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: builderName }} />
    {appsQuery.isLoading || domainsQuery.isLoading || integrationsQuery.isLoading || userSourcesQuery.isLoading || snapshotsQuery.isLoading ? <LoadingState /> : appsQuery.isError || domainsQuery.isError || integrationsQuery.isError || userSourcesQuery.isError || snapshotsQuery.isError ? (
      <ErrorState title="Could not load application" message={(appsQuery.error as Error | null)?.message ?? (domainsQuery.error as Error | null)?.message ?? (integrationsQuery.error as Error | null)?.message ?? (userSourcesQuery.error as Error | null)?.message ?? (snapshotsQuery.error as Error | null)?.message} onRetry={() => { void refresh(); }} />
    ) : !builder ? <EmptyState icon="layout" title="Application not found" description="It may have been removed. Pull to refresh." /> : (
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }} refreshControl={<RefreshControl refreshing={appsQuery.isRefetching || domainsQuery.isRefetching || integrationsQuery.isRefetching || userSourcesQuery.isRefetching || snapshotsQuery.isRefetching} onRefresh={() => { void refresh(); }} tintColor={colors.primary} />}>
        <View style={styles.headerWrap}>
          <Text style={[styles.crumb, { color: colors.mutedForeground }]}>Application Builder</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{builderName}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{pages.length} pages · {domains.length} domains · {integrations.length} integrations · {userSources.length} user sources · {snapshots.length} snapshots</Text>
          <View style={styles.headerButtonRow}>
            <Button title="New page" onPress={() => setCreateOpen(true)} />
            <Button title="New integration" variant="secondary" onPress={() => setIntegrationForm(blankIntegrationForm())} />
            <Button title="New user source" variant="secondary" onPress={() => setUserSourceForm(blankUserSourceForm(integrations))} />
            <Button title="Create page JSON" variant="secondary" onPress={() => setJsonAction({ title: "Create builder page", description: "Enter the exact page payload Baserow expects.", initialJson: '{\n  "name": "Untitled page",\n  "path": "/untitled-page"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPage(c, builderId, payload))) })} />
            <Button title="Create domain JSON" variant="secondary" onPress={() => setJsonAction({ title: "Create builder domain", description: "Enter the exact domain payload Baserow expects.", initialJson: '{\n  "domain_name": "example.com"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderDomain(c, builderId, payload))) })} />
            <Button title="Create integration JSON" variant="secondary" onPress={() => setJsonAction({ title: "Create integration", description: "Enter the exact application integration payload Baserow expects.", initialJson: '{\n  "type": "local_baserow"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createApplicationIntegration(c, builderId, payload))) })} />
            <Button title="Create user source JSON" variant="secondary" onPress={() => setJsonAction({ title: "Create user source", description: "Enter the exact user-source payload Baserow expects.", initialJson: '{\n  "type": "local_baserow"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createApplicationUserSource(c, builderId, payload))) })} />
            <Button title="Create snapshot" variant="secondary" onPress={() => actionMutation.mutate(() => apiCall((c) => createApplicationSnapshot(c, builderId)))} />
            <Button title="Check domain exists" variant="secondary" onPress={() => actionMutation.mutate(() => askPublicBuilderDomainExists(domains[0]?.domain_name || domains[0]?.name || builderName, creds.baseUrl))} />
            <Button title="Theme JSON" variant="secondary" onPress={() => setJsonAction({ title: "Update builder theme", description: "Patch high-level builder theme settings with a JSON object.", initialJson: "{}", submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderTheme(c, builderId, payload))) })} />
            <Button title="User roles" variant="secondary" onPress={() => actionMutation.mutate(() => apiCall((c) => listApplicationUserSourceRoles(c, builderId)))} />
            <Button title="User list" variant="secondary" onPress={() => actionMutation.mutate(() => apiCall((c) => listApplicationUserSourceUsers(c, builderId)))} />
            {pages.length > 1 ? <Button title="Save page order" variant="secondary" onPress={() => actionMutation.mutate(() => apiCall((c) => orderBuilderPages(c, builderId, pages.map((page) => page.id))))} /> : null}
            {domains.length > 1 ? <Button title="Save domain order" variant="secondary" onPress={() => actionMutation.mutate(() => apiCall((c) => orderBuilderDomains(c, builderId, domains.map((domain) => domain.id))))} /> : null}
          </View>
        </View>

        <Section title="Mobile navigation preview" icon="smartphone">
          <Card>
            <View style={[styles.mobileNavFrame, { borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={[styles.mobileNavHeader, { borderColor: colors.border }]}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{builderName}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{pages.length} pages</Text>
              </View>
              <View style={styles.mobileNavList}>
                {pages.length === 0 ? <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Create pages to preview mobile navigation.</Text> : pages.map((page, index) => (
                  <Pressable key={page.id} onPress={() => router.push({ pathname: "/(app)/builder/page/[id]", params: { id: String(page.id), name: page.name, builder: builderName } })} style={[styles.mobileNavItem, { backgroundColor: index === 0 ? colors.secondary : colors.background, borderColor: colors.border, borderRadius: colors.radius }]}>
                    <Feather name={index === 0 ? "home" : "file"} size={15} color={index === 0 ? colors.primary : colors.mutedForeground} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mobileNavLabel, { color: colors.foreground }]}>{page.name}</Text>
                      <Text style={[styles.mobileNavPath, { color: colors.mutedForeground }]}>{page.path || "/"}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>
          </Card>
        </Section>

        <Section title="Pages" icon="file">
          {pages.length === 0 ? <EmptyState icon="file" title="No pages yet" description="Create a page on mobile, then inspect elements and data sources." /> : pages.map((page) => (
            <View key={page.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Pressable onPress={() => router.push({ pathname: "/(app)/builder/page/[id]", params: { id: String(page.id), name: page.name, builder: builderName } })} style={({ pressed }) => [styles.rowTop, { opacity: pressed ? 0.65 : 1 }]}>
                <View style={styles.iconWrap}><Feather name="file" size={16} color={colors.mutedForeground} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{page.name}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{page.path || "No path"}</Text></View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
              <View style={styles.actionRow}>
                <Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update page", description: "Patch this page with a JSON object.", initialJson: JSON.stringify(page, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPage(c, page.id, payload))) })} />
                <Pill label="Duplicate" onPress={() => actionMutation.mutate(() => apiCall((c) => duplicateBuilderPageAsync(c, page.id)))} />
                <Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete page", description: `Delete “${page.name}”. Submit {} to confirm.`, initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPage(c, page.id))) })} />
              </View>
            </View>
          ))}
        </Section>

        <Section title="Domains" icon="globe">
          {domains.length === 0 ? <EmptyState icon="globe" title="No domains" description="Domains configured on desktop will appear here for mobile publishing." /> : domains.map((domain) => (
            <View key={domain.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <View style={styles.rowTop}><View style={styles.iconWrap}><Feather name="globe" size={16} color={colors.mutedForeground} /></View><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{domain.domain_name || domain.name || `Domain #${domain.id}`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{domain.published_to || "Not published"}</Text></View><Pressable onPress={() => publishMutation.mutate(domain.id)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.smallButtonText, { color: colors.primaryForeground }]}>Publish</Text></Pressable></View>
              <View style={styles.actionRow}>
                <Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update domain", description: "Patch this domain with a JSON object.", initialJson: JSON.stringify(domain, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderDomain(c, domain.id, payload))) })} />
                <Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete domain", description: `Delete this domain. Submit {} to confirm.`, initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderDomain(c, domain.id))) })} />
              </View>
            </View>
          ))}
        </Section>
        <Section title="Integrations" icon="link">
          {integrations.length === 0 ? <EmptyState icon="link" title="No integrations" description="Application integrations power data sources and auth connections." /> : integrations.map((integration) => (
            <View key={integration.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{integration.name || `${integration.type} integration`}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {integration.type}</Text>
              <View style={styles.actionRow}>
                <Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update integration", initialJson: JSON.stringify(integration, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateApplicationIntegration(c, integration.id, payload))) })} />
                <Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move integration", initialJson: "{}", submitLabel: "Move", run: (payload) => actionMutation.mutate(() => apiCall((c) => moveApplicationIntegration(c, integration.id, payload))) })} />
                <Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete integration", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteApplicationIntegration(c, integration.id))) })} />
              </View>
            </View>
          ))}
        </Section>
        <Section title="User sources" icon="users">
          {userSources.length === 0 ? <EmptyState icon="users" title="No user sources" description="User sources configured on desktop will appear here." /> : userSources.map((source) => (
            <View key={source.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>{source.name || `${source.type} user source`}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {source.type}</Text>
            </View>
          ))}
        </Section>
        <Section title="Snapshots" icon="clock">
          {snapshots.length === 0 ? <EmptyState icon="clock" title="No snapshots" description="Create a snapshot to preserve the current application state." /> : snapshots.map((snapshot) => (
            <View key={snapshot.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.itemTitle, { color: colors.foreground }]}>Snapshot #{snapshot.id}</Text>
              <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{snapshot.created_on || "No timestamp"}</Text>
            </View>
          ))}
        </Section>
        <Section title="Custom code" icon="code">
          <Card>
            <Text style={[styles.itemTitle, { color: colors.foreground }]}>Custom CSS</Text>
            <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{customCssQuery.data ? `${customCssQuery.data.length} characters` : "No CSS returned"}</Text>
            <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{customCssQuery.data || "/* empty */"}</Text>
          </Card>
          <Card>
            <Text style={[styles.itemTitle, { color: colors.foreground }]}>Custom JavaScript</Text>
            <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{customJsQuery.data ? `${customJsQuery.data.length} characters` : "No JavaScript returned"}</Text>
            <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{customJsQuery.data || "// empty"}</Text>
          </Card>
        </Section>
        <Section title="Published preview" icon="eye">
          {domains.length === 0 ? <EmptyState icon="eye" title="No published domain" description="Publish a domain first to preview public builder endpoints." /> : (
            <>
              <Card>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>Public builder JSON</Text>
                <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{JSON.stringify(publicBuilderQuery.data ?? {}, null, 2)}</Text>
                <View style={styles.actionRow}>
                  <Pill label="Refresh by name" onPress={() => actionMutation.mutate(() => getPublicBuilderByName(domains[0]?.domain_name || domains[0]?.name || String(builderId), creds.baseUrl))} />
                </View>
              </Card>
              <Card>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>Published page elements</Text>
                <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{JSON.stringify(publishedPageElementsQuery.data ?? {}, null, 2)}</Text>
              </Card>
              <Card>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>Published page data sources</Text>
                <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{JSON.stringify(publishedPageDataSourcesQuery.data ?? {}, null, 2)}</Text>
                <View style={styles.actionRow}>
                  <Pill label="Dispatch public data" onPress={() => firstPage ? actionMutation.mutate(() => dispatchPublishedBuilderPageDataSources(firstPage.id, {}, creds.baseUrl)) : undefined} />
                </View>
              </Card>
              <Card>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>Published page actions</Text>
                <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{JSON.stringify(publishedPageActionsQuery.data ?? {}, null, 2)}</Text>
              </Card>
              <Card>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>Published custom code</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>CSS: {publicCustomCssQuery.data?.length ?? 0} chars · JS: {publicCustomJsQuery.data?.length ?? 0} chars</Text>
                <Text style={[styles.jsonPreview, { color: colors.mutedForeground }]} numberOfLines={5}>{JSON.stringify({ css: publicCustomCssQuery.data ?? "", js: publicCustomJsQuery.data ?? "" }, null, 2)}</Text>
              </Card>
            </>
          )}
        </Section>
      </ScrollView>
    )}
    <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]} onPress={() => setCreateOpen(false)}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Create page</Text><TextInput value={pageName} onChangeText={setPageName} autoFocus style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} /><Button title="Create" onPress={() => createMutation.mutate(pageName)} loading={createMutation.isPending} /></View></Pressable></Pressable></Modal>
    <IntegrationFormModal form={integrationForm} loading={actionMutation.isPending} onClose={() => setIntegrationForm(null)} onChange={setIntegrationForm} onSubmit={(payload) => actionMutation.mutate(() => apiCall((c) => createApplicationIntegration(c, builderId, payload)))} />
    <UserSourceFormModal form={userSourceForm} integrations={integrations} loading={actionMutation.isPending} onClose={() => setUserSourceForm(null)} onChange={setUserSourceForm} onSubmit={(payload) => actionMutation.mutate(() => apiCall((c) => createApplicationUserSource(c, builderId, payload)))} />
    <JsonActionModal action={jsonAction} loading={actionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function IntegrationFormModal({ form, loading, onClose, onChange, onSubmit }: { form: IntegrationFormState | null; loading?: boolean; onClose: () => void; onChange: (form: IntegrationFormState | null) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  if (!form) return null;
  const selected = INTEGRATION_OPTIONS.find((option) => option.type === form.type) ?? INTEGRATION_OPTIONS[0];
  const update = (patch: Partial<IntegrationFormState>) => {
    const next = { ...form, ...patch };
    if (patch.type) next.name = INTEGRATION_OPTIONS.find((option) => option.type === patch.type)?.label ?? next.name;
    onChange(next);
    setError(null);
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]} onPress={onClose}><Pressable style={[styles.modalCard, styles.wideModalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create integration</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Set up a common Application Builder integration. Use advanced JSON for provider-specific options.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Integration type</Text>
      <View style={styles.optionGrid}>{INTEGRATION_OPTIONS.map((option) => {
        const active = option.type === form.type;
        return <Pressable key={option.type} onPress={() => update({ type: option.type })} style={[styles.optionCard, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.secondary : colors.background }]}><Feather name={option.icon} size={16} color={active ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.label}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{option.description}</Text></View></Pressable>;
      })}</View>
      <FormInput label="Name" value={form.name} onChangeText={(name) => update({ name })} />
      {selected.type === "smtp" ? <FormInput label="SMTP host" value={form.host} onChangeText={(host) => update({ host })} autoCapitalize="none" placeholder="smtp.example.com" /> : null}
      {selected.type === "smtp" ? <FormInput label="SMTP port" value={form.port} onChangeText={(port) => update({ port })} keyboardType="number-pad" /> : null}
      {selected.type === "smtp" ? <FormInput label="Username" value={form.username} onChangeText={(username) => update({ username })} autoCapitalize="none" /> : null}
      {selected.type === "smtp" ? <FormInput label="Password" value={form.password} onChangeText={(password) => update({ password })} autoCapitalize="none" /> : null}
      {selected.type === "slack_bot" ? <FormInput label="Bot token" value={form.token} onChangeText={(token) => update({ token })} autoCapitalize="none" placeholder="xoxb-..." /> : null}
      <FormInput label="Advanced JSON overrides" value={form.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Create" loading={loading} onPress={() => { try { onSubmit(buildIntegrationPayload(form)); } catch (err) { setError(err instanceof Error ? err.message : "Check the integration fields."); } }} /></View>
  </Pressable></Pressable></Modal>;
}

function UserSourceFormModal({ form, integrations, loading, onClose, onChange, onSubmit }: { form: UserSourceFormState | null; integrations: { id: number; name?: string; type?: string }[]; loading?: boolean; onClose: () => void; onChange: (form: UserSourceFormState | null) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  if (!form) return null;
  const update = (patch: Partial<UserSourceFormState>) => { onChange({ ...form, ...patch }); setError(null); };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]} onPress={onClose}><Pressable style={[styles.modalCard, styles.wideModalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create user source</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Connect a local Baserow table as an Application Builder auth/user source.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <FormInput label="Name" value={form.name} onChangeText={(name) => update({ name })} />
      <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Integration</Text><View style={styles.optionGrid}>{integrations.map((integration) => <Pressable key={integration.id} onPress={() => update({ integrationId: String(integration.id) })} style={[styles.optionCard, { borderColor: form.integrationId === String(integration.id) ? colors.primary : colors.border, backgroundColor: form.integrationId === String(integration.id) ? colors.secondary : colors.background }]}><Feather name="link" size={16} color={form.integrationId === String(integration.id) ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{integration.name || `${integration.type} integration`}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>#{integration.id}</Text></View></Pressable>)}</View></View>
      <FormInput label="Integration ID" value={form.integrationId} onChangeText={(integrationId) => update({ integrationId })} keyboardType="number-pad" />
      <FormInput label="Users table ID" value={form.tableId} onChangeText={(tableId) => update({ tableId })} keyboardType="number-pad" />
      <FormInput label="Email field ID" value={form.emailFieldId} onChangeText={(emailFieldId) => update({ emailFieldId })} keyboardType="number-pad" />
      <FormInput label="Name field ID" value={form.nameFieldId} onChangeText={(nameFieldId) => update({ nameFieldId })} keyboardType="number-pad" />
      <FormInput label="Role field ID" value={form.roleFieldId} onChangeText={(roleFieldId) => update({ roleFieldId })} keyboardType="number-pad" />
      <FormInput label="Advanced JSON overrides" value={form.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Create" loading={loading} onPress={() => { try { onSubmit(buildUserSourcePayload(form)); } catch (err) { setError(err instanceof Error ? err.message : "Check the user-source fields."); } }} /></View>
  </Pressable></Pressable></Modal>;
}

function FormInput({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: "default" | "number-pad"; autoCapitalize?: "none" | "sentences" | "words" | "characters" }) {
  const colors = useColors();
  return <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, multiline ? styles.multilineInput : null, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Pill({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) { const colors = useColors(); return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : colors.secondary }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : colors.primary }]}>{label}</Text></Pressable>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" },
  subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" },
  headerButtonRow: { marginTop: 16, alignItems: "flex-start", gap: 10 },
  section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" },
  card: { borderWidth: 1, padding: 14, marginBottom: 10 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" },
  jsonPreview: { marginTop: 10, fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, padding: 18 },
  wideModalCard: { maxWidth: 640, maxHeight: "90%" },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
  modalDescription: { marginTop: -4, marginBottom: 10, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  modalScroll: { maxHeight: 560 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontFamily: "Inter_400Regular" },
  multilineInput: { minHeight: 104, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  optionGrid: { gap: 8, marginBottom: 12 },
  optionCard: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  optionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  optionMeta: { marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },
  formBlock: { marginTop: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  errorText: { marginTop: 10, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mobileNavFrame: { borderWidth: 1, overflow: "hidden" },
  mobileNavHeader: { borderBottomWidth: 1, padding: 12 },
  mobileNavList: { padding: 10, gap: 8 },
  mobileNavItem: { borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  mobileNavLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  mobileNavPath: { marginTop: 2, fontSize: 12, fontFamily: "Inter_400Regular" },
});
