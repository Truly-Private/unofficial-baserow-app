// Lightweight domain models for Baserow Mobile skeleton (Phase 2+)
export type ViewType = "grid" | "gallery" | "form" | "kanban";

export interface SelectOption {
  id?: number;
  value: string;
  color: string;
}

export interface Field {
  id: string;
  name: string;
  type:
    | "text"
    | "number"
    | "boolean"
    | "date"
    | "file"
    | "link"
    | "lookup"
    | "formula"
    | "richtext"
    | "datetime"
    | "select"
    | "multiselect";
  options?: SelectOption[];
}

export interface Table {
  id: string;
  name: string;
  databaseId: string;
  fields: Field[];
}

export interface Row {
  id: string;
  tableId: string;
  values: Record<string, any>;
}

export interface Database {
  id: string;
  name: string;
  tables: Table[];
}

export interface ViewSpec {
  type: ViewType;
  name?: string;
}
