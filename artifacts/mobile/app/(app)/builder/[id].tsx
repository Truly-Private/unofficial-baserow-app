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
    ]);
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => apiCall((c) => createBuilderPage(c, builderId, { name: name.trim() || "Untitled page", path: "/" + (name.trim() || "untitled-page").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })),
    onSuccess: async (page) => { await queryClient.invalidateQueries({ queryKey: ["applications", creds.baseUrl, creds.user.id] }); setCreateOpen(false); setPageName("Untitled page"); router.push({ pathname: "/(app)/builder/page/[id]", params: { id: String(page.id), name: page.name, builder: builderName } }); },
    onError: (error) => Alert.alert("Could not create page", error instanceof Error ? error.message : "Please try again."),
  });

  const actionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => { setJsonAction(null); await refresh(); },
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
            </>
          )}
        </Section>
      </ScrollView>
    )}
    <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]} onPress={() => setCreateOpen(false)}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}><Text style={[styles.modalTitle, { color: colors.foreground }]}>Create page</Text><TextInput value={pageName} onChangeText={setPageName} autoFocus style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={() => setCreateOpen(false)} /><Button title="Create" onPress={() => createMutation.mutate(pageName)} loading={createMutation.isPending} /></View></Pressable></Pressable></Modal>
    <JsonActionModal action={jsonAction} loading={actionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Pill({ label, onPress, destructive }: { label: string; onPress: () => void; destructive?: boolean }) { const colors = useColors(); return <Pressable onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : colors.secondary }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : colors.primary }]}>{label}</Text></Pressable>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }

const styles = StyleSheet.create({ fill: { flex: 1 }, headerWrap: { paddingHorizontal: 20, paddingBottom: 8 }, crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 }, title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" }, subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" }, headerButtonRow: { marginTop: 16, alignItems: "flex-start", gap: 10 }, section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 }, sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }, sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" }, card: { borderWidth: 1, padding: 14, marginBottom: 10 }, rowTop: { flexDirection: "row", alignItems: "center", gap: 12 }, iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" }, itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" }, jsonPreview: { marginTop: 10, fontSize: 11, lineHeight: 16, fontFamily: "Inter_400Regular" }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 }, pillText: { fontSize: 12, fontFamily: "Inter_700Bold" }, smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }, smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" }, modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }, modalCard: { width: "100%", maxWidth: 420, borderWidth: 1, padding: 18 }, modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 }, input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, fontFamily: "Inter_400Regular" }, modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 } });
