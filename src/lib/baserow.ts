import { ApiClient } from "../api/client";
import { Endpoints } from "../api/endpoints";
import type { Database } from "../types/models";

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
