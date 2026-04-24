import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { isEditable, type BaserowField } from "@/lib/baserow";

type FieldInputProps = {
  field: BaserowField;
  value: unknown;
  onChange: (next: unknown) => void;
};

export function FieldInput({ field, value, onChange }: FieldInputProps) {
  const colors = useColors();
  const editable = isEditable(field);

  const labelRow = (
    <View style={styles.labelRow}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {field.name}
        {field.primary ? "  •  Primary" : ""}
      </Text>
      {!editable ? (
        <View
          style={[
            styles.readOnlyBadge,
            { backgroundColor: colors.muted, borderColor: colors.border },
          ]}
        >
          <Feather name="lock" size={10} color={colors.mutedForeground} />
          <Text
            style={[styles.readOnlyText, { color: colors.mutedForeground }]}
          >
            Read-only
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!editable) {
    const display = value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
    return (
      <View style={styles.group}>
        {labelRow}
        <View
          style={[
            styles.readOnlyValue,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text
            style={[styles.readOnlyValueText, { color: colors.mutedForeground }]}
            numberOfLines={6}
          >
            {display}
          </Text>
        </View>
      </View>
    );
  }

  if (field.type === "boolean") {
    return (
      <View style={styles.group}>
        {labelRow}
        <View
          style={[
            styles.switchRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.switchLabel, { color: colors.foreground }]}>
            {value ? "Yes" : "No"}
          </Text>
          <Switch
            value={Boolean(value)}
            onValueChange={(next) => {
              Haptics.selectionAsync().catch(() => {});
              onChange(next);
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>
    );
  }

  if (field.type === "rating") {
    const n = Number(value) || 0;
    return (
      <View style={styles.group}>
        {labelRow}
        <View style={styles.starRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const idx = i + 1;
            return (
              <Pressable
                key={i}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(idx === n ? 0 : idx);
                }}
                hitSlop={6}
              >
                <Feather
                  name="star"
                  size={32}
                  color={idx <= n ? colors.accent : colors.border}
                />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (field.type === "single_select") {
    const options = field.select_options ?? [];
    const currentId =
      value && typeof value === "object" && "id" in (value as object)
        ? (value as { id: number }).id
        : typeof value === "number"
          ? value
          : null;
    return (
      <View style={styles.group}>
        {labelRow}
        <View style={styles.selectRow}>
          <Pressable
            onPress={() => {
              if (currentId !== null) {
                Haptics.selectionAsync().catch(() => {});
                onChange(null);
              }
            }}
            style={[
              styles.selectChip,
              {
                backgroundColor: currentId === null ? colors.primary : colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.selectChipText,
                {
                  color:
                    currentId === null
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              None
            </Text>
          </Pressable>
          {options.map((opt) => {
            const active = currentId === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onChange(opt.id);
                }}
                style={[
                  styles.selectChip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.selectChipText,
                    {
                      color: active
                        ? colors.primaryForeground
                        : colors.foreground,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {opt.value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const isLong = field.type === "long_text";
  const keyboardType =
    field.type === "number"
      ? "decimal-pad"
      : field.type === "email"
        ? "email-address"
        : field.type === "phone_number"
          ? "phone-pad"
          : field.type === "url"
            ? "url"
            : "default";
  const autoCap =
    field.type === "email" || field.type === "url" ? "none" : "sentences";

  const stringValue =
    value === null || value === undefined ? "" : String(value);

  return (
    <View style={styles.group}>
      {labelRow}
      <TextInput
        value={stringValue}
        onChangeText={onChange}
        placeholder={
          field.type === "date" ? "YYYY-MM-DD" : `Enter ${field.name.toLowerCase()}`
        }
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize={autoCap}
        multiline={isLong}
        numberOfLines={isLong ? 5 : 1}
        style={[
          styles.input,
          isLong && styles.inputMulti,
          {
            backgroundColor: colors.surface,
            color: colors.foreground,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  readOnlyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
  },
  readOnlyValue: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: "center",
  },
  readOnlyValueText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  inputMulti: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 56,
  },
  switchLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
  },
  selectRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  selectChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
});
