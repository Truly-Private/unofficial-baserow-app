import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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
import { JsonActionModal, type JsonAction } from "@/components/JsonActionModal";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  createBuilderPageDataSource,
  createBuilderPageElement,
  createBuilderPageWorkflowAction,
  deleteBuilderPageDataSource,
  deleteBuilderPageElement,
  deleteBuilderPageWorkflowAction,
  dispatchBuilderPageDataSource,
  dispatchBuilderPageDataSources,
  dispatchBuilderPageWorkflowAction,
  duplicateBuilderPageElement,
  getBuilderPageDataSourceRecordNames,
  listBuilderPageDataSources,
  listBuilderPageElements,
  listBuilderPageWorkflowActions,
  moveBuilderPageDataSource,
  moveBuilderPageElement,
  orderBuilderWorkflowActions,
  updateBuilderPageDataSource,
  updateBuilderPageElement,
  updateBuilderPageWorkflowAction,
  type BaserowBuilderElement,
  type BaserowDataSource,
} from "@/lib/baserow";

type ElementOption = {
  type: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  primaryLabel?: string;
  needsUrl?: boolean;
  needsPlaceholder?: boolean;
  needsDataSource?: boolean;
  supportsLevel?: boolean;
};

type ElementFormState = {
  type: string;
  title: string;
  order: string;
  parentElementId: string;
  url: string;
  placeholder: string;
  dataSourceId: string;
  level: string;
  advancedJson: string;
};

type ElementEditorState = {
  element: BaserowBuilderElement;
  title: string;
  url: string;
  placeholder: string;
  dataSourceId: string;
  level: string;
  advancedJson: string;
};

type DataSourceFormState = {
  type: string;
  name: string;
  tableId: string;
  rowId: string;
  integrationId: string;
  url: string;
  advancedJson: string;
};

type WorkflowActionFormState = {
  type: string;
  event: string;
  title: string;
  description: string;
  url: string;
  dataSourceId: string;
  advancedJson: string;
};

type DataSourceOption = {
  type: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  needsTable?: boolean;
  needsRow?: boolean;
  needsUrl?: boolean;
};

type WorkflowActionOption = {
  type: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  needsMessage?: boolean;
  needsUrl?: boolean;
  needsDataSource?: boolean;
};

const ELEMENT_OPTIONS: ElementOption[] = [
  {
    type: "heading",
    label: "Heading",
    description: "Large page heading text.",
    icon: "type",
    primaryLabel: "Heading text",
    supportsLevel: true,
  },
  {
    type: "text",
    label: "Text",
    description: "Paragraph or rich text content.",
    icon: "align-left",
    primaryLabel: "Text content",
  },
  {
    type: "button",
    label: "Button",
    description: "Clickable CTA with workflow actions.",
    icon: "square",
    primaryLabel: "Button label",
  },
  {
    type: "link",
    label: "Link",
    description: "Navigate to a page or external URL.",
    icon: "link",
    primaryLabel: "Link label",
    needsUrl: true,
  },
  {
    type: "image",
    label: "Image",
    description: "Render an image from a URL/formula.",
    icon: "image",
    primaryLabel: "Alt/name",
    needsUrl: true,
  },
  {
    type: "input_text",
    label: "Text input",
    description: "Form input for collecting text.",
    icon: "edit-3",
    primaryLabel: "Input label",
    needsPlaceholder: true,
  },
  {
    type: "table",
    label: "Table",
    description: "Display rows from a page data source.",
    icon: "grid",
    primaryLabel: "Load more label",
    needsDataSource: true,
  },
  {
    type: "form_container",
    label: "Form",
    description: "Container for submit/reset form flows.",
    icon: "clipboard",
    primaryLabel: "Submit button label",
  },
  {
    type: "simple_container",
    label: "Container",
    description: "Group child elements in a layout block.",
    icon: "box",
    primaryLabel: "Container label",
  },
];

const ELEMENT_OPTION_BY_TYPE = new Map(ELEMENT_OPTIONS.map((option) => [option.type, option]));

const DATA_SOURCE_OPTIONS: DataSourceOption[] = [
  { type: "local_baserow_list_rows", label: "List rows", icon: "list" as const, description: "Read table rows into the page.", needsTable: true },
  { type: "local_baserow_get_row", label: "Get row", icon: "file-text" as const, description: "Load one Baserow row by formula.", needsTable: true, needsRow: true },
  { type: "http_request", label: "HTTP request", icon: "send" as const, description: "Fetch data from an HTTP endpoint.", needsUrl: true },
];

const WORKFLOW_ACTION_OPTIONS: WorkflowActionOption[] = [
  { type: "notification", label: "Notification", icon: "bell" as const, description: "Show a page notification.", needsMessage: true },
  { type: "open_page", label: "Open page/URL", icon: "external-link" as const, description: "Navigate the visitor to another page or URL.", needsUrl: true },
  { type: "refresh_data_source", label: "Refresh data source", icon: "refresh-cw" as const, description: "Refresh a page data source.", needsDataSource: true },
  { type: "http_request", label: "HTTP request", icon: "send" as const, description: "Call an HTTP endpoint from a workflow action.", needsUrl: true },
];

