import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ViewType } from "../types/models";

type Props = {
  value: ViewType;
  onChange: (v: ViewType) => void;
};

const VIEW_TYPES: ViewType[] = ["grid", "gallery", "form", "kanban"];

export const ViewSwitcher: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      {VIEW_TYPES.map((t) => (
        <TouchableOpacity
          key={t}
          style={[styles.btn, value === t && styles.active]}
          onPress={() => onChange(t)}
        >
          <Text style={styles.label}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: "#fff",
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  active: {
    backgroundColor: "#4c9aff",
  },
  label: {
    fontSize: 12,
    color: "#333",
  },
});

export default ViewSwitcher;
