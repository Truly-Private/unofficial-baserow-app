import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Clipboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  rotateViewSlug,
  updateView,
  type BaserowView,
} from "@/lib/baserow";

export default function ViewSharingScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string; viewName?: string; tableId: string }>();
  const viewId = Number(params.id);
  const tableId = Number(params.tableId);
  const viewName = params.viewName || "View";

  const [password, setPassword] = useState("");

  const viewQuery = useQuery({
    queryKey: ["view", viewId],
    queryFn: async () => {
      // We need a way to get a single view's full details
      // For now we'll assume it's in the listViews cache or fetch it
      const response = await fetch(`${creds.baseUrl}/api/database/views/${viewId}/`, {
        headers: { Authorization: `JWT ${creds.jwt}` },
      });
      if (!response.ok) throw new Error("Failed to load view");
      return response.json();
    },
    enabled: !!viewId,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BaserowView>) => apiCall((c) => updateView(c, viewId, data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view", viewId] });
      queryClient.invalidateQueries({ queryKey: ["views", creds.baseUrl, tableId] });
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to update sharing"),
  });

  const rotateMutation = useMutation({
    mutationFn: () => apiCall((c) => rotateViewSlug(c, viewId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["view", viewId] });
      Alert.alert("Success", "Sharing link has been rotated.");
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to rotate slug"),
  });

  if (viewQuery.isLoading) return <LoadingState />;
  const view = viewQuery.data as BaserowView;

  const publicUrl = view?.public_view_slug ? `${creds.baseUrl}/public/grid/${view.public_view_slug}` : "";

  const handleCopy = () => {
    Clipboard.setString(publicUrl);
    Alert.alert("Copied", "Public URL copied to clipboard.");
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Sharing: ${viewName}` }} />

      <View style={styles.section}>
        <View style={styles.row}>
          <View style={styles.meta}>
            <Text style={[styles.label, { color: colors.foreground }]}>Public Sharing</Text>
            <Text style={[styles.desc, { color: colors.mutedForeground }]}>
              Anyone with the link can view the data in this view.
            </Text>
          </View>
          <Pressable
            onPress={() => updateMutation.mutate({ public: !view.public })}
            style={styles.toggle}
          >
            <Feather
              name={view.public ? "toggle-right" : "toggle-left"}
              size={32}
              color={view.public ? colors.primary : colors.mutedForeground}
            />
          </Pressable>
        </View>

        {view.public && (
          <View style={[styles.publicInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.urlLabel, { color: colors.mutedForeground }]}>Public URL</Text>
            <View style={styles.urlRow}>
              <Text style={[styles.urlText, { color: colors.foreground }]} numberOfLines={1}>
                {publicUrl}
              </Text>
              <Pressable onPress={handleCopy} style={styles.copyBtn}>
                <Feather name="copy" size={18} color={colors.primary} />
              </Pressable>
            </View>

            <Button
              title="Rotate Sharing Link"
              variant="ghost"
              onPress={() => {
                Alert.alert("Rotate Link?", "This will invalidate the current public link. This cannot be undone.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Rotate", style: "destructive", onPress: () => rotateMutation.mutate() },
                ]);
              }}
              style={styles.rotateBtn}
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.foreground }]}>Password Protection</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]}>
          Require a password to access the public view.
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter new password..."
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry
        />

        <Button
          title="Update Password"
          onPress={() => updateMutation.mutate({ public_view_password: password })}
          loading={updateMutation.isPending}
          disabled={!password}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { flex: 1, marginRight: 16 },
  label: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  desc: { fontSize: 14, lineHeight: 20 },
  toggle: { padding: 4 },
  publicInfo: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1 },
  urlLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: 8 },
  urlRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  urlText: { flex: 1, fontSize: 14, marginRight: 12 },
  copyBtn: { padding: 4 },
  rotateBtn: { alignSelf: "flex-start" },
  input: { height: 48, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, fontSize: 16, marginVertical: 16 },
});
