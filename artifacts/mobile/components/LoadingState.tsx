import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function LoadingState() {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
});
