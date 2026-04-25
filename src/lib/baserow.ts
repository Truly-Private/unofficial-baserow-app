import { ApiClient } from "../api/client";
import { Endpoints } from "../api/endpoints";
import {
  getFieldWithOptions,
  addSelectOption,
  updateSelectOption,
  deleteSelectOption,
  SelectOptionPayload,
} from "../api/database";
import type { Database, Field } from "../types/models";

// Phase 2: simple adapter to map list of databases into app-friendly shape.
export async function listApplications(client: ApiClient): Promise<Database[]> {
  // Fetch raw databases from the API
  const data = await client.get(Endpoints.databases.list());

  // Normalize to our Database model: { id, name, tables[] }
  if (!Array.isArray(data)) {
    return [];
  }

  const databases: Database[] = data.map((db: any) => {
    const id = String(db.id ?? db.database_id ?? 0);
    const name = db.name ?? `Database ${id}`;
    const tablesFromApi = (db.tables ?? []) as any[];
    const tables = tablesFromApi.map((t: any) => ({
      id: String(t.id ?? t.table_id ?? 0),
      name: t.name ?? "Table",
      databaseId: id,
      fields: [],
    }));
    return {
      id,
      name,
      tables,
    };
  });

  return databases;
}

// Normalize a raw API field object to our Field model
function normalizeField(raw: any): Field {
  const apiType: string = raw.type ?? "";
  // Map Baserow API type names to our model type names
  let type: Field["type"] = "text";
  if (apiType === "single_select") {
    type = "select";
  } else if (apiType === "multiple_select") {
    type = "multiselect";
  } else if (
    [
      "text",
      "number",
      "boolean",
      "date",
      "file",
      "link",
      "lookup",
      "formula",
      "richtext",
      "datetime",
    ].includes(apiType)
  ) {
    type = apiType as Field["type"];
  }

  const options =
    type === "select" || type === "multiselect"
      ? ((raw.select_options ?? []) as any[]).map((o: any) => ({
          id: o.id,
          value: o.value ?? o.name ?? "",
          color: o.color ?? "blue",
        }))
      : undefined;

  return {
    id: String(raw.id ?? 0),
    name: raw.name ?? "Field",
    type,
    ...(options !== undefined && { options }),
  };
}

// List fields for a given table (by numeric tableId)
export async function listFields(
  client: ApiClient,
  tableId: number,
): Promise<Field[]> {
  const data = await client.get(Endpoints.fields.tableList(tableId));
  if (!Array.isArray(data)) return [];
  return data.map(normalizeField).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
}

// List rows for a given table (by numeric tableId)
export async function listRows(
  client: ApiClient,
  tableId: number,
): Promise<{ results: any[] }> {
  const data = await client.get(Endpoints.rows.list(String(tableId)));
  if (data && Array.isArray(data.results)) return data;
  if (Array.isArray(data)) return { results: data };
  return { results: [] };
}

// Fetch a single field (with its select options) by fieldId
export async function getField(
  client: ApiClient,
  fieldId: number,
): Promise<Field> {
  const raw = await getFieldWithOptions(client, fieldId);
  return normalizeField(raw);
}

// Add a new select option to a select/multiselect field
export async function addOption(
  client: ApiClient,
  fieldId: number,
  option: Omit<SelectOptionPayload, "id">,
  currentOptions: SelectOptionPayload[],
): Promise<Field> {
  const raw = await addSelectOption(client, fieldId, option, currentOptions);
  return normalizeField(raw);
}

// Update an existing select option on a select/multiselect field
export async function updateOption(
  client: ApiClient,
  fieldId: number,
  optionId: number,
  changes: Partial<Omit<SelectOptionPayload, "id">>,
  currentOptions: SelectOptionPayload[],
): Promise<Field> {
  const raw = await updateSelectOption(
    client,
    fieldId,
    optionId,
    changes,
    currentOptions,
  );
  return normalizeField(raw);
}

// Delete a select option from a select/multiselect field
export async function deleteOption(
  client: ApiClient,
  fieldId: number,
  optionId: number,
  currentOptions: SelectOptionPayload[],
): Promise<Field> {
  const raw = await deleteSelectOption(
    client,
    fieldId,
    optionId,
    currentOptions,
  );
  return normalizeField(raw);
}
