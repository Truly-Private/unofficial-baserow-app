// Lightweight type definitions for Baserow-like entities
export interface User {
  id: string;
  username?: string;
  email?: string;
}

export interface Field {
  id: string;
  name: string;
  type: string;
}

export interface Table {
  id: string;
  name: string;
  databaseId: string;
}

export interface View {
  id: string;
  name: string;
  type: string; // grid, form, kanban, etc
}

export interface Row {
  id: string;
  values: Record<string, any>;
}

export interface Database {
  id: string;
  name: string;
  owner?: string;
}
