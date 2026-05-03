import { Feather } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
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
  getJob,
  type BaserowCredentials,
  type BaserowJob,
} from "@/lib/baserow";

type ExporterType = "csv" | "excel" | "json";

type ExportOptions = {
  exporter_type: ExporterType;
  export_charset?: string;
  csv_column_separator?: string;
  csv_include_header?: boolean;
  csv_first_row_header?: boolean;
};

async function createExportJob(
  creds: BaserowCredentials,
  tableId: number,
  options: ExportOptions,
): Promise<BaserowJob> {
  const response = await fetch(
    `${creds.baseUrl}/api/database/export/table/${tableId}/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${creds.jwt}`,
      },
      body: JSON.stringify(options),
    },
  );
  if (!response.ok) {
    let message = `Failed to start export job (${response.status}).`;
    try {
      const data = await response.json();
      if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (typeof d.detail === "string") {
          message = d.detail;
        } else if (d.detail && typeof d.detail === "object") {
          const fieldErrors = Object.entries(
            d.detail as Record<string, unknown>,
          )
            .map(([field, errs]) => {
              const messages = Array.isArray(errs)
                ? errs
                    .map((e) =>
                      e && typeof e === "object" && "error" in e
                        ? String((e as { error: unknown }).error)
                        : String(e),
                    )
                    .join(", ")
                : String(errs);
              return `${field}: ${messages}`;
            })
            .join("\n");
          if (fieldErrors) message = fieldErrors;
        } else if (typeof d.error === "string") {
          message = d.error;
        }
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new Error(message);
  }
  return response.json();
}

export default function ExportScreen() {
  const colors = useColors();
  const creds = useCreds();
  const { apiCall } = useAuth();
  const params = useLocalSearchParams<{ id: string; tableName?: string }>();
  const tableId = Number(params.id);
  const tableName = params.tableName || "Table";

  const [jobId, setJobId] = useState<number | null>(null);
  const [exportType, setExportType] = useState<ExporterType>("csv");

  const jobQuery = useQuery({
    queryKey: ["job", creds.baseUrl, jobId],
    queryFn: () => apiCall((c) => getJob(c, jobId!)),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data as BaserowJob | undefined;
      if (job?.state === "failed" || job?.state === "finished" || job?.state === "cancelled") {
        return false;
      }
      return 2000;
    },
  });

  const isPremiumOnly = exportType === "excel" || exportType === "json";

  const exportMutation = useMutation({
    mutationFn: () => {
      const options: ExportOptions = { exporter_type: exportType };
      if (exportType === "csv") {
        options.export_charset = "utf-8";
        options.csv_column_separator = ",";
        options.csv_include_header = true;
        options.csv_first_row_header = true;
      }
      return createExportJob(creds, tableId, options);
    },
    onSuccess: (job: BaserowJob) => setJobId(job.id),
    onError: (err) => {
      const raw = err instanceof Error ? err.message : "Failed to start export.";
      const isPremium =
        /ERROR_FEATURE_NOT_AVAILABLE/i.test(raw) ||
        /does not have access to these features/i.test(raw);
      if (isPremium && isPremiumOnly) {
        Alert.alert(
          "Premium feature",
          `${exportType === "excel" ? "Excel" : "JSON"} export requires a Baserow Premium license. CSV export is available on the free plan.`,
        );
      } else {
        Alert.alert("Could not start export", raw);
      }
    },
  });

  const job = jobQuery.data as BaserowJob | undefined;

  const handleDownload = () => {
    if (job?.url) {
      Linking.openURL(job.url);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: `Export: ${tableName}` }} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="download" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Export Table</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          Choose a format and we'll prepare a download for you.
        </Text>

        {!jobId ? (
          <View style={styles.options}>
            <Pressable
              onPress={() => setExportType("csv")}
              style={[
                styles.option,
                {
                  backgroundColor: exportType === "csv" ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: exportType === "csv" ? colors.primaryForeground : colors.foreground }}>CSV</Text>
            </Pressable>
            <Pressable
              onPress={() => setExportType("excel")}
              style={[
                styles.option,
                {
                  backgroundColor: exportType === "excel" ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: exportType === "excel" ? colors.primaryForeground : colors.foreground }}>
                Excel (XLSX)  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>· Premium</Text>
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setExportType("json")}
              style={[
                styles.option,
                {
                  backgroundColor: exportType === "json" ? colors.primary : colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: exportType === "json" ? colors.primaryForeground : colors.foreground }}>
                JSON  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>· Premium</Text>
              </Text>
            </Pressable>

            <Button
              title="Start Export"
              onPress={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              style={styles.startButton}
            />
          </View>
        ) : (
          <View style={styles.statusContainer}>
            {job?.state === "finished" ? (
              <View style={styles.finished}>
                <Feather name="check-circle" size={48} color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.foreground }]}>Export Ready!</Text>
                <Button title="Download File" onPress={handleDownload} style={styles.downloadButton} />
                <Button title="New Export" variant="ghost" onPress={() => setJobId(null)} />
              </View>
            ) : job?.state === "failed" ? (
              <View style={styles.failed}>
                <Feather name="x-circle" size={48} color={colors.destructive} />
                <Text style={[styles.statusText, { color: colors.foreground }]}>Export Failed</Text>
                <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
                  {job.human_readable_error || job.error || "Unknown error"}
                </Text>
                <Button title="Try Again" onPress={() => setJobId(null)} />
              </View>
            ) : (
              <View style={styles.progress}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.statusText, { color: colors.foreground }]}>
                  {job?.state === "pending"
                    ? "Queued..."
                    : `Processing... ${Math.round(job?.progress_percentage ?? job?.progress ?? 0)}%`}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    padding: 24,
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  options: {
    width: "100%",
    alignItems: "center",
  },
  option: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 12,
  },
  startButton: {
    width: "100%",
    marginTop: 20,
  },
  statusContainer: {
    alignItems: "center",
    width: "100%",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  progress: {
    alignItems: "center",
  },
  finished: {
    alignItems: "center",
    width: "100%",
  },
  downloadButton: {
    width: "100%",
    marginBottom: 12,
  },
  failed: {
    alignItems: "center",
    width: "100%",
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
});
