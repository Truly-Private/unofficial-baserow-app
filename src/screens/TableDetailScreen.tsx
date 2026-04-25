import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { listFields } from "../lib/baserow";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Field } from "../types/models";
import { SelectOptionsEditor } from "../components/SelectOptionsEditor";

type Props = {
  tableId?: string;
};

export const TableDetailScreen: React.FC<Props> = ({ tableId }) => {
  const { apiCall } = useAuth();
  const numericTableId = Number(tableId);
  const { data: apiFields } = useQuery({
    queryKey: ["fields", tableId],
    queryFn: () => apiCall((c) => listFields(c, numericTableId)),
    enabled: Number.isFinite(numericTableId),
  });
  const fields = useMemo(
    () => (apiFields ?? []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)),
    [apiFields],
  );

  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const toggleExpand = (fieldId: string) => {
    setExpandedFieldId((prev) => (prev === fieldId ? null : fieldId));
  };

  const isSelectType = (f: Field) =>
    f.type === "select" || f.type === "multiselect";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Table Detail</Text>
      <FlatList
        data={fields}
        keyExtractor={(f) => f.id}
        renderItem={({ item }) => (
          <View style={styles.fieldWrapper}>
            <TouchableOpacity
              style={styles.fieldItem}
              onPress={() => isSelectType(item) && toggleExpand(item.id)}
              activeOpacity={isSelectType(item) ? 0.7 : 1}
            >
              <View style={styles.fieldInfo}>
                <Text style={styles.fieldName}>{item.name}</Text>
                <Text style={styles.fieldType}>{item.type}</Text>
              </View>
              {isSelectType(item) && (
                <Text style={styles.chevron}>
                  {expandedFieldId === item.id ? "▲" : "▼"}
                </Text>
              )}
            </TouchableOpacity>

            {isSelectType(item) && expandedFieldId === item.id && (
              <SelectOptionsEditor
                fieldId={Number(item.id)}
                options={item.options ?? []}
                invalidateKeys={[["fields", tableId]]}
              />
            )}
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  fieldWrapper: { marginBottom: 2 },
  fieldItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  fieldInfo: { flex: 1 },
  fieldName: { fontSize: 14 },
  fieldType: { fontSize: 12, color: "#666", marginTop: 2 },
  chevron: { fontSize: 12, color: "#999", marginLeft: 8 },
});

export default TableDetailScreen;
