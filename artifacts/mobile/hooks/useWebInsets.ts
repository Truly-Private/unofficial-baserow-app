import { Platform } from "react-native";

export function useWebInsets() {
  if (Platform.OS === "web") {
    return { top: 67, bottom: 34, left: 0, right: 0 };
  }
  return { top: 0, bottom: 0, left: 0, right: 0 };
}
