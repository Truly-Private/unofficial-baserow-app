import { Feather } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { createElement, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { FileFieldInput } from "@/components/FileFieldInput";
import { LinkRowFieldInput } from "@/components/LinkRowFieldInput";
import { useColors } from "@/hooks/useColors";
import { useRowReminder } from "@/hooks/useReminders";
import {
  dateToBaserowString,
  isEditable,
  parseBaserowDate,
  type BaserowField,
} from "@/lib/baserow";

type FieldInputProps = {
  field: BaserowField;
  value: unknown;
  onChange: (next: unknown) => void;
  reminderKey?: string;
  reminderTitle?: string;
  reminderNotes?: string;
};

export function FieldInput({ field, value, onChange, reminderKey, reminderTitle, reminderNotes }: FieldInputProps) {
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

  if (field.type === "multiple_select") {
    const options = field.select_options ?? [];
    const selectedIds = new Set<number>(
      Array.isArray(value)
        ? (value as unknown[])
            .map((v) => {
              if (typeof v === "number") return v;
              if (v && typeof v === "object" && "id" in (v as object))
                return (v as { id: number }).id;
              return null;
            })
            .filter((n): n is number => typeof n === "number")
        : [],
    );
    return (
      <View style={styles.group}>
        {labelRow}
        <View style={styles.selectRow}>
          {options.length === 0 ? (
            <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
              No options defined.
            </Text>
          ) : (
            options.map((opt) => {
              const active = selectedIds.has(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    const next = new Set(selectedIds);
                    if (active) next.delete(opt.id);
                    else next.add(opt.id);
                    onChange(Array.from(next).map((id) => ({ id })));
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
            })
          )}
        </View>
      </View>
    );
  }

  if (field.type === "date") {
    return (
      <View style={styles.group}>
        {labelRow}
        <DateField field={field} value={value} onChange={onChange} reminderKey={reminderKey} reminderTitle={reminderTitle} reminderNotes={reminderNotes} />
      </View>
    );
  }

  if (field.type === "link_row") {
    return (
      <View style={styles.group}>
        {labelRow}
        <LinkRowFieldInput
          field={field}
          value={value}
          onChange={(next) => onChange(next)}
        />
      </View>
    );
  }

  if (field.type === "file") {
    return (
      <View style={styles.group}>
        {labelRow}
        <FileFieldInput
          field={field}
          value={value}
          onChange={(next) => onChange(next)}
        />
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
        placeholder={`Enter ${field.name.toLowerCase()}`}
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

type DateFieldProps = {
  field: BaserowField;
  value: unknown;
  onChange: (next: unknown) => void;
  reminderKey?: string;
  reminderTitle?: string;
  reminderNotes?: string;
};

function DateField({ field, value, onChange, reminderKey, reminderTitle, reminderNotes }: DateFieldProps) {
  const colors = useColors();
  const includeTime = Boolean(field.date_include_time);
  const current = parseBaserowDate(value);

  if (Platform.OS === "web") {
    return (
      <WebDateInput
        includeTime={includeTime}
        date={current}
        onChange={(d) => onChange(d ? dateToBaserowString(d, includeTime) : null)}
      />
    );
  }

  return (
    <NativeDateInput
      includeTime={includeTime}
      date={current}
      onChange={(d) => onChange(d ? dateToBaserowString(d, includeTime) : null)}
      reminderKey={reminderKey}
      fieldName={field.name}
      reminderTitle={reminderTitle}
      reminderNotes={reminderNotes}
    />
  );
}

function ReminderButton({
  fieldName,
  date,
  reminderKey,
  reminderTitle,
  reminderNotes,
}: {
  fieldName: string;
  date: Date;
  reminderKey: string;
  reminderTitle?: string;
  reminderNotes?: string;
}) {
  const colors = useColors();
  const { hasReminder, saveReminder } = useRowReminder(reminderKey);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        const title =
          reminderTitle && reminderTitle.trim().length > 0
            ? reminderTitle
            : fieldName;
        const notes =
          reminderNotes && reminderNotes.trim().length > 0
            ? `${fieldName}\n\n${reminderNotes}`
            : fieldName;
        saveReminder(title, date, notes).catch(() => {});
      }}
      hitSlop={8}
      style={[
        styles.clearBtn,
        {
          backgroundColor: hasReminder ? colors.primary : colors.muted,
          borderColor: hasReminder ? colors.primary : colors.border,
          borderRadius: colors.radius,
        },
      ]}
      testID="reminder-btn"
    >
      <Feather
        name="bell"
        size={16}
        color={hasReminder ? colors.primaryForeground : colors.mutedForeground}
      />
    </Pressable>
  );
}

function NativeDateInput({
  includeTime,
  date,
  onChange,
  reminderKey,
  fieldName,
  reminderTitle,
  reminderNotes,
}: {
  includeTime: boolean;
  date: Date | null;
  onChange: (d: Date | null) => void;
  reminderKey?: string;
  fieldName?: string;
  reminderTitle?: string;
  reminderNotes?: string;
}) {
  const colors = useColors();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const display = formatDateDisplay(date, includeTime);

  function handleDateEvent(event: DateTimePickerEvent, picked?: Date) {
    if (Platform.OS === "android") setShowDate(false);
    if (event.type === "dismissed") return;
    if (!picked) return;
    if (includeTime) {
      // On iOS the spinner returns date+time together if mode='datetime'.
      // We open a separate time picker on Android after the date picker.
      if (Platform.OS === "android") {
        setPendingDate(picked);
        setShowTime(true);
      } else {
        onChange(picked);
      }
    } else {
      onChange(picked);
    }
  }

  function handleTimeEvent(event: DateTimePickerEvent, picked?: Date) {
    setShowTime(false);
    if (event.type === "dismissed") return;
    if (!picked) return;
    const base = pendingDate ?? date ?? new Date();
    const combined = new Date(base);
    combined.setHours(picked.getHours());
    combined.setMinutes(picked.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    onChange(combined);
    setPendingDate(null);
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.dateRow}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setShowDate(true);
          }}
          style={[
            styles.dateBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="calendar" size={16} color={colors.foreground} />
          <Text style={[styles.dateBtnText, { color: colors.foreground }]}>
            {display || "Pick a date"}
          </Text>
        </Pressable>
        {date ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            style={[
              styles.clearBtn,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        ) : null}
        {date && reminderKey && fieldName && Platform.OS === "ios" ? (
          <ReminderButton
            fieldName={fieldName}
            date={date}
            reminderKey={reminderKey}
            reminderTitle={reminderTitle}
            reminderNotes={reminderNotes}
          />
        ) : null}
      </View>

      {showDate ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowDate(false)}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setShowDate(false)}
          >
            <Pressable
              onPress={() => {}}
              style={[
                styles.modalCard,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <DateTimePicker
                value={date ?? new Date()}
                mode={includeTime && Platform.OS === "ios" ? "datetime" : "date"}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={handleDateEvent}
                themeVariant="light"
              />
              {Platform.OS === "ios" ? (
                <Pressable
                  onPress={() => setShowDate(false)}
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                >
                  <Text
                    style={[
                      styles.doneBtnText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}

      {showTime ? (
        <DateTimePicker
          value={pendingDate ?? date ?? new Date()}
          mode="time"
          is24Hour={false}
          onChange={handleTimeEvent}
        />
      ) : null}
    </View>
  );
}

function WebDateInput({
  includeTime,
  date,
  onChange,
}: {
  includeTime: boolean;
  date: Date | null;
  onChange: (d: Date | null) => void;
}) {
  const colors = useColors();
  const inputType = includeTime ? "datetime-local" : "date";
  const formatted = date ? toLocalInputValue(date, includeTime) : "";

  return (
    <View style={styles.dateRow}>
      <View
        style={[
          styles.dateBtn,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: colors.radius,
            paddingVertical: 0,
            paddingHorizontal: 0,
          },
        ]}
      >
        {/* Use native HTML input on web for the proper picker. */}
        {createElement("input", {
          type: inputType,
          value: formatted,
          onChange: (e: { target: { value: string } }) => {
            const v = e.target.value;
            if (!v) {
              onChange(null);
              return;
            }
            const parsed = new Date(v);
            if (Number.isNaN(parsed.getTime())) onChange(null);
            else onChange(parsed);
          },
          style: {
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            color: colors.foreground,
            fontFamily: "Inter_400Regular, sans-serif",
            fontSize: 16,
            padding: "14px",
          },
        })}
      </View>
      {date ? (
        <Pressable
          onPress={() => onChange(null)}
          hitSlop={8}
          style={[
            styles.clearBtn,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toLocalInputValue(d: Date, includeTime: boolean): string {
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  if (!includeTime) return date;
  return `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateDisplay(date: Date | null, includeTime: boolean): string {
  if (!date) return "";
  if (includeTime) {
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
  dateRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
  },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  dateBtnText: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    flex: 1,
  },
  clearBtn: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  doneBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  doneBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
