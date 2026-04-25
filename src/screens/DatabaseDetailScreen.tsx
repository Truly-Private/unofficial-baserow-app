import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { listApplications } from "../lib/baserow";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Table } from "../types/models";

type Props = {
  databaseId?: string;
};

export const DatabaseDetailScreen: React.FC<Props> = ({ databaseId }) => {
  const { apiCall } = useAuth();
  const { data: apps } = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiCall((c) => listApplications(c)),
    enabled: true,
  });

  const tables: Table[] = React.useMemo(() => {
    const app = (apps as any[])?.find((a) => String(a.id) === databaseId);
    const tbls = (app?.tables ?? []) as any[];
    return tbls.map((t) => ({
      id: String(t.id),
      name: t.name ?? "Table",
      databaseId: String(databaseId ?? ""),
      fields: [],
    }));
  }, [apps, databaseId]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Database Detail</Text>
      <Text style={styles.subtitle}>Tables</Text>
      <FlatList
        data={tables}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemText}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  subtitle: { fontSize: 16, color: "#666", marginTop: 8, marginBottom: 8 },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderColor: "#eee" },
  itemText: { fontSize: 14 },
});

export default DatabaseDetailScreen;
