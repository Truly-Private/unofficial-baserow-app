import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

export default function IndexRoute() {
  const colors = useColors();
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <View style={[styles.fill, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === "signedIn") {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
