import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { listApplications } from "../lib/baserow";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Table } from "../types/models";
import { ViewSwitcher } from "../components/ViewSwitcher";
import { ViewType } from "../types/models";

type Props = {
  databaseId?: string;
};

export const TablesScreen: React.FC<Props> = ({ databaseId }) => {
  const [view, setView] = useState<ViewType>("grid");
  // Load tables from API by reading the database's apps data
  const { apiCall } = useAuth();
  const { data: apps } = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiCall((c) => listApplications(c)),
    enabled: true,
  });

  const tables = useMemo(() => {
    const dbId = databaseId ? String(databaseId) : undefined;
    if (!apps) return [] as Table[];
    const app = (apps as any[]).find((a) => String(a.id) === dbId);
    const raw = (app?.tables ?? []) as any[];
    return raw.map((t) => ({
      id: String(t.id),
      name: t.name ?? "Table",
      databaseId: dbId ?? "",
      fields: [],
    })) as Table[];
  }, [apps, databaseId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tables</Text>
      <ViewSwitcher value={view} onChange={setView} />
      <FlatList
        data={tables}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.viewTag}>{view.toUpperCase()}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemText: { fontSize: 16 },
  viewTag: { fontSize: 12, color: "#666" },
});

export default TablesScreen;
