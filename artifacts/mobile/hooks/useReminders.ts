import * as Calendar from "expo-calendar";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useState } from "react";
import { Alert, Platform } from "react-native";

const MAP_KEY = "baserow_reminder_ids";

async function loadReminderMap(): Promise<Record<string, string>> {
  try {
    const raw = await SecureStore.getItemAsync(MAP_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

async function saveReminderMap(map: Record<string, string>): Promise<void> {
  try {
    await SecureStore.setItemAsync(MAP_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function useReminders(key: string | undefined) {
  const isSupported = Platform.OS === "ios";
  const [hasReminder, setHasReminder] = useState(false);

  useEffect(() => {
    if (!isSupported || !key) return;
    loadReminderMap().then((map) => setHasReminder(Boolean(map[key])));
  }, [key, isSupported]);

  const saveReminder = useCallback(
    async (title: string, dueDate: Date): Promise<void> => {
      if (!isSupported || !key) return;

      const { status } = await Calendar.requestRemindersPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Reminders Access Required",
          "Please allow Reminders access in your device Settings to use this feature.",
        );
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.REMINDER,
      );
      const remList =
        calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (!remList) {
        Alert.alert("No Reminders List", "Could not find a Reminders list.");
        return;
      }

      const map = await loadReminderMap();
      const existingId = map[key];

      if (existingId) {
        try {
          await Calendar.updateReminderAsync(existingId, {
            title,
            dueDate,
            completed: false,
          });
          setHasReminder(true);
          Alert.alert(
            "Reminder Updated",
            `"${title}" has been updated in Reminders.`,
          );
          return;
        } catch {
          // Reminder was deleted externally; fall through to create a new one
        }
      }

      const reminderId = await Calendar.createReminderAsync(remList.id, {
        title,
        dueDate,
        completed: false,
      });
      map[key] = reminderId;
      await saveReminderMap(map);
      setHasReminder(true);
      Alert.alert("Reminder Added", `"${title}" added to Reminders.`);
    },
    [key, isSupported],
  );

  return { isSupported, hasReminder, saveReminder };
}
