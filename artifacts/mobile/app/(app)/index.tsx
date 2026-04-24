import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
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
import { listApplications, type BaserowApplication } from "@/lib/baserow";

type WorkspaceGroup = {
  id: number;
  name: string;
  applications: BaserowApplication[];
};

export default function WorkspacesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { signOut, apiCall } = useAuth();

  const query = useQuery({
    queryKey: ["applications", creds.baseUrl, creds.user.id],
    queryFn: () => apiCall((c) => listApplications(c)),
  });

  const groups = useMemo<WorkspaceGroup[]>(() => {
    const apps = query.data ?? [];
    const map = new Map<number, WorkspaceGroup>();
    for (const app of apps) {
      const ws = app.workspace ?? app.group ?? { id: 0, name: "Workspace" };
      const existing = map.get(ws.id);
      if (existing) {
        existing.applications.push(app);
      } else {
        map.set(ws.id, {
          id: ws.id,
          name: ws.name,
          applications: [app],
        });
      }
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      applications: g.applications.sort((a, b) => a.order - b.order),
    }));
  }, [query.data]);

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 24;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: "Your data",
          headerRight: () => (
            <Pressable
              hitSlop={10}
              onPress={() => router.push("/(app)/settings")}
              style={{ paddingHorizontal: 4 }}
            >
              <Feather name="settings" size={20} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      {query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState
          title="Could not load your workspaces"
          message={
            query.error instanceof Error
              ? query.error.message
              : "Please try again."
          }
          onRetry={() => query.refetch()}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon="folder"
          title="No databases yet"
          description="Create a database in Baserow on the web, then pull to refresh."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: bottomPad, paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => query.refetch()}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.greeting}>
            <Text style={[styles.greetingText, { color: colors.mutedForeground }]}>
              Signed in as
            </Text>
            <Text style={[styles.greetingEmail, { color: colors.foreground }]}>
              {creds.user.email}
            </Text>
          </View>

          {groups.map((group) => (
            <View key={group.id} style={styles.section}>
              <Text
                style={[styles.sectionTitle, { color: colors.mutedForeground }]}
              >
                {group.name}
              </Text>
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
                {group.applications.map((app, idx) => {
                  const tableCount = app.tables?.length ?? 0;
                  return (
                    <Pressable
                      key={app.id}
                      onPress={() =>
                        router.push({
                          pathname: "/(app)/database/[id]",
                          params: {
                            id: String(app.id),
                            name: app.name,
                          },
                        })
                      }
                      style={({ pressed }) => [
                        styles.dbRow,
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
                          styles.dbIcon,
                          {
                            backgroundColor: colors.muted,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Feather
                          name="database"
                          size={16}
                          color={colors.mutedForeground}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.dbName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {app.name}
                        </Text>
                        <Text
                          style={[
                            styles.dbHint,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          {tableCount === 0
                            ? "No tables"
                            : tableCount === 1
                              ? "1 table"
                              : `${tableCount} tables`}
                        </Text>
                      </View>
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Pressable
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
            style={({ pressed }) => [
              styles.signOut,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Feather name="log-out" size={14} color={colors.mutedForeground} />
            <Text
              style={[styles.signOutText, { color: colors.mutedForeground }]}
            >
              Sign out
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  greetingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  greetingEmail: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  dbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dbIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dbName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
  dbHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  signOutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
