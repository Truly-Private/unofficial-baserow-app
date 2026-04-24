import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { uploadUserFile, type BaserowFile } from "@/lib/baserow";

type FileFieldInputProps = {
  field: { name: string };
  value: unknown;
  onChange: (next: BaserowFile[]) => void;
};

function asFiles(value: unknown): BaserowFile[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is BaserowFile =>
      !!v && typeof v === "object" && typeof (v as BaserowFile).name === "string",
  );
}

function formatBytes(n?: number): string {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function FileFieldInput({ value, onChange }: FileFieldInputProps) {
  const colors = useColors();
  const { apiCall } = useAuth();
  const [busy, setBusy] = useState(false);
  const files = useMemo(() => asFiles(value), [value]);

  async function uploadOne(input: { uri: string; name: string; type?: string }) {
    setBusy(true);
    try {
      const uploaded = await apiCall((c) => uploadUserFile(c, input));
      onChange([...files, uploaded]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      Alert.alert(
        "Upload failed",
        err instanceof Error ? err.message : "Could not upload the file.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function pickFromLibrary() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to attach images.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadOne({
      uri: asset.uri,
      name: asset.fileName ?? guessNameFromUri(asset.uri, asset.mimeType),
      type: asset.mimeType ?? undefined,
    });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow camera access to take a photo.",
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadOne({
      uri: asset.uri,
      name: asset.fileName ?? guessNameFromUri(asset.uri, asset.mimeType, "jpg"),
      type: asset.mimeType ?? "image/jpeg",
    });
  }

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadOne({
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType ?? undefined,
    });
  }

  function removeAt(index: number) {
    Haptics.selectionAsync().catch(() => {});
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <View>
      {files.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          No files attached
        </Text>
      ) : (
        <View style={styles.fileList}>
          {files.map((f, i) => (
            <View
              key={`${f.name}-${i}`}
              style={[
                styles.fileRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather
                name={f.is_image ? "image" : "file"}
                size={18}
                color={colors.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.fileName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {f.visible_name || f.name}
                </Text>
                {f.size ? (
                  <Text
                    style={[styles.fileMeta, { color: colors.mutedForeground }]}
                  >
                    {formatBytes(f.size)}
                  </Text>
                ) : null}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => removeAt(i)}
                style={styles.removeBtn}
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        {Platform.OS !== "web" ? (
          <ActionButton
            icon="camera"
            label="Camera"
            onPress={takePhoto}
            disabled={busy}
          />
        ) : null}
        <ActionButton
          icon="image"
          label="Photo"
          onPress={pickFromLibrary}
          disabled={busy}
        />
        <ActionButton
          icon="paperclip"
          label="File"
          onPress={pickDocument}
          disabled={busy}
        />
      </View>

      {busy ? (
        <View style={styles.busyRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.busyText, { color: colors.mutedForeground }]}>
            Uploading…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={disabled}
      style={[
        styles.actionBtn,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Feather name={icon} size={16} color={colors.foreground} />
      <Text style={[styles.actionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function guessNameFromUri(uri: string, mime?: string | null, fallbackExt?: string): string {
  try {
    const part = uri.split("/").pop()?.split("?")[0];
    if (part && part.includes(".")) return part;
  } catch {
    /* ignore */
  }
  let ext = fallbackExt ?? "bin";
  if (mime) {
    const slash = mime.split("/");
    if (slash.length === 2) ext = slash[1];
  }
  return `upload-${Date.now()}.${ext}`;
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 10,
  },
  fileList: {
    gap: 8,
    marginBottom: 10,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  fileName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  fileMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: 2,
  },
  removeBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minWidth: 92,
  },
  actionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  busyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  busyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
});
