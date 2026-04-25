import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { listFields } from "../lib/baserow";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { Field } from "../types/models";

type Props = {
  tableId?: string;
};

export const TableDetailScreen: React.FC<Props> = ({ tableId }) => {
  const { apiCall } = useAuth();
  const { data: apiFields } = useQuery({
    queryKey: ["fields", tableId],
    queryFn: () => apiCall((c) => listFields(c, Number(tableId))),
    enabled: Number.isFinite(Number(tableId)),
  });
  const fields = useMemo(
    () => (apiFields ?? []).slice().sort((a: any, b: any) => a.order - b.order),
    [apiFields],
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Table Detail</Text>
      <FlatList
        data={fields}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <View style={styles.fieldItem}>
            <Text style={styles.fieldName}>{item.name}</Text>
            <Text style={styles.fieldType}>{item.type}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  fieldItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  fieldName: { fontSize: 14 },
  fieldType: { fontSize: 12, color: "#666" },
});

export default TableDetailScreen;