function optionForElementType(type: string) {
  return ELEMENT_OPTION_BY_TYPE.get(type) ?? ELEMENT_OPTIONS[0];
}

function formulaValue(value: string) {
  return { formula: value, version: "0.1", mode: "simple" };
}

function formulaToText(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "formula" in value) {
    const formula = (value as { formula?: unknown }).formula;
    return typeof formula === "string" ? formula : "";
  }
  return "";
}

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

function parseNonNegativeInteger(value: string, label: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be zero or a positive whole number.`);
  }
  return parsed;
}

function blankElementForm(elements: BaserowBuilderElement[]): ElementFormState {
  const nextOrder = Math.max(-1, ...elements.map((element) => Number(element.order ?? -1))) + 1;
  return {
    type: ELEMENT_OPTIONS[0].type,
    title: "New heading",
    order: String(nextOrder),
    parentElementId: "",
    url: "",
    placeholder: "",
    dataSourceId: "",
    level: "1",
    advancedJson: "{}",
  };
}

function blankDataSourceForm(): DataSourceFormState {
  return {
    type: DATA_SOURCE_OPTIONS[0].type,
    name: "Rows data source",
    tableId: "",
    rowId: "",
    integrationId: "",
    url: "",
    advancedJson: "{}",
  };
}

function blankWorkflowActionForm(): WorkflowActionFormState {
  return {
    type: WORKFLOW_ACTION_OPTIONS[0].type,
    event: "click",
    title: "Done",
    description: "The action completed.",
    url: "",
    dataSourceId: "",
    advancedJson: "{}",
  };
}

function editorFromElement(element: BaserowBuilderElement): ElementEditorState {
  return {
    element,
    title: formulaToText(element.value ?? element.label ?? element.submit_button_label ?? element.button_load_more_label) || element.name || "",
    url: formulaToText(element.image_url ?? element.navigate_to_url),
    placeholder: formulaToText(element.placeholder),
    dataSourceId: element.data_source_id ? String(element.data_source_id) : "",
    level: element.level ? String(element.level) : "1",
    advancedJson: JSON.stringify(element, null, 2),
  };
}

function buildDataSourcePayload(form: DataSourceFormState, pageId: number) {
  const option = DATA_SOURCE_OPTIONS.find((item) => item.type === form.type) ?? DATA_SOURCE_OPTIONS[0];
  const payload: Record<string, unknown> = {
    type: form.type,
    page_id: pageId,
  };
  if (form.name.trim()) payload.name = form.name.trim();
  const tableId = parsePositiveInteger(form.tableId, "Table ID");
  const rowId = parsePositiveInteger(form.rowId, "Row ID");
  const integrationId = parsePositiveInteger(form.integrationId, "Integration ID");
  if (option.needsTable && !tableId) throw new Error("Add a table ID for this data source.");
  if (tableId) payload.table_id = tableId;
  if (integrationId) payload.integration_id = integrationId;
  if (option.needsRow) {
    if (!rowId) throw new Error("Add a row ID/formula value for this data source.");
    payload.row_id = formulaValue(String(rowId));
  }
  if (option.needsUrl) {
    if (!/^https?:\/\//i.test(form.url.trim())) throw new Error("URL must start with http:// or https://.");
    payload.url = formulaValue(form.url.trim());
    payload.method = "GET";
    payload.sample_data = {};
  }
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced);
  return payload;
}

function buildWorkflowActionPayload(form: WorkflowActionFormState) {
  const option = WORKFLOW_ACTION_OPTIONS.find((item) => item.type === form.type) ?? WORKFLOW_ACTION_OPTIONS[0];
  const payload: Record<string, unknown> = {
    type: form.type,
    event: form.event.trim() || "click",
  };
  if (option.needsMessage) {
    payload.title = formulaValue(form.title.trim() || "Notification");
    payload.description = formulaValue(form.description.trim());
  }
  if (option.needsUrl) {
    if (!/^https?:\/\//i.test(form.url.trim())) throw new Error("URL must start with http:// or https://.");
    payload.navigate_to_url = formulaValue(form.url.trim());
    payload.url = formulaValue(form.url.trim());
  }
  if (option.needsDataSource) {
    const dataSourceId = parsePositiveInteger(form.dataSourceId, "Data source ID");
    if (!dataSourceId) throw new Error("Choose a data source ID.");
    payload.data_source_id = dataSourceId;
  }
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced);
  return payload;
}

function validateSetupForm(kind: "dataSource" | "workflowAction", form: DataSourceFormState | WorkflowActionFormState, pageId: number) {
  try {
    if (kind === "dataSource") buildDataSourcePayload(form as DataSourceFormState, pageId);
    else buildWorkflowActionPayload(form as WorkflowActionFormState);
  } catch (error) {
    return error instanceof Error ? error.message : "Check the setup fields.";
  }
  return null;
}

function buildCommonElementPayload(form: ElementFormState | ElementEditorState, type: string, includeOrder: boolean) {
  const option = optionForElementType(type);
  const payload: Record<string, unknown> = {};
  const title = form.title.trim();

  if (includeOrder && "order" in form) {
    payload.order = parseNonNegativeInteger(form.order, "Order") ?? 0;
  }

  if ("parentElementId" in form) {
    const parentElementId = parsePositiveInteger(form.parentElementId, "Parent element");
    if (parentElementId) payload.parent_element_id = parentElementId;
  }

  if (option.supportsLevel) {
    const level = parsePositiveInteger(form.level, "Heading level") ?? 1;
    payload.level = Math.min(6, level);
  }

  switch (type) {
    case "heading":
    case "text":
    case "button":
      payload.value = formulaValue(title || option.label);
      break;
    case "link":
      payload.value = formulaValue(title || "Link");
      if (form.url.trim()) payload.navigate_to_url = formulaValue(form.url.trim());
      break;
    case "image":
      if (form.url.trim()) payload.image_url = formulaValue(form.url.trim());
      break;
    case "input_text":
      payload.label = formulaValue(title || "Text input");
      if (form.placeholder.trim()) payload.placeholder = formulaValue(form.placeholder.trim());
      break;
    case "table": {
      payload.button_load_more_label = formulaValue(title || "Load more");
      const dataSourceId = parsePositiveInteger(form.dataSourceId, "Data source ID");
      if (dataSourceId) payload.data_source_id = dataSourceId;
      payload.is_publicly_filterable = false;
      payload.is_publicly_searchable = false;
      payload.is_publicly_sortable = false;
      break;
    }
    case "form_container":
      payload.submit_button_label = formulaValue(title || "Submit");
      payload.reset_initial_values_post_submission = false;
      break;
    default:
      if (title) payload.name = title;
      break;
  }

  return payload;
}

function buildElementCreatePayload(form: ElementFormState) {
  const payload = buildCommonElementPayload(form, form.type, true);
  payload.type = form.type;
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced);
  return payload;
}

function buildElementUpdatePayload(form: ElementEditorState) {
  const payload = buildCommonElementPayload(form, form.element.type, false);
  const advanced = parseOptionalObjectJson(form.advancedJson, "Advanced JSON");
  if (advanced) Object.assign(payload, advanced, payload);
  return payload;
}

function validateElementForm(form: ElementFormState | ElementEditorState, mode: "create" | "update") {
  try {
    if (mode === "create") buildElementCreatePayload(form as ElementFormState);
    else buildElementUpdatePayload(form as ElementEditorState);
  } catch (error) {
    return error instanceof Error ? error.message : "Check the element configuration.";
  }
  return null;
}

function describeElement(element: BaserowBuilderElement) {
  const pieces = [`Type: ${element.type}`];
  if (typeof element.order !== "undefined") pieces.push(`Order: ${element.order}`);
  if (element.parent_element_id) pieces.push(`Parent: #${element.parent_element_id}`);
  if (element.data_source_id) pieces.push(`Data source: #${element.data_source_id}`);
  return pieces.join(" · ");
}

