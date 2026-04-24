import { Redirect, Stack } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function AppLayout() {
  const colors = useColors();
  const { status } = useAuth();

  if (status === "loading") return null;
  if (status === "signedOut") return <Redirect href="/login" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          color: colors.foreground,
        },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerBackTitle: "Back",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Workspaces" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen name="database/[id]" options={{ title: "Database" }} />
      <Stack.Screen name="table/[id]" options={{ title: "Table" }} />
      <Stack.Screen
        name="row/[tableId]/[rowId]"
        options={{ title: "Edit row", presentation: "card" }}
      />
      <Stack.Screen
        name="row/[tableId]/new"
        options={{ title: "New row", presentation: "card" }}
      />
    </Stack>
  );
}
