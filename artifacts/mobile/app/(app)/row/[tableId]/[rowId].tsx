import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { FieldInput } from "@/components/FieldInput";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import {
  BASEROW_TABLE_EVENT_TYPES,
  useBaserowRealtime,
} from "@/hooks/useBaserowRealtime";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  BaserowApiError,
  deleteRow,
  getRow,
  listFields,
  preparePayload,
  updateRow,
} from "@/lib/baserow";

export default function EditRowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    tableId: string;
    rowId: string;
    tableName?: string;
  }>();
  const tableId = Number(params.tableId);
  const rowId = Number(params.rowId);
  const tableName = (params.tableName as string) || "Row";

  const fieldsQuery = useQuery({
    queryKey: ["fields", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const rowQuery = useQuery({
    queryKey: ["row", creds.baseUrl, tableId, rowId],
    queryFn: () => apiCall((c) => getRow(c, tableId, rowId)),
    enabled: Number.isFinite(tableId) && Number.isFinite(rowId),
  });

  const fields = useMemo(
    () => (fieldsQuery.data ?? []).slice().sort((a, b) => a.order - b.order),
    [fieldsQuery.data],
  );

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useBaserowRealtime(
    creds,
    Number.isFinite(tableId) && Number.isFinite(rowId)
      ? { page: "row", tableId, rowId }
      : null,
    (message) => {
      if (!message.type || !BASEROW_TABLE_EVENT_TYPES.has(message.type)) return;
      queryClient.invalidateQueries({
        queryKey: ["fields", creds.baseUrl, tableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["row", creds.baseUrl, tableId, rowId],
      });
    },
  );

  useEffect(() => {
    if (rowQuery.data && fields.length > 0) {
      const initial: Record<string, unknown> = {};
      for (const f of fields) {
        initial[f.name] = rowQuery.data[f.name] ?? null;
      }
      setValues(initial);
      setDirty(false);
    }
  }, [rowQuery.data, fields]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const payload = preparePayload(fields, values);
      return apiCall((c) => updateRow(c, tableId, rowId, payload));
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
      queryClient.invalidateQueries({
        queryKey: ["row", creds.baseUrl, tableId, rowId],
      });
      router.back();
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      if (err instanceof BaserowApiError) setSaveError(err.message);
      else if (err instanceof Error) setSaveError(err.message);
      else setSaveError("Could not save changes.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiCall((c) => deleteRow(c, tableId, rowId)),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      queryClient.invalidateQueries({
        queryKey: ["rows", creds.baseUrl, tableId],
      });
      router.back();
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      Alert.alert(
        "Could not delete row",
        err instanceof Error ? err.message : "Please try again.",
      );
    },
  });

  function confirmDelete() {
    Alert.alert(
      "Delete this row?",
      "This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(),
        },
      ],
    );
  }

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: tableName,
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: "/row/[tableId]/[rowId]/history",
                    params: { tableId, rowId, tableName },
                  })
                }
                style={{ paddingHorizontal: 8 }}
                testID="row-history-btn"
              >
                <Feather name="clock" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  router.push({
                    pathname: "/row/[tableId]/[rowId]/comments",
                    params: { tableId, rowId, tableName },
                  })
                }
                style={{ paddingHorizontal: 8 }}
                testID="row-comments-btn"
              >
                <Feather name="message-circle" size={20} color={colors.foreground} />
              </Pressable>
              <Pressable
                hitSlop={10}
                onPress={confirmDelete}
                disabled={deleteMutation.isPending}
                style={{ paddingHorizontal: 4, opacity: deleteMutation.isPending ? 0.5 : 1 }}
              >
                <Feather name="trash-2" size={20} color={colors.destructive} />
              </Pressable>
            </View>
          ),
        }}
      />

      {fieldsQuery.isLoading || rowQuery.isLoading ? (
        <LoadingState />
      ) : fieldsQuery.isError || rowQuery.isError ? (
        <ErrorState
          title="Could not load this row"
          message={
            (fieldsQuery.error instanceof Error && fieldsQuery.error.message) ||
            (rowQuery.error instanceof Error && rowQuery.error.message) ||
            undefined
          }
          onRetry={() => {
            fieldsQuery.refetch();
            rowQuery.refetch();
          }}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.fill}
        >
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              paddingBottom: bottomPad + 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {fields.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                value={values[f.name]}
                reminderKey={`${tableId}_${rowId}_${f.id}`}
                onChange={(next) => {
                  setValues((prev) => ({ ...prev, [f.name]: next }));
                  setDirty(true);
                  setSaveError(null);
                }}
              />
            ))}
            {saveError ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.destructive,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Feather
                  name="alert-circle"
                  size={16}
                  color={colors.destructive}
                />
                <Text
                  style={[styles.errorText, { color: colors.destructive }]}
                >
                  {saveError}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: bottomPad + 12,
              },
            ]}
          >
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => router.back()}
              style={{ flex: 1 }}
            />
            <Button
              title={dirty ? "Save changes" : "Saved"}
              onPress={() => updateMutation.mutate()}
              disabled={!dirty}
              loading={updateMutation.isPending}
              style={{ flex: 1.5 }}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  actionBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