export default function BuilderPageScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ id: string; name?: string; builder?: string }>();
  const pageId = Number(params.id);
  const pageName = params.name || "Page";
  const [jsonAction, setJsonAction] = useState<(JsonAction & { run: (payload: Record<string, unknown>) => void }) | null>(null);
  const [elementForm, setElementForm] = useState<ElementFormState | null>(null);
  const [elementEditor, setElementEditor] = useState<ElementEditorState | null>(null);
  const [dataSourceForm, setDataSourceForm] = useState<DataSourceFormState | null>(null);
  const [workflowActionForm, setWorkflowActionForm] = useState<WorkflowActionFormState | null>(null);

  const elementsQuery = useQuery({ queryKey: ["builderPage", pageId, "elements"], queryFn: () => apiCall((c) => listBuilderPageElements(c, pageId)) });
  const dataSourcesQuery = useQuery({ queryKey: ["builderPage", pageId, "dataSources"], queryFn: () => apiCall((c) => listBuilderPageDataSources(c, pageId)) });
  const actionsQuery = useQuery({ queryKey: ["builderPage", pageId, "workflowActions"], queryFn: () => apiCall((c) => listBuilderPageWorkflowActions(c, pageId)) });

  const refresh = async () => { await Promise.all([elementsQuery.refetch(), dataSourcesQuery.refetch(), actionsQuery.refetch()]); };
  const actionMutation = useMutation({
    mutationFn: (fn: () => Promise<unknown>) => fn(),
    onSuccess: async () => {
      setJsonAction(null);
      setElementForm(null);
      setElementEditor(null);
      setDataSourceForm(null);
      setWorkflowActionForm(null);
      await refresh();
    },
    onError: (error) => Alert.alert("Builder page action failed", error instanceof Error ? error.message : "Please try again."),
  });
  const dispatchAllMutation = useMutation({ mutationFn: () => apiCall((c) => dispatchBuilderPageDataSources(c, pageId)), onSuccess: () => Alert.alert("Data sources dispatched", "Baserow accepted the page data-source dispatch."), onError: (error) => Alert.alert("Could not dispatch data sources", error instanceof Error ? error.message : "Please try again.") });
  const dispatchOneMutation = useMutation({ mutationFn: (source: BaserowDataSource) => apiCall((c) => dispatchBuilderPageDataSource(c, source.id)), onSuccess: (_, source) => Alert.alert("Data source dispatched", source.name || `${source.type} data source #${source.id}`), onError: (error) => Alert.alert("Could not dispatch data source", error instanceof Error ? error.message : "Please try again.") });

  const elements = (elementsQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const dataSources = (dataSourcesQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const actions = (actionsQuery.data ?? []).slice().sort((a, b) => (a.order ?? a.id) - (b.order ?? b.id));
  const loading = elementsQuery.isLoading || dataSourcesQuery.isLoading || actionsQuery.isLoading;
  const errored = elementsQuery.isError || dataSourcesQuery.isError || actionsQuery.isError;
  const error = (elementsQuery.error as Error | null) ?? (dataSourcesQuery.error as Error | null) ?? (actionsQuery.error as Error | null);
  const refreshing = elementsQuery.isRefetching || dataSourcesQuery.isRefetching || actionsQuery.isRefetching;
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;
  const moveElement = (element: BaserowBuilderElement, index: number, direction: "up" | "down" | "top" | "bottom") => {
    let beforeId: number | null = null;
    if (direction === "up") beforeId = elements[index - 1]?.id ?? null;
    if (direction === "down") beforeId = elements[index + 2]?.id ?? null;
    if (direction === "top") beforeId = elements[0]?.id ?? null;
    actionMutation.mutate(() => apiCall((c) => moveBuilderPageElement(c, element.id, { before_id: beforeId, parent_element_id: element.parent_element_id ?? null })));
  };

  return <View style={[styles.fill, { backgroundColor: colors.background }]}>
    <Stack.Screen options={{ title: pageName }} />
    {loading ? <LoadingState /> : errored ? <ErrorState title="Could not load page" message={error?.message} onRetry={() => void refresh()} /> : (
      <ScrollView contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}>
        <View style={styles.headerWrap}>
          <Text style={[styles.crumb, { color: colors.mutedForeground }]}>{params.builder || "Application"}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{pageName}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{elements.length} elements · {dataSources.length} data sources · {actions.length} actions</Text>
          <View style={styles.headerButtonRow}>
            <Pill label="New element" primary onPress={() => setElementForm(blankElementForm(elements))} />
            <Pill label="New data source" primary onPress={() => setDataSourceForm(blankDataSourceForm())} />
            <Pill label="New action" primary onPress={() => setWorkflowActionForm(blankWorkflowActionForm())} />
            <Pill label="Dispatch all data" onPress={() => dispatchAllMutation.mutate()} />
            <Pill label="Create element JSON" onPress={() => setJsonAction({ title: "Create element", description: "Enter the exact element payload Baserow expects.", initialJson: '{\n  "type": "heading",\n  "order": 0\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageElement(c, pageId, payload))) })} />
            <Pill label="Create data source JSON" onPress={() => setJsonAction({ title: "Create data source", description: "Enter the exact data-source payload Baserow expects.", initialJson: '{\n  "type": "local_baserow_list_rows"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageDataSource(c, pageId, payload))) })} />
            <Pill label="Create action JSON" onPress={() => setJsonAction({ title: "Create workflow action", description: "Enter the exact workflow-action payload Baserow expects.", initialJson: '{\n  "type": "notification"\n}', submitLabel: "Create", requiresJson: true, run: (payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageWorkflowAction(c, pageId, payload))) })} />
            {actions.length > 1 ? <Pill label="Save action order" onPress={() => actionMutation.mutate(() => apiCall((c) => orderBuilderWorkflowActions(c, pageId, actions.map((action) => action.id))))} /> : null}
          </View>
        </View>

        <Section title="Element palette" icon="plus-square">
          <View style={styles.paletteGrid}>
            {ELEMENT_OPTIONS.map((option) => (
              <Pressable key={option.type} onPress={() => setElementForm({ ...blankElementForm(elements), type: option.type, title: option.label })} style={({ pressed }) => [styles.paletteCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius, opacity: pressed ? 0.75 : 1 }]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}><Feather name={option.icon} size={16} color={colors.primary} /></View>
                <View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{option.label}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{option.description}</Text></View>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="Elements" icon="layers">
          {elements.length === 0 ? (
            <View style={styles.emptyBlock}>
              <EmptyState icon="layers" title="No elements" description="Use the native element palette to add common builder elements, or create advanced payloads with JSON." />
              <Pill label="Create first element" primary onPress={() => setElementForm(blankElementForm(elements))} />
            </View>
          ) : elements.map((element, index) => <Card key={element.id}>
            <View style={styles.rowTop}>
              <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}><Feather name={optionForElementType(element.type).icon} size={16} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{element.name || formulaToText(element.value) || `${element.type} element`}</Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>{describeElement(element)}</Text>
              </View>
            </View>
            <ElementPropertyPreview element={element} />
            <View style={styles.actionRow}>
              <Pill label="Edit" primary onPress={() => setElementEditor(editorFromElement(element))} />
              <Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update element", initialJson: JSON.stringify(element, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageElement(c, element.id, payload))) })} />
              <Pill label="Duplicate" onPress={() => actionMutation.mutate(() => apiCall((c) => duplicateBuilderPageElement(c, element.id)))} />
              <Pill label="Up" onPress={() => moveElement(element, index, "up")} disabled={index === 0} />
              <Pill label="Down" onPress={() => moveElement(element, index, "down")} disabled={index === elements.length - 1} />
              <Pill label="Top" onPress={() => moveElement(element, index, "top")} disabled={index === 0} />
              <Pill label="Bottom" onPress={() => moveElement(element, index, "bottom")} disabled={index === elements.length - 1} />
              <Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move element", initialJson: "{\n  \"before_id\": null,\n  \"parent_element_id\": null\n}", submitLabel: "Move", run: (payload) => actionMutation.mutate(() => apiCall((c) => moveBuilderPageElement(c, element.id, payload))) })} />
              <Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete element", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageElement(c, element.id))) })} />
            </View>
          </Card>)}
        </Section>

        <Section title="Data sources" icon="database">{dataSources.length === 0 ? <EmptyState icon="database" title="No data sources" description="Connect page data sources on desktop or with JSON endpoint access." /> : dataSources.map((source) => <Card key={source.id}><View style={styles.rowTop}><View style={{ flex: 1 }}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{source.name || `${source.type} data source #${source.id}`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {source.type}</Text></View><Pressable onPress={() => dispatchOneMutation.mutate(source)} style={({ pressed }) => [styles.smallButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 }]}><Text style={[styles.smallButtonText, { color: colors.primary }]}>Dispatch</Text></Pressable></View><View style={styles.actionRow}><Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update data source", initialJson: JSON.stringify(source, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Dispatch JSON" onPress={() => setJsonAction({ title: "Dispatch data source", initialJson: "{}", submitLabel: "Dispatch", run: (payload) => actionMutation.mutate(() => apiCall((c) => dispatchBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Record names" onPress={() => actionMutation.mutate(() => apiCall((c) => getBuilderPageDataSourceRecordNames(c, source.id)))} /><Pill label="Move JSON" onPress={() => setJsonAction({ title: "Move data source", initialJson: "{}", submitLabel: "Move", run: (payload) => actionMutation.mutate(() => apiCall((c) => moveBuilderPageDataSource(c, source.id, payload))) })} /><Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete data source", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageDataSource(c, source.id))) })} /></View></Card>)}</Section>
        <Section title="Workflow actions" icon="zap">{actions.length === 0 ? <EmptyState icon="zap" title="No workflow actions" description="Page workflow actions will appear here." /> : actions.map((action) => <Card key={action.id}><Text style={[styles.itemTitle, { color: colors.foreground }]}>{action.name || `${action.type} action`}</Text><Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>Type: {action.type}</Text><View style={styles.actionRow}><Pill label="Edit JSON" onPress={() => setJsonAction({ title: "Update workflow action", initialJson: JSON.stringify(action, null, 2), submitLabel: "Update", run: (payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageWorkflowAction(c, action.id, payload))) })} /><Pill label="Dispatch JSON" onPress={() => setJsonAction({ title: "Dispatch workflow action", initialJson: "{}", submitLabel: "Dispatch", run: (payload) => actionMutation.mutate(() => apiCall((c) => dispatchBuilderPageWorkflowAction(c, action.id, payload))) })} /><Pill label="Delete" destructive onPress={() => setJsonAction({ title: "Delete workflow action", description: "Submit {} to confirm.", initialJson: "{}", submitLabel: "Delete", destructive: true, run: () => actionMutation.mutate(() => apiCall((c) => deleteBuilderPageWorkflowAction(c, action.id))) })} /></View></Card>)}</Section>
      </ScrollView>
    )}
    <ElementFormModal form={elementForm} elements={elements} loading={actionMutation.isPending} onClose={() => setElementForm(null)} onChange={setElementForm} onSubmit={(payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageElement(c, pageId, payload)))} />
    <ElementEditorModal editor={elementEditor} loading={actionMutation.isPending} onClose={() => setElementEditor(null)} onChange={setElementEditor} onSubmit={(element, payload) => actionMutation.mutate(() => apiCall((c) => updateBuilderPageElement(c, element.id, payload)))} />
    <DataSourceFormModal form={dataSourceForm} pageId={pageId} loading={actionMutation.isPending} onClose={() => setDataSourceForm(null)} onChange={setDataSourceForm} onSubmit={(payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageDataSource(c, pageId, payload)))} />
    <WorkflowActionFormModal form={workflowActionForm} dataSources={dataSources} pageId={pageId} loading={actionMutation.isPending} onClose={() => setWorkflowActionForm(null)} onChange={setWorkflowActionForm} onSubmit={(payload) => actionMutation.mutate(() => apiCall((c) => createBuilderPageWorkflowAction(c, pageId, payload)))} />
    <JsonActionModal action={jsonAction} loading={actionMutation.isPending} onClose={() => setJsonAction(null)} onSubmit={(payload) => jsonAction?.run(payload)} />
  </View>;
}

function ElementPropertyPreview({ element }: { element: BaserowBuilderElement }) {
  const colors = useColors();
  const details = [
    formulaToText(element.value) ? `Value: ${formulaToText(element.value)}` : null,
    formulaToText(element.label) ? `Label: ${formulaToText(element.label)}` : null,
    formulaToText(element.placeholder) ? `Placeholder: ${formulaToText(element.placeholder)}` : null,
    formulaToText(element.image_url) ? `Image: ${formulaToText(element.image_url)}` : null,
    formulaToText(element.navigate_to_url) ? `URL: ${formulaToText(element.navigate_to_url)}` : null,
  ].filter(Boolean);
  if (details.length === 0) return null;
  return <View style={[styles.previewBox, { borderColor: colors.border }]}>{details.map((detail) => <Text key={detail} style={[styles.previewText, { color: colors.mutedForeground }]}>{detail}</Text>)}</View>;
}

function ElementFormModal({ form, elements, loading, onClose, onChange, onSubmit }: { form: ElementFormState | null; elements: BaserowBuilderElement[]; loading?: boolean; onClose: () => void; onChange: (form: ElementFormState | null) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => setError(null), [form]);
  if (!form) return null;
  const option = optionForElementType(form.type);
  const update = (patch: Partial<ElementFormState>) => {
    const next = { ...form, ...patch };
    if (patch.type) next.title = optionForElementType(patch.type).label;
    onChange(next);
    setError(null);
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create element</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Pick a common Application Builder element and configure its main properties without writing raw JSON.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Element type</Text>
      <View style={styles.optionGrid}>{ELEMENT_OPTIONS.map((elementOption) => {
        const selected = elementOption.type === form.type;
        return <Pressable key={elementOption.type} onPress={() => update({ type: elementOption.type })} style={[styles.optionCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}><Feather name={elementOption.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{elementOption.label}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{elementOption.description}</Text></View></Pressable>;
      })}</View>
      <FormInput label={option.primaryLabel || "Label"} value={form.title} onChangeText={(title) => update({ title })} />
      <FormInput label="Order" value={form.order} onChangeText={(order) => update({ order })} keyboardType="number-pad" />
      {option.supportsLevel ? <FormInput label="Heading level" value={form.level} onChangeText={(level) => update({ level })} keyboardType="number-pad" /> : null}
      {option.needsUrl ? <FormInput label={form.type === "image" ? "Image URL/formula" : "Destination URL/formula"} value={form.url} onChangeText={(url) => update({ url })} autoCapitalize="none" placeholder="https://example.com" /> : null}
      {option.needsPlaceholder ? <FormInput label="Placeholder" value={form.placeholder} onChangeText={(placeholder) => update({ placeholder })} /> : null}
      {option.needsDataSource ? <FormInput label="Data source ID" value={form.dataSourceId} onChangeText={(dataSourceId) => update({ dataSourceId })} keyboardType="number-pad" /> : null}
      <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Parent container</Text><View style={styles.optionGrid}><Pressable onPress={() => update({ parentElementId: "" })} style={[styles.optionCard, { borderColor: !form.parentElementId ? colors.primary : colors.border, backgroundColor: !form.parentElementId ? colors.secondary : colors.background }]}><Feather name="columns" size={16} color={!form.parentElementId ? colors.primary : colors.mutedForeground} /><Text style={[styles.optionTitle, { color: colors.foreground }]}>Page root</Text></Pressable>{elements.map((element) => <Pressable key={element.id} onPress={() => update({ parentElementId: String(element.id) })} style={[styles.optionCard, { borderColor: form.parentElementId === String(element.id) ? colors.primary : colors.border, backgroundColor: form.parentElementId === String(element.id) ? colors.secondary : colors.background }]}><Feather name={optionForElementType(element.type).icon} size={16} color={form.parentElementId === String(element.id) ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{element.name || `${element.type} #${element.id}`}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>#{element.id}</Text></View></Pressable>)}</View></View>
      <FormInput label="Advanced JSON overrides" value={form.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Create" loading={loading} onPress={() => { const validation = validateElementForm(form, "create"); if (validation) { setError(validation); return; } onSubmit(buildElementCreatePayload(form)); }} /></View>
  </Pressable></Pressable></Modal>;
}

function ElementEditorModal({ editor, loading, onClose, onChange, onSubmit }: { editor: ElementEditorState | null; loading?: boolean; onClose: () => void; onChange: (editor: ElementEditorState | null) => void; onSubmit: (element: BaserowBuilderElement, payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => setError(null), [editor]);
  if (!editor) return null;
  const option = optionForElementType(editor.element.type);
  const update = (patch: Partial<ElementEditorState>) => { onChange({ ...editor, ...patch }); setError(null); };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit {option.label}</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Update common element properties in a native panel. Advanced JSON remains available for type-specific fields.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <FormInput label={option.primaryLabel || "Label"} value={editor.title} onChangeText={(title) => update({ title })} />
      {option.supportsLevel ? <FormInput label="Heading level" value={editor.level} onChangeText={(level) => update({ level })} keyboardType="number-pad" /> : null}
      {option.needsUrl ? <FormInput label={editor.element.type === "image" ? "Image URL/formula" : "Destination URL/formula"} value={editor.url} onChangeText={(url) => update({ url })} autoCapitalize="none" placeholder="https://example.com" /> : null}
      {option.needsPlaceholder ? <FormInput label="Placeholder" value={editor.placeholder} onChangeText={(placeholder) => update({ placeholder })} /> : null}
      {option.needsDataSource ? <FormInput label="Data source ID" value={editor.dataSourceId} onChangeText={(dataSourceId) => update({ dataSourceId })} keyboardType="number-pad" /> : null}
      <FormInput label="Advanced JSON" value={editor.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Save" loading={loading} onPress={() => { const validation = validateElementForm(editor, "update"); if (validation) { setError(validation); return; } onSubmit(editor.element, buildElementUpdatePayload(editor)); }} /></View>
  </Pressable></Pressable></Modal>;
}

function DataSourceFormModal({ form, pageId, loading, onClose, onChange, onSubmit }: { form: DataSourceFormState | null; pageId: number; loading?: boolean; onClose: () => void; onChange: (form: DataSourceFormState | null) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => setError(null), [form]);
  if (!form) return null;
  const option = DATA_SOURCE_OPTIONS.find((item) => item.type === form.type) ?? DATA_SOURCE_OPTIONS[0];
  const update = (patch: Partial<DataSourceFormState>) => {
    const next = { ...form, ...patch };
    if (patch.type) next.name = DATA_SOURCE_OPTIONS.find((item) => item.type === patch.type)?.label ?? next.name;
    onChange(next);
    setError(null);
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create data source</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Set up common Application Builder page data sources with guided fields, then use JSON for advanced service options.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Data source type</Text>
      <View style={styles.optionGrid}>{DATA_SOURCE_OPTIONS.map((dataSourceOption) => {
        const selected = dataSourceOption.type === form.type;
        return <Pressable key={dataSourceOption.type} onPress={() => update({ type: dataSourceOption.type })} style={[styles.optionCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}><Feather name={dataSourceOption.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{dataSourceOption.label}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{dataSourceOption.description}</Text></View></Pressable>;
      })}</View>
      <FormInput label="Name" value={form.name} onChangeText={(name) => update({ name })} />
      {option.needsTable ? <FormInput label="Table ID" value={form.tableId} onChangeText={(tableId) => update({ tableId })} keyboardType="number-pad" /> : null}
      {option.needsRow ? <FormInput label="Row ID" value={form.rowId} onChangeText={(rowId) => update({ rowId })} keyboardType="number-pad" /> : null}
      {option.needsTable ? <FormInput label="Integration ID (optional)" value={form.integrationId} onChangeText={(integrationId) => update({ integrationId })} keyboardType="number-pad" /> : null}
      {option.needsUrl ? <FormInput label="Request URL" value={form.url} onChangeText={(url) => update({ url })} autoCapitalize="none" placeholder="https://example.com/api" /> : null}
      <FormInput label="Advanced JSON overrides" value={form.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Create" loading={loading} onPress={() => { const validation = validateSetupForm("dataSource", form, pageId); if (validation) { setError(validation); return; } onSubmit(buildDataSourcePayload(form, pageId)); }} /></View>
  </Pressable></Pressable></Modal>;
}

function WorkflowActionFormModal({ form, dataSources, pageId, loading, onClose, onChange, onSubmit }: { form: WorkflowActionFormState | null; dataSources: BaserowDataSource[]; pageId: number; loading?: boolean; onClose: () => void; onChange: (form: WorkflowActionFormState | null) => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const colors = useColors();
  const [error, setError] = useState<string | null>(null);
  React.useEffect(() => setError(null), [form]);
  if (!form) return null;
  const option = WORKFLOW_ACTION_OPTIONS.find((item) => item.type === form.type) ?? WORKFLOW_ACTION_OPTIONS[0];
  const update = (patch: Partial<WorkflowActionFormState>) => {
    const next = { ...form, ...patch };
    if (patch.type) next.title = WORKFLOW_ACTION_OPTIONS.find((item) => item.type === patch.type)?.label ?? next.title;
    onChange(next);
    setError(null);
  };
  return <Modal visible transparent animationType="fade" onRequestClose={onClose}><Pressable style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]} onPress={onClose}><Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Text style={[styles.modalTitle, { color: colors.foreground }]}>Create workflow action</Text>
    <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Configure common button/page workflow actions using native fields.</Text>
    <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Action type</Text>
      <View style={styles.optionGrid}>{WORKFLOW_ACTION_OPTIONS.map((actionOption) => {
        const selected = actionOption.type === form.type;
        return <Pressable key={actionOption.type} onPress={() => update({ type: actionOption.type })} style={[styles.optionCard, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}><Feather name={actionOption.icon} size={16} color={selected ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{actionOption.label}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{actionOption.description}</Text></View></Pressable>;
      })}</View>
      <FormInput label="Event" value={form.event} onChangeText={(event) => update({ event })} placeholder="click" autoCapitalize="none" />
      {option.needsMessage ? <FormInput label="Title" value={form.title} onChangeText={(title) => update({ title })} /> : null}
      {option.needsMessage ? <FormInput label="Description" value={form.description} onChangeText={(description) => update({ description })} multiline /> : null}
      {option.needsUrl ? <FormInput label="Destination/request URL" value={form.url} onChangeText={(url) => update({ url })} autoCapitalize="none" placeholder="https://example.com" /> : null}
      {option.needsDataSource ? <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Data source</Text><View style={styles.optionGrid}>{dataSources.map((source) => <Pressable key={source.id} onPress={() => update({ dataSourceId: String(source.id) })} style={[styles.optionCard, { borderColor: form.dataSourceId === String(source.id) ? colors.primary : colors.border, backgroundColor: form.dataSourceId === String(source.id) ? colors.secondary : colors.background }]}><Feather name="database" size={16} color={form.dataSourceId === String(source.id) ? colors.primary : colors.mutedForeground} /><View style={{ flex: 1 }}><Text style={[styles.optionTitle, { color: colors.foreground }]}>{source.name || `${source.type} #${source.id}`}</Text><Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>#{source.id}</Text></View></Pressable>)}</View><FormInput label="Or data source ID" value={form.dataSourceId} onChangeText={(dataSourceId) => update({ dataSourceId })} keyboardType="number-pad" /></View> : null}
      <FormInput label="Advanced JSON overrides" value={form.advancedJson} onChangeText={(advancedJson) => update({ advancedJson })} multiline />
    </ScrollView>
    {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}
    <View style={styles.modalActions}><Button title="Cancel" variant="secondary" onPress={onClose} /><Button title="Create" loading={loading} onPress={() => { const validation = validateSetupForm("workflowAction", form, pageId); if (validation) { setError(validation); return; } onSubmit(buildWorkflowActionPayload(form)); }} /></View>
  </Pressable></Pressable></Modal>;
}

function FormInput({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; multiline?: boolean; keyboardType?: "default" | "number-pad"; autoCapitalize?: "none" | "sentences" | "words" | "characters" }) {
  const colors = useColors();
  return <View style={styles.formBlock}><Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} multiline={multiline} keyboardType={keyboardType} autoCapitalize={autoCapitalize} style={[styles.input, multiline ? styles.multilineInput : null, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>;
}

function Section({ title, icon, children }: { title: string; icon: keyof typeof Feather.glyphMap; children: React.ReactNode }) { const colors = useColors(); return <View style={styles.section}><View style={styles.sectionHeader}><Feather name={icon} size={16} color={colors.mutedForeground} /><Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text></View>{children}</View>; }
function Card({ children }: { children: React.ReactNode }) { const colors = useColors(); return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>{children}</View>; }
function Pill({ label, onPress, destructive, primary, disabled }: { label: string; onPress: () => void; destructive?: boolean; primary?: boolean; disabled?: boolean }) { const colors = useColors(); return <Pressable disabled={disabled} onPress={onPress} style={[styles.pill, { backgroundColor: destructive ? colors.destructive : primary ? colors.primary : colors.secondary, opacity: disabled ? 0.45 : 1 }]}><Text style={[styles.pillText, { color: destructive ? colors.destructiveForeground : primary ? colors.primaryForeground : colors.primary }]}>{label}</Text></Pressable>; }

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  crumb: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4 },
  title: { fontSize: 30, lineHeight: 36, fontFamily: "Inter_700Bold" },
  subtitle: { marginTop: 6, fontSize: 14, fontFamily: "Inter_400Regular" },
  headerButtonRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  emptyBlock: { gap: 14, paddingTop: 10 },
  section: { paddingHorizontal: 16, paddingTop: 18, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.7, textTransform: "uppercase" },
  paletteGrid: { gap: 10 },
  paletteCard: { borderWidth: 1, padding: 14, flexDirection: "row", gap: 12, alignItems: "center" },
  card: { borderWidth: 1, padding: 14, marginBottom: 10 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  itemMeta: { marginTop: 3, fontSize: 13, fontFamily: "Inter_400Regular" },
  previewBox: { borderTopWidth: 1, marginTop: 12, paddingTop: 10, gap: 4 },
  previewText: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  smallButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  smallButtonText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  modalBackdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 640, maxHeight: "90%", borderWidth: 1, padding: 18 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDescription: { marginTop: 6, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  modalScroll: { marginTop: 14, maxHeight: 560 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  optionGrid: { gap: 8, marginBottom: 12 },
  optionCard: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 14, padding: 12 },
  optionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  optionMeta: { marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: "Inter_400Regular" },
  formBlock: { marginTop: 12, gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  multilineInput: { minHeight: 104, textAlignVertical: "top" },
  errorText: { marginTop: 10, fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
