import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
  type ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";

type ButtonProps = {
  title: string;
  onPress?: (e: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
  icon?: string;
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
  testID,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = (e: GestureResponderEvent) => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.(e);
  };

  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: "transparent" },
    secondary: {
      bg: colors.secondary,
      fg: colors.secondaryForeground,
      border: colors.border,
    },
    ghost: { bg: "transparent", fg: colors.primary, border: "transparent" },
    destructive: {
      bg: colors.destructive,
      fg: colors.destructiveForeground,
      border: "transparent",
    },
    outline: {
      bg: "transparent",
      fg: colors.foreground,
      border: colors.border,
    },
  }[variant]!;

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: colors.radius,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <Text style={[styles.text, { color: palette.fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    minHeight: 50,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
