import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "../contexts/AuthContext";
import { listRows } from "../lib/baserow";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

type Row = { id: string; values: Record<string, any> };

export const RowsScreen: React.FC = () => {
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ tableId?: string }>();
  const tableId = Number(params.tableId);
  const { data: rowsData, isLoading } = useQuery({
    queryKey: ["rows", tableId],
    queryFn: () => apiCall((c) => listRows(c, tableId)),
    enabled: Number.isFinite(tableId),
  });
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => {
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  };
  const rows: any[] = (rowsData?.results ?? []) as any[];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rows</Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r?.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => toggle(String(item?.id))}
          >
            <Text style={styles.rowText}>
              {String((item as any).Name ?? item?.id)}
            </Text>
            <Text style={styles.checkbox}>
              {selected.includes(String(item?.id)) ? "[x]" : "[ ]"}
            </Text>
          </TouchableOpacity>
        )}
      />
      <View style={styles.bulkBar}>
        <Text style={styles.bulkText}>
          Bulk actions: {selected.length} selected
        </Text>
        <TouchableOpacity style={styles.bulkBtn}>
          <Text>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  rowText: { fontSize: 16 },
  checkbox: { fontSize: 14, color: "#666" },
  bulkBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
  },
  bulkText: { fontSize: 14, color: "#666" },
  bulkBtn: { padding: 6, backgroundColor: "#eee", borderRadius: 6 },
});

export default RowsScreen;
