import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import { createTable, listApplications } from "@/lib/baserow";

export default function DatabaseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; name?: string }>();
  const databaseId = Number(params.id);
  const databaseNameParam = (params.name as string) || "";
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [tableName, setTableName] = useState("Untitled table");

  const query = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const database = useMemo(
    () => (query.data ?? []).find((a) => a.id === databaseId),
    [query.data, databaseId],
  );

  const tables = useMemo(
    () => (database?.tables ?? []).slice().sort((a, b) => a.order - b.order),
    [database],
  );

  const databaseName = database?.name || databaseNameParam || "Database";
  const workspaceName =
    database?.workspace?.name ?? database?.group?.name ?? "Workspace";

  const createTableMutation = useMutation({
    mutationFn: (name: string) =>
      apiCall((c) =>
        createTable(c, databaseId, {
          name,
          data: [["Name"]],
          first_row_header: true,
        }),
      ),
    onSuccess: async (table) => {
      await queryClient.invalidateQueries({
        queryKey: ["applications", creds.baseUrl, creds.user.id],
      });
      setCreateModalOpen(false);
      setTableName("Untitled table");
      router.push({
        pathname: "/(app)/table/[id]",
        params: {
          id: String(table.id),
          name: table.name,
          database: databaseName,
        },
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Please try again.";
      Alert.alert("Could not create table", message);
    },
  });

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
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {tables.length} {tables.length === 1 ? "table" : "tables"}
            </Text>

            <View style={styles.headerButtonRow}>
              <Button
                title="New table"
                onPress={() => setCreateModalOpen(true)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/database/[id]/permissions",
                    params: { id: String(databaseId), databaseName },
                  })
                }
                style={[styles.iconButton, { backgroundColor: colors.muted, borderColor: colors.border }]}
              >
                <Feather name="shield" size={18} color={colors.foreground} />
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(app)/snapshots",
                    params: { applicationId: String(databaseId), applicationName: databaseName },
                  })
                }
                style={[styles.iconButton, { backgroundColor: colors.muted, borderColor: colors.border, marginLeft: 8 }]}
              >
                <Feather name="camera" size={18} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {tables.length === 0 ? (
            <View style={{ paddingTop: 32 }}>
              <EmptyState
                icon="layers"
                title="No tables in this database"
                description="Create your first table from mobile, similar to the desktop database flow."
              />
              <View style={styles.emptyActionWrap}>
                <Button
                  title="Create table"
                  onPress={() => setCreateModalOpen(true)}
                />
              </View>
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
                      style={[styles.tableHint, { color: colors.mutedForeground }]}
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

      <Modal
        animationType="fade"
        transparent
        visible={createModalOpen}
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: "rgba(15, 23, 42, 0.4)" }]}
          onPress={() => setCreateModalOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.promptCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius + 8,
              },
            ]}
          >
            <View style={styles.promptHeader}>
              <Text style={[styles.promptTitle, { color: colors.foreground }]}>
                Create new table
              </Text>
              <Pressable onPress={() => setCreateModalOpen(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text
              style={[styles.promptHelperText, { color: colors.mutedForeground }]}
            >
              Create a new table in {databaseName}. A primary “Name” field will be
              added automatically.
            </Text>

            <Text style={[styles.label, { color: colors.foreground }]}>Name</Text>
            <TextInput
              value={tableName}
              onChangeText={setTableName}
              autoFocus
              placeholder="Untitled table"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            />

            <View style={styles.promptActionRow}>
              <Button
                title="Create table"
                onPress={() =>
                  createTableMutation.mutate(tableName.trim() || "Untitled table")
                }
                loading={createTableMutation.isPending}
                style={styles.promptActionButton}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  headerButtonRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emptyActionWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
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
  modalBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  promptCard: {
    width: "100%",
    maxWidth: 520,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  promptTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  promptHelperText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    minHeight: 56,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  },
  promptActionRow: {
    alignItems: "flex-end",
    marginTop: 18,
  },
  promptActionButton: {
    minWidth: 180,
  },
});
