import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { useColors } from "@/hooks/useColors";
import { type BaserowField, type BaserowRow } from "@/lib/baserow";

interface FormViewProps {
  fields: BaserowField[];
  onSubmit?: (data: Partial<BaserowRow>) => void;
  onCancel?: () => void;
  initialValues?: Partial<BaserowRow>;
  submitLabel?: string;
}

export function FormView({
  fields,
  onSubmit,
  onCancel,
  initialValues = {},
  submitLabel = "Submit",
}: FormViewProps) {
  const colors = useColors();
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of fields) {
      initial[`field_${field.id}`] =
        initialValues[`field_${field.id}`] ?? null;
    }
    return initial;
  });

  const handleSubmit = () => {
    onSubmit?.(formData as Partial<BaserowRow>);
  };

  // Filter out read-only fields
  const editableFields = fields.filter(
    (f) =>
      f.type !== "formula" &&
      f.type !== "rollup" &&
      f.type !== "count" &&
      f.type !== "lookup" &&
      f.type !== "auto_number" &&
      f.type !== "created_on" &&
      f.type !== "last_modified"
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            New Entry
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            Fill in the details below
          </Text>
        </View>

        {/* Fields */}
        <View style={styles.fields}>
          {editableFields.map((field) => (
            <View
              key={field.id}
              style={[styles.fieldContainer, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {field.name}
              </Text>

              {/* Render appropriate input based on field type */}
              <View style={styles.inputWrapper}>
                {renderFieldInput(field, formData, setFormData, colors)}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Actions */}
      <View
        style={[
          styles.actions,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: 24,
          },
        ]}
      >
        {onCancel && (
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onCancel}
            style={styles.actionBtn}
          />
        )}
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          style={styles.actionBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function renderFieldInput(
  field: BaserowField,
  formData: Record<string, unknown>,
  setFormData: (data: Record<string, unknown>) => void,
  colors: { muted: string; foreground: string; border: string; card: string }
) {
  const value = formData[`field_${field.id}`];
  const key = `field_${field.id}`;

  switch (field.type) {
    case "text":
    case "long_text":
    case "email":
    case "url":
    case "phone_number":
      return (
        <View
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.muted }}>
            {String(value ?? "") || `Enter ${field.name.toLowerCase()}...`}
          </Text>
        </View>
      );

    case "number":
    case "rating":
      return (
        <View
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.muted }}>
            {value !== null && value !== undefined ? String(value) : "0"}
          </Text>
        </View>
      );

    case "boolean":
      return (
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: value ? colors.card : "transparent",
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.foreground }}>
            {value ? "✓ Yes" : "○ No"}
          </Text>
        </View>
      );

    case "date":
      return (
        <View
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.muted }}>
            {value ? String(value) : "Select date..."}
          </Text>
        </View>
      );

    case "single_select":
      const options = field.select_options ?? [];
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {options.map((opt) => {
            const isSelected =
              typeof value === "object" &&
              value !== null &&
              "id" in value &&
              (value as { id: number }).id === opt.id;
            return (
              <View
                key={opt.id}
                style={[
                  styles.selectChip,
                  {
                    backgroundColor: isSelected ? opt.color || colors.card : "transparent",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground }}>{opt.value}</Text>
              </View>
            );
          })}
        </ScrollView>
      );

    case "multiple_select":
      const multiOptions = field.select_options ?? [];
      const selectedIds = Array.isArray(value)
        ? value.map((v) => (typeof v === "object" && "id" in v ? (v as { id: number }).id : v))
        : [];
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {multiOptions.map((opt) => {
            const isSelected = selectedIds.includes(opt.id);
            return (
              <View
                key={opt.id}
                style={[
                  styles.selectChip,
                  {
                    backgroundColor: isSelected ? opt.color || colors.card : "transparent",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text style={{ color: colors.foreground }}>{opt.value}</Text>
              </View>
            );
          })}
        </ScrollView>
      );

    default:
      return (
        <View
          style={[
            styles.textInput,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={{ color: colors.muted }}>
            {value !== null && value !== undefined
              ? JSON.stringify(value)
              : "Tap to edit..."}
          </Text>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  fields: {
    gap: 0,
  },
  fieldContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputWrapper: {},
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  checkbox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
  },
});
