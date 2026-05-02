import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  listRowHistory,
  type BaserowRowHistoryItem,
} from "@/lib/baserow";

export default function RowHistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { apiCall } = useAuth();

  const params = useLocalSearchParams<{ 
    tableId: string; 
    rowId: string; 
    tableName?: string 
  }>();
  
  const tableId = Number(params.tableId);
  const rowId = Number(params.rowId);
  const tableName = params.tableName ?? "Row";

  const [page, setPage] = useState(0);

  const historyQuery = useQuery({
    queryKey: ["row-history", tableId, rowId, page],
    queryFn: () => apiCall((c) => listRowHistory(c, tableId, rowId, { limit: 50, offset: page * 50 })),
    enabled: Number.isFinite(tableId) && Number.isFinite(rowId),
  });

  const history = historyQuery.data?.results ?? [];
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <View style={[hs.root, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: `Row History — ${tableName} · #${rowId}`,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      {historyQuery.isLoading ? (
        <LoadingState />
      ) : historyQuery.isError ? (
        <ErrorState
          title="Could not load history"
          message={historyQuery.error instanceof Error ? historyQuery.error.message : undefined}
          onRetry={() => historyQuery.refetch()}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 40 }}
          refreshControl={
            <RefreshControl
              refreshing={historyQuery.isRefetching}
              onRefresh={() => historyQuery.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          {history.length === 0 ? (
            <View style={hs.empty}>
              <Feather name="clock" size={48} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[hs.emptyText, { color: colors.mutedForeground }]}>No history found for this row.</Text>
            </View>
          ) : (
            history.map((item, idx) => (
              <View key={item.id} style={[hs.item, { borderBottomColor: colors.border, borderBottomWidth: idx === history.length - 1 ? 0 : 0.5 }]}>
                <View style={hs.itemHeader}>
                  <View style={[hs.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={hs.avatarText}>{(item.user_first_name?.[0] ?? item.user_email?.[0] ?? "?").toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[hs.userName, { color: colors.text }]}>
                      {item.user_first_name || item.user_email}
                    </Text>
                    <Text style={[hs.timestamp, { color: colors.mutedForeground }]}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[hs.badge, { backgroundColor: colors.muted }]}>
                    <Text style={[hs.badgeText, { color: colors.mutedForeground }]}>{item.action_type}</Text>
                  </View>
                </View>

                {/* Changes summary */}
                <View style={hs.changes}>
                  {Object.keys(item.after).map((key) => {
                    const beforeVal = item.before[key];
                    const afterVal = item.after[key];
                    if (JSON.stringify(beforeVal) === JSON.stringify(afterVal)) return null;

                    return (
                      <View key={key} style={hs.changeRow}>
                        <Text style={[hs.fieldName, { color: colors.mutedForeground }]}>{key}:</Text>
                        <View style={hs.changeValues}>
                          <Text style={[hs.oldValue, { color: colors.destructive }]} numberOfLines={1}>
                            {String(beforeVal ?? "empty")}
                          </Text>
                          <Feather name="arrow-right" size={10} color={colors.mutedForeground} />
                          <Text style={[hs.newValue, { color: colors.primary }]} numberOfLines={1}>
                            {String(afterVal ?? "empty")}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const hs = StyleSheet.create({
  root: { flex: 1 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 8 },
  emptyText: { fontSize: 15 },
  item: { paddingVertical: 16, gap: 12 },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  userName: { fontSize: 14, fontWeight: "600" },
  timestamp: { fontSize: 11, marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  changes: { marginLeft: 44, gap: 4 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldName: { fontSize: 12, fontWeight: "600", width: 80 },
  changeValues: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  oldValue: { fontSize: 12, textDecorationLine: "line-through", flex: 0.4 },
  newValue: { fontSize: 12, fontWeight: "500", flex: 0.6 },
});
