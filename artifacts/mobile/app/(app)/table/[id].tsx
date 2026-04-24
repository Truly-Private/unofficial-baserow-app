import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FieldDisplay } from "@/components/FieldDisplay";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  getPrimaryDisplay,
  listFields,
  listRows,
  type BaserowField,
  type BaserowRow,
} from "@/lib/baserow";

export default function TableScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    database?: string;
  }>();
  const tableId = Number(params.id);
  const tableName = (params.name as string) || "Table";
  const databaseName = params.database as string | undefined;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fieldsQuery = useQuery({
    queryKey: ["fields", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const rowsQuery = useQuery({
    queryKey: ["rows", creds.baseUrl, tableId, debouncedSearch],
    queryFn: () =>
      apiCall((c) => listRows(c, tableId, { search: debouncedSearch })),
    enabled: Number.isFinite(tableId),
  });

  const fields = (fieldsQuery.data ?? []).slice().sort((a, b) => a.order - b.order);
  const secondaryFields = fields.filter((f) => !f.primary).slice(0, 2);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  const renderItem = ({ item }: { item: BaserowRow }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(app)/row/[tableId]/[rowId]",
          params: {
            tableId: String(tableId),
            rowId: String(item.id),
            tableName,
          },
        })
      }
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.surface : colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.rowTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {getPrimaryDisplay(item, fields)}
        </Text>
        {secondaryFields.map((f) => {
          const v = item[f.name];
          if (v === null || v === undefined || v === "") return null;
          return (
            <View key={f.id} style={styles.secondaryRow}>
              <Text
                style={[styles.secondaryLabel, { color: colors.mutedForeground }]}
                numberOfLines={1}
              >
                {f.name}
              </Text>
              <View style={{ flex: 1 }}>
                <FieldDisplay field={f} value={v} compact />
              </View>
            </View>
          );
        })}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: tableName,
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(app)/row/[tableId]/new",
                  params: { tableId: String(tableId), tableName },
                })
              }
              hitSlop={10}
              style={{ paddingHorizontal: 4 }}
            >
              <Feather name="plus" size={22} color={colors.primary} />
            </Pressable>
          ),
        }}
      />

      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={`Search ${tableName}`}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 ? (
          <Pressable hitSlop={6} onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : (
          rowsQuery.isFetching && !rowsQuery.isLoading ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : null
        )}
      </View>

      {databaseName ? (
        <Text style={[styles.crumb, { color: colors.mutedForeground }]}>
          {databaseName}
        </Text>
      ) : null}

      {fieldsQuery.isLoading || rowsQuery.isLoading ? (
        <LoadingState />
      ) : fieldsQuery.isError || rowsQuery.isError ? (
        <ErrorState
          title="Could not load this table"
          message={
            (fieldsQuery.error instanceof Error && fieldsQuery.error.message) ||
            (rowsQuery.error instanceof Error && rowsQuery.error.message) ||
            undefined
          }
          onRetry={() => {
            fieldsQuery.refetch();
            rowsQuery.refetch();
          }}
        />
      ) : (rowsQuery.data?.results.length ?? 0) === 0 ? (
        <EmptyState
          icon={debouncedSearch ? "search" : "list"}
          title={debouncedSearch ? "No matching rows" : "No rows yet"}
          description={
            debouncedSearch
              ? "Try a different search term."
              : "Tap the + button to add your first row."
          }
        />
      ) : (
        <FlatList
          data={rowsQuery.data?.results ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: bottomPad + 24,
            gap: 10,
          }}
          refreshing={rowsQuery.isRefetching}
          onRefresh={() => rowsQuery.refetch()}
          ListFooterComponent={
            (rowsQuery.data?.count ?? 0) > (rowsQuery.data?.results.length ?? 0) ? (
              <Text
                style={[styles.footerHint, { color: colors.mutedForeground }]}
              >
                Showing first {rowsQuery.data?.results.length} of{" "}
                {rowsQuery.data?.count} rows
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingVertical: 0,
  },
  crumb: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1,
  },
  rowTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 2,
  },
  secondaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  secondaryLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    width: 80,
  },
  footerHint: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 16,
  },
});

export type RowItem = { field: BaserowField; value: unknown };
