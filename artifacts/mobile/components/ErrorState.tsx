import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather
          name="alert-triangle"
          size={28}
          color={colors.destructive}
        />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.mutedForeground }]}>
          {message}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          title="Try again"
          variant="secondary"
          onPress={onRetry}
          style={{ marginTop: 8, minWidth: 140 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    textAlign: "center",
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 320,
  },
});
