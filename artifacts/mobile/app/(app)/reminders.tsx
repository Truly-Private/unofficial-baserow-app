import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { useColors } from "@/hooks/useColors";
import {
  useReminders,
  type ReminderItem,
  type ReminderList,
} from "@/hooks/useReminders";
import { useWebInsets } from "@/hooks/useWebInsets";

type ActiveTab = "open" | "done";

function formatDue(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

  const diff = d.getTime() - today.getTime();
  const days = Math.round(diff / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days < 7) return `${days}d`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function dueColor(date: Date | null, colors: ReturnType<typeof useColors>): string {
  if (!date) return colors.mutedForeground;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return "#ef4444";
  const tomorrow = new Date(today.getTime() + 86400000);
  if (date <= tomorrow) return "#f59e0b";
  return colors.mutedForeground;
}

// ─── Reminder row ─────────────────────────────────────────────────────────────

function ReminderRow({
  item,
  listTitle,
  colors,
  onComplete,
  onUncomplete,
  onDelete,
}: {
  item: ReminderItem;
  listTitle: string | undefined;
  colors: ReturnType<typeof useColors>;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const dueFmt = formatDue(item.dueDate);
  const dueClr = dueColor(item.dueDate, colors);

  return (
    <View
      style={[
        s.reminderRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: item.completed ? 0.6 : 1,
        },
      ]}
      testID={`reminder-row-${item.id}`}
    >
      <Pressable
        onPress={() =>
          item.completed ? onUncomplete(item.id) : onComplete(item.id)
        }
        hitSlop={8}
        style={[
          s.checkBtn,
          {
            borderColor: item.completed ? colors.primary : colors.border,
            backgroundColor: item.completed ? colors.primary : "transparent",
          },
        ]}
        accessibilityLabel={
          item.completed ? "Mark incomplete" : "Mark complete"
        }
        testID={`reminder-check-${item.id}`}
      >
        {item.completed && (
          <Feather name="check" size={12} color={colors.primaryForeground} />
        )}
      </Pressable>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            s.reminderTitle,
            {
              color: colors.foreground,
              textDecorationLine: item.completed ? "line-through" : "none",
            },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {item.notes ? (
          <Text
            style={[s.reminderNotes, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {item.notes}
          </Text>
        ) : null}
        <View style={s.reminderMeta}>
          {listTitle ? (
            <View
              style={[
                s.listBadge,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Feather name="list" size={10} color={colors.mutedForeground} />
              <Text style={[s.listBadgeText, { color: colors.mutedForeground }]}>
                {listTitle}
              </Text>
            </View>
          ) : null}
          {dueFmt ? (
            <Text style={[s.dueText, { color: dueClr }]}>{dueFmt}</Text>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={() =>
          Alert.alert("Delete reminder?", `"${item.title}" will be removed.`, [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: () => onDelete(item.id),
            },
          ])
        }
        hitSlop={8}
        style={({ pressed }) => [s.deleteBtn, { opacity: pressed ? 0.5 : 1 }]}
        accessibilityLabel="Delete reminder"
        testID={`reminder-delete-${item.id}`}
      >
        <Feather name="trash-2" size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

// ─── Create reminder modal ────────────────────────────────────────────────────

function CreateReminderModal({
  visible,
  lists,
  onClose,
  onCreate,
  colors,
}: {
  visible: boolean;
  lists: ReminderList[];
  onClose: () => void;
  onCreate: (
    calendarId: string,
    title: string,
    notes: string,
    dueDate: Date | null,
  ) => Promise<void>;
  colors: ReturnType<typeof useColors>;
}) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedListId, setSelectedListId] = useState<string>("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0]!.id);
    }
  }, [visible, lists, selectedListId]);

  useEffect(() => {
    if (!visible) {
      setTitle("");
      setNotes("");
      setDueDate(null);
      setShowDatePicker(false);
      setSaving(false);
    }
  }, [visible]);

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Title required", "Please enter a title for the reminder.");
      return;
    }
    if (!selectedListId) {
      Alert.alert("List required", "Please select a reminder list.");
      return;
    }
    setSaving(true);
    try {
      await onCreate(selectedListId, trimmed, notes.trim(), dueDate);
      onClose();
    } catch (e) {
      Alert.alert(
        "Could not create reminder",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        style={[s.backdrop, { backgroundColor: "rgba(15,23,42,0.45)" }]}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={[
            s.modalCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius + 8,
            },
          ]}
        >
          <View style={s.modalHeader}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>
              New Reminder
            </Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={[s.divider, { backgroundColor: colors.border }]} />

          <Text style={[s.fieldLabel, { color: colors.foreground }]}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Reminder title"
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            autoCapitalize="sentences"
            style={[
              s.textInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.primary,
                borderRadius: colors.radius,
              },
            ]}
            testID="reminder-title-input"
          />

          <Text style={[s.fieldLabel, { color: colors.foreground }]}>
            Notes (optional)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            numberOfLines={3}
            style={[
              s.textInput,
              s.notesInput,
              {
                backgroundColor: colors.background,
                color: colors.foreground,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
            testID="reminder-notes-input"
          />

          <Text style={[s.fieldLabel, { color: colors.foreground }]}>List</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          >
            {lists.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => setSelectedListId(l.id)}
                style={[
                  s.listChip,
                  {
                    backgroundColor:
                      l.id === selectedListId ? colors.primary : colors.muted,
                    borderColor:
                      l.id === selectedListId ? colors.primary : colors.border,
                    borderRadius: 20,
                  },
                ]}
                testID={`list-chip-${l.id}`}
              >
                <View
                  style={[
                    s.listDot,
                    { backgroundColor: l.id === selectedListId ? colors.primaryForeground : l.color },
                  ]}
                />
                <Text
                  style={[
                    s.listChipText,
                    {
                      color:
                        l.id === selectedListId
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {l.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[s.fieldLabel, { color: colors.foreground }]}>
            Due date (optional)
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
            <Pressable
              onPress={() => setShowDatePicker(!showDatePicker)}
              style={[
                s.dueDateBtn,
                {
                  backgroundColor: colors.background,
                  borderColor: dueDate ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                  flex: 1,
                },
              ]}
              testID="reminder-due-btn"
            >
              <Feather
                name="calendar"
                size={16}
                color={dueDate ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  s.dueDateText,
                  { color: dueDate ? colors.foreground : colors.mutedForeground },
                ]}
              >
                {dueDate
                  ? dueDate.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "No due date"}
              </Text>
            </Pressable>
            {dueDate ? (
              <Pressable
                onPress={() => {
                  setDueDate(null);
                  setShowDatePicker(false);
                }}
                style={[
                  s.dueClearBtn,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
                testID="reminder-clear-due"
              >
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dueDate ?? new Date()}
              mode="date"
              display="spinner"
              minimumDate={new Date()}
              onChange={(_event, date) => {
                if (date) setDueDate(date);
                if (Platform.OS !== "ios") setShowDatePicker(false);
              }}
              testID="reminder-date-picker"
            />
          )}

          <Button
            title={saving ? "Creating…" : "Create Reminder"}
            onPress={() => void handleCreate()}
            disabled={saving || !title.trim()}
            testID="reminder-create-btn"
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RemindersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const {
    isSupported,
    permState,
    requestPermission,
    lists,
    reminders,
    fetching,
    error,
    refreshLists,
    refreshReminders,
    createReminder,
    completeReminder,
    uncompleteReminder,
    deleteReminder,
  } = useReminders();

  const [activeTab, setActiveTab] = useState<ActiveTab>("open");
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const activeLists = selectedListId
    ? lists.filter((l) => l.id === selectedListId)
    : lists;
  const activeListIds = activeLists.map((l) => l.id);

  const openReminders = reminders.filter(
    (r) =>
      !r.completed &&
      (selectedListId === null || r.calendarId === selectedListId),
  );
  const doneReminders = reminders.filter(
    (r) =>
      r.completed &&
      (selectedListId === null || r.calendarId === selectedListId),
  );

  const handleRefresh = useCallback(async () => {
    const refreshed = await refreshLists();
    const ids = (selectedListId
      ? refreshed.filter((l) => l.id === selectedListId)
      : refreshed
    ).map((l) => l.id);
    await refreshReminders(ids);
  }, [refreshLists, refreshReminders, selectedListId]);

  useEffect(() => {
    if (permState === "granted" && lists.length > 0) {
      void refreshReminders(activeListIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, selectedListId, permState]);

  const handleComplete = useCallback(
    async (id: string) => {
      try {
        await completeReminder(id);
        await refreshReminders(activeListIds);
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not update reminder.");
      }
    },
    [completeReminder, refreshReminders, activeListIds],
  );

  const handleUncomplete = useCallback(
    async (id: string) => {
      try {
        await uncompleteReminder(id);
        await refreshReminders(activeListIds);
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not update reminder.");
      }
    },
    [uncompleteReminder, refreshReminders, activeListIds],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteReminder(id);
        await refreshReminders(activeListIds);
      } catch (e) {
        Alert.alert("Error", e instanceof Error ? e.message : "Could not delete reminder.");
      }
    },
    [deleteReminder, refreshReminders, activeListIds],
  );

  const handleCreate = useCallback(
    async (
      calendarId: string,
      title: string,
      notes: string,
      dueDate: Date | null,
    ) => {
      await createReminder(
        calendarId,
        title,
        notes || undefined,
        dueDate ?? undefined,
      );
      await refreshReminders(activeListIds);
    },
    [createReminder, refreshReminders, activeListIds],
  );

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16) + 16;

  const listTitleFor = (calendarId: string) =>
    lists.find((l) => l.id === calendarId)?.title;

  const shownItems = activeTab === "open" ? openReminders : doneReminders;

  // ── Unsupported platform ──────────────────────────────────────────────────
  if (!isSupported) {
    return (
      <>
        <Stack.Screen options={{ title: "Reminders" }} />
        <View style={[s.fill, { backgroundColor: colors.background }]}>
          <EmptyState
            icon="bell-off"
            title="Not available"
            description="The Reminders skill is only available on iOS and macOS devices."
          />
        </View>
      </>
    );
  }

  // ── Permission request ────────────────────────────────────────────────────
  if (permState === "loading") {
    return (
      <>
        <Stack.Screen options={{ title: "Reminders" }} />
        <View style={[s.fill, { backgroundColor: colors.background }]}>
          <LoadingState />
        </View>
      </>
    );
  }

  if (permState !== "granted") {
    return (
      <>
        <Stack.Screen options={{ title: "Reminders" }} />
        <View style={[s.fill, s.center, { backgroundColor: colors.background }]}>
          <View
            style={[
              s.permCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius + 8,
              },
            ]}
          >
            <View
              style={[
                s.permIcon,
                { backgroundColor: colors.secondary, borderRadius: colors.radius + 4 },
              ]}
            >
              <Feather name="bell" size={32} color={colors.primary} />
            </View>
            <Text style={[s.permTitle, { color: colors.foreground }]}>
              Reminders Access
            </Text>
            <Text style={[s.permDesc, { color: colors.mutedForeground }]}>
              Allow this app to read and create reminders in your Apple Reminders app.
            </Text>
            {permState === "unavailable" ? (
              <Text style={[s.permDenied, { color: colors.mutedForeground }]}>
                Reminders are not available on this device.
              </Text>
            ) : (
              <Button
                title="Grant Access"
                onPress={() => void requestPermission()}
                style={{ marginTop: 8 }}
                testID="grant-reminders-btn"
              />
            )}
          </View>
        </View>
      </>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  return (
    <>
      <Stack.Screen
        options={{
          title: "Reminders",
          headerRight: () => (
            <Pressable
              onPress={() => setCreateOpen(true)}
              hitSlop={10}
              style={({ pressed }) => [
                s.addBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              testID="add-reminder-btn"
            >
              <Feather name="plus" size={16} color={colors.primaryForeground} />
            </Pressable>
          ),
        }}
      />

      <View style={[s.fill, { backgroundColor: colors.background }]}>
        {/* List selector chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[s.chipScroll, { borderBottomColor: colors.border }]}
          contentContainerStyle={s.chipRow}
        >
          <Pressable
            onPress={() => setSelectedListId(null)}
            style={[
              s.chip,
              {
                backgroundColor:
                  selectedListId === null ? colors.primary : colors.muted,
                borderColor:
                  selectedListId === null ? colors.primary : colors.border,
                borderRadius: 20,
              },
            ]}
            testID="chip-all"
          >
            <Text
              style={[
                s.chipText,
                {
                  color:
                    selectedListId === null
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                },
              ]}
            >
              All
            </Text>
          </Pressable>
          {lists.map((l) => (
            <Pressable
              key={l.id}
              onPress={() =>
                setSelectedListId(l.id === selectedListId ? null : l.id)
              }
              style={[
                s.chip,
                {
                  backgroundColor:
                    l.id === selectedListId ? colors.primary : colors.muted,
                  borderColor:
                    l.id === selectedListId ? colors.primary : colors.border,
                  borderRadius: 20,
                },
              ]}
              testID={`chip-list-${l.id}`}
            >
              <View
                style={[
                  s.chipDot,
                  {
                    backgroundColor:
                      l.id === selectedListId ? colors.primaryForeground : l.color,
                  },
                ]}
              />
              <Text
                style={[
                  s.chipText,
                  {
                    color:
                      l.id === selectedListId
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {l.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Open / Done tabs */}
        <View
          style={[
            s.tabBar,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={() => setActiveTab("open")}
            style={[
              s.tab,
              activeTab === "open" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            testID="tab-open"
          >
            <Feather
              name="circle"
              size={15}
              color={activeTab === "open" ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                s.tabText,
                {
                  color:
                    activeTab === "open" ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              Open
              {openReminders.length > 0
                ? ` (${openReminders.length})`
                : ""}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("done")}
            style={[
              s.tab,
              activeTab === "done" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            testID="tab-done"
          >
            <Feather
              name="check-circle"
              size={15}
              color={
                activeTab === "done" ? colors.primary : colors.mutedForeground
              }
            />
            <Text
              style={[
                s.tabText,
                {
                  color:
                    activeTab === "done"
                      ? colors.primary
                      : colors.mutedForeground,
                },
              ]}
            >
              Done
            </Text>
          </Pressable>
        </View>

        {/* Reminder list */}
        {error ? (
          <ErrorState message={error} onRetry={() => void handleRefresh()} />
        ) : fetching && reminders.length === 0 ? (
          <LoadingState />
        ) : (
          <ScrollView
            contentContainerStyle={[
              s.listContent,
              { paddingBottom: bottomPad },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={fetching}
                onRefresh={() => void handleRefresh()}
                tintColor={colors.primary}
              />
            }
            testID="reminders-scroll"
          >
            {shownItems.length === 0 ? (
              <EmptyState
                icon={activeTab === "open" ? "check-circle" : "inbox"}
                title={
                  activeTab === "open"
                    ? "No open reminders"
                    : "No completed reminders"
                }
                description={
                  activeTab === "open"
                    ? "Tap + to create a reminder, or pull down to refresh."
                    : "Completed reminders from the last 30 days appear here."
                }
              />
            ) : (
              <View style={s.reminderList}>
                {shownItems.map((item) => (
                  <ReminderRow
                    key={item.id}
                    item={item}
                    listTitle={listTitleFor(item.calendarId)}
                    colors={colors}
                    onComplete={(id) => void handleComplete(id)}
                    onUncomplete={(id) => void handleUncomplete(id)}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </View>
            )}

            {activeTab === "open" && openReminders.length > 0 && (
              <Text style={[s.hint, { color: colors.mutedForeground }]}>
                Note: reminders without a due date may not appear here due to
                system limitations.
              </Text>
            )}
          </ScrollView>
        )}
      </View>

      <CreateReminderModal
        visible={createOpen}
        lists={lists}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        colors={colors}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fill: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center", padding: 24 },
  addBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chipScroll: {
    borderBottomWidth: 1,
    maxHeight: 54,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    gap: 6,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  reminderList: {
    gap: 8,
  },
  reminderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  checkBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  reminderTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 21,
  },
  reminderNotes: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  reminderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    flexWrap: "wrap",
  },
  listBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  listBadgeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  dueText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  permCard: {
    width: "100%",
    maxWidth: 360,
    padding: 28,
    borderWidth: 1,
    alignItems: "center",
    gap: 12,
  },
  permIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  permTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    textAlign: "center",
  },
  permDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  permDenied: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 640,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
  },
  divider: {
    height: 1,
    marginTop: 14,
    marginBottom: 18,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    minHeight: 52,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  listChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  dueDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
  },
  dueDateText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    flex: 1,
  },
  dueClearBtn: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
});
