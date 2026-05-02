import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import {
  installTemplateAsync,
  listTemplates,
  listWorkspaces,
  type BaserowTemplate,
  type BaserowTemplateCategory,
} from "@/lib/baserow";

export default function TemplatesScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ workspaceId?: string }>();
  const workspaceId = Number(params.workspaceId);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BaserowTemplate | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["templates", creds.baseUrl],
    queryFn: () => apiCall((c) => listTemplates(c)),
  });

  const workspacesQuery = useQuery({
    queryKey: ["workspaces", creds.baseUrl],
    queryFn: () => apiCall((c) => listWorkspaces(c)),
    enabled: !workspaceId,
  });

  const installMutation = useMutation({
    mutationFn: (targetWorkspaceId: number) =>
      apiCall((c) => installTemplateAsync(c, targetWorkspaceId, selectedTemplate!.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      Alert.alert("Success", "Template installation started. It will appear in your dashboard shortly.");
      router.replace("/(app)" as any);
    },
    onError: (err) => Alert.alert("Error", err instanceof Error ? err.message : "Failed to install template"),
  });

  const categories = templatesQuery.data || [];
  const activeCategory = useMemo(() => 
    categories.find(c => c.id === selectedCategory) || categories[0],
    [categories, selectedCategory]
  );

  const handleInstall = () => {
    if (workspaceId) {
      installMutation.mutate(workspaceId);
    } else {
      const workspaces = workspacesQuery.data || [];
      if (workspaces.length === 0) {
        Alert.alert("No Workspaces", "Please create a workspace first.");
        return;
      }
      
      Alert.alert(
        "Select Workspace",
        "Where would you like to install this template?",
        workspaces.map(ws => ({
          text: ws.name,
          onPress: () => installMutation.mutate(ws.id)
        })).concat([{ text: "Cancel", style: "cancel" }] as any)
      );
    }
  };

  if (templatesQuery.isLoading) return <LoadingState />;
  if (templatesQuery.isError) return <ErrorState title="Could not load templates" onRetry={() => templatesQuery.refetch()} />;

  if (selectedTemplate) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: selectedTemplate.name }} />
        <ScrollView contentContainerStyle={styles.detailContent}>
          <View style={[styles.detailHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="file-text" size={48} color={colors.primary} />
            <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedTemplate.name}</Text>
            <Text style={[styles.detailCategory, { color: colors.mutedForeground }]}>{activeCategory?.name}</Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this template</Text>
          <Text style={[styles.detailDescription, { color: colors.mutedForeground }]}>
            This template includes a pre-configured database structure optimized for {activeCategory?.name.toLowerCase()} workflows. 
            Once installed, you can customize fields, views, and data to fit your needs.
          </Text>

          <View style={styles.actionWrap}>
            <Button 
              title="Install Template" 
              onPress={handleInstall} 
              loading={installMutation.isPending}
            />
            <Button 
              title="Back to Browser" 
              variant="ghost" 
              onPress={() => setSelectedTemplate(null)} 
              style={{ marginTop: 12 }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: "Template Browser" }} />

      <View style={[styles.categoryScroll, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: (selectedCategory === cat.id || (!selectedCategory && cat === categories[0])) ? colors.primary : colors.surface,
                  borderColor: (selectedCategory === cat.id || (!selectedCategory && cat === categories[0])) ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={{ 
                color: (selectedCategory === cat.id || (!selectedCategory && cat === categories[0])) ? colors.primaryForeground : colors.foreground,
                fontWeight: "600"
              }}>
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={activeCategory?.templates || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.templateList}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedTemplate(item)}
            style={({ pressed }) => [
              styles.templateCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.templateIcon, { backgroundColor: colors.muted }]}>
              <Feather name="layout" size={24} color={colors.primary} />
            </View>
            <View style={styles.templateMeta}>
              <Text style={[styles.templateName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.templateHint, { color: colors.mutedForeground }]}>
                Tap to preview
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  categoryScroll: { paddingVertical: 12, borderBottomWidth: 1 },
  categories: { paddingHorizontal: 16 },
  categoryPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  templateList: { padding: 16 },
  templateCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  templateIcon: { width: 48, height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 16 },
  templateMeta: { flex: 1 },
  templateName: { fontSize: 16, fontWeight: "600" },
  templateHint: { fontSize: 12, marginTop: 2 },
  detailContent: { padding: 24 },
  detailHeader: { alignItems: "center", padding: 32, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  detailTitle: { fontSize: 24, fontWeight: "700", marginTop: 16 },
  detailCategory: { fontSize: 14, marginTop: 4, textTransform: "uppercase", letterSpacing: 1 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  detailDescription: { fontSize: 15, lineHeight: 22, marginBottom: 32 },
  actionWrap: { width: "100%" },
});
