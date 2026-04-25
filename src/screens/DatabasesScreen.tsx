import React, { useMemo } from "react";
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
import { Database } from "../types/models";

export const DatabasesScreen: React.FC = () => {
  const { apiCall } = useAuth();
  // Fetch real databases from API
  const { data: apps } = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiCall((c) => listApplications(c)),
    enabled: true,
  });

  // Normalize API data into our Database model
  const data: Database[] = useMemo(() => {
    if (!apps) return [];
    return (apps as any[]).map((a) => ({
      id: String(a.id),
      name: a.name ?? "Untitled",
      tables: ((a as any).tables ?? []).map((t: any) => ({
        id: String(t.id),
        name: t.name ?? "Table",
        databaseId: String(a.id),
        fields: [],
      })),
    }));
  }, [apps]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Databases</Text>
      <FlatList
        data={data}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemTitle}>{item.name}</Text>
            <TouchableOpacity style={styles.openBtn}>
              <Text style={styles.openBtnText}>Open</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 12 },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  itemTitle: { fontSize: 16 },
  openBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#eaeaea",
    borderRadius: 6,
  },
  openBtnText: { fontSize: 12, color: "#333" },
});

export default DatabasesScreen;
