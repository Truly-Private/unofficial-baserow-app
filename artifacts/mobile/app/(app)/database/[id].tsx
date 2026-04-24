import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import { listApplications } from "@/lib/baserow";

export default function DatabaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const databaseId = Number(params.id);
  const databaseNameParam = (params.name as string) || "";

  const query = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const database = useMemo(
    () => (query.data ?? []).find((a) => a.id === databaseId),
    [query.data, databaseId],
  );

  const tables = useMemo(
    () =>
      (database?.tables ?? []).slice().sort((a, b) => a.order - b.order),
    [database],
  );

  const databaseName = database?.name || databaseNameParam || "Database";
  const workspaceName =
    database?.workspace?.name ?? database?.group?.name ?? "Workspace";

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: databaseName }} />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          title="Could not load this database"
          message={
            query.error instanceof Error ? query.error.message : undefined
          }
          onRetry={() => query.refetch()}
        />
      ) : !database ? (
        <EmptyState
          icon="alert-triangle"
          title="Database not found"
          description="It may have been removed. Pull to refresh."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 12 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.headerWrap}>
            <Text style={[styles.crumb, { color: colors.mutedForeground }]}>
              {workspaceName}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {databaseName}
            </Text>
            <Text
              style={[styles.subtitle, { color: colors.mutedForeground }]}
            >
              {tables.length} {tables.length === 1 ? "table" : "tables"}
            </Text>
          </View>

          {tables.length === 0 ? (
            <View style={{ paddingTop: 32 }}>
              <EmptyState
                icon="layers"
                title="No tables in this database"
                description="Create a table in Baserow on the web, then pull to refresh."
              />
            </View>
          ) : (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {tables.map((table, idx) => (
                <Pressable
                  key={table.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/table/[id]",
                      params: {
                        id: String(table.id),
                        name: table.name,
                        database: databaseName,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.tableRow,
                    {
                      backgroundColor: pressed
                        ? colors.surface
                        : "transparent",
                      borderTopColor: colors.border,
                      borderTopWidth: idx === 0 ? 0 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: colors.muted,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Feather
                      name="layers"
                      size={16}
                      color={colors.mutedForeground}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.tableName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {table.name}
                    </Text>
                    <Text
                      style={[
                        styles.tableHint,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Tap to open rows
                    </Text>
                  </View>
                  <Feather
                    name="chevron-right"
                    size={18}
                    color={colors.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerWrap: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  crumb: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tableName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  tableHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
});
