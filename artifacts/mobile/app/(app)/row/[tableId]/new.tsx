import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import {
  BaserowApiError,
  createRow,
  isEditable,
  listFields,
  preparePayload,
} from "@/lib/baserow";

export default function NewRowScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{
    tableId: string;
    tableName?: string;
  }>();
  const tableId = Number(params.tableId);
  const tableName = (params.tableName as string) || "New row";

  const fieldsQuery = useQuery({
    queryKey: ["fields", creds.baseUrl, tableId],
    queryFn: () => apiCall((c) => listFields(c, tableId)),
    enabled: Number.isFinite(tableId),
  });

  const fields = useMemo(
    () => (fieldsQuery.data ?? []).slice().sort((a, b) => a.order - b.order),
    [fieldsQuery.data],
  );

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (fields.length > 0) {
      const initial: Record<string, unknown> = {};
      for (const f of fields) {
        initial[f.name] = f.type === "boolean" ? false : null;
      }
      setValues(initial);
    }
  }, [fields]);

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = preparePayload(fields, values);
      return apiCall((c) => createRow(c, tableId, payload));
    },
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
      if (err instanceof BaserowApiError) setSaveError(err.message);
      else if (err instanceof Error) setSaveError(err.message);
      else setSaveError("Could not create row.");
    },
  });

  const editableFields = fields.filter(isEditable);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `New row in ${tableName}` }} />

      {fieldsQuery.isLoading ? (
        <LoadingState />
      ) : fieldsQuery.isError ? (
        <ErrorState
          title="Could not load fields"
          message={
            fieldsQuery.error instanceof Error
              ? fieldsQuery.error.message
              : undefined
          }
          onRetry={() => fieldsQuery.refetch()}
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
            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Fill in the fields below. Read-only fields will be set
              automatically.
            </Text>

            {editableFields.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                value={values[f.name]}
                onChange={(next) => {
                  setValues((prev) => ({ ...prev, [f.name]: next }));
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
                <Text style={[styles.errorText, { color: colors.destructive }]}>
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
              title="Create row"
              onPress={() => createMutation.mutate()}
              loading={createMutation.isPending}
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
  intro: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
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
