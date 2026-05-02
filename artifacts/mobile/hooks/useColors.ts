import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Falls back to the light palette when no dark key is defined in
 * constants/colors.ts.
 */
export function useColors() {
  const { isDark } = useTheme();

  const palette =
    isDark && "dark" in colors
      ? ((colors as unknown) as Record<string, typeof colors.light>).dark
      : colors.light;

  return { ...palette, radius: colors.radius };
}
