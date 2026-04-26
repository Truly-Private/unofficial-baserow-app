import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

export type JsonAction = {
  title: string;
  description?: string;
  initialJson?: string;
  submitLabel?: string;
  destructive?: boolean;
  requiresJson?: boolean;
};

type JsonActionModalProps = {
  action: JsonAction | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
};

function parsePayload(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) return {};
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Payload must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

export function JsonActionModal({
  action,
  loading,
  onClose,
  onSubmit,
}: JsonActionModalProps) {
  const colors = useColors();
  const [json, setJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJson(action?.initialJson ?? "{}");
    setError(null);
  }, [action]);

  const visible = !!action;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(15, 23, 42, 0.45)" }]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>
            {action?.title}
          </Text>
          {action?.description ? (
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {action.description}
            </Text>
          ) : null}
          <ScrollView style={styles.editorWrap} keyboardShouldPersistTaps="handled">
            <TextInput
              value={json}
              onChangeText={(text) => {
                setJson(text);
                setError(null);
              }}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.editor,
                {
                  color: colors.foreground,
                  borderColor: error ? colors.destructive : colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
          </ScrollView>
          {error ? (
            <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
          ) : null}
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} />
            <Button
              title={action?.submitLabel ?? "Run"}
              variant={action?.destructive ? "destructive" : "primary"}
              loading={loading}
              onPress={() => {
                try {
                  const payload = parsePayload(json);
                  if (action?.requiresJson && Object.keys(payload).length === 0) {
                    setError("This action needs a JSON payload.");
                    return;
                  }
                  onSubmit(payload);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Invalid JSON");
                }
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 18 },
  card: { width: "100%", maxWidth: 520, maxHeight: "86%", borderWidth: 1, padding: 18 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  description: { marginTop: 6, fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular" },
  editorWrap: { marginTop: 14, maxHeight: 320 },
  editor: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
    textAlignVertical: "top",
  },
  error: { marginTop: 8, fontSize: 13, fontFamily: "Inter_500Medium" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
});
