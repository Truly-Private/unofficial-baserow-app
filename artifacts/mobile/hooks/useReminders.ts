import * as Calendar from "expo-calendar";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

export type ReminderList = {
  id: string;
  title: string;
  color: string;
};

export type ReminderItem = {
  id: string;
  title: string;
  notes: string | null;
  completed: boolean;
  dueDate: Date | null;
  calendarId: string;
};

export type PermissionState = "loading" | "granted" | "denied" | "unavailable";

export function useReminders() {
  const isSupported = Platform.OS === "ios" || (Platform.OS as string) === "macos";
  const [permState, setPermState] = useState<PermissionState>("loading");
  const [lists, setLists] = useState<ReminderList[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupported) {
      setPermState("unavailable");
      return;
    }
    Calendar.getRemindersPermissionsAsync()
      .then((s) => setPermState(s.granted ? "granted" : "denied"))
      .catch(() => setPermState("unavailable"));
  }, [isSupported]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    const r = await Calendar.requestRemindersPermissionsAsync().catch(() => null);
    const granted = r?.granted ?? false;
    setPermState(granted ? "granted" : "denied");
    return granted;
  }, [isSupported]);

  const refreshLists = useCallback(async (): Promise<ReminderList[]> => {
    if (!isSupported) return [];
    const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.REMINDER);
    const mapped = cals.map((c) => ({
      id: c.id,
      title: c.title,
      color: c.color ?? "#007AFF",
    }));
    setLists(mapped);
    return mapped;
  }, [isSupported]);

  const refreshReminders = useCallback(async (calendarIds: string[]): Promise<void> => {
    if (!isSupported || calendarIds.length === 0) {
      setReminders([]);
      return;
    }
    setFetching(true);
    setError(null);
    try {
      // Wide date window to capture all dated reminders
      const past = new Date(2000, 0, 1);
      const future = new Date(2099, 11, 31);
      const recentPast = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const now = new Date();

      const [incomplete, completed] = await Promise.all([
        Calendar.getRemindersAsync(
          calendarIds,
          Calendar.ReminderStatus.INCOMPLETE,
          past,
          future,
        ),
        Calendar.getRemindersAsync(
          calendarIds,
          Calendar.ReminderStatus.COMPLETE,
          recentPast,
          now,
        ),
      ]);

      const toItem = (r: Calendar.Reminder): ReminderItem => ({
        id: r.id,
        title: r.title ?? "(no title)",
        notes: r.notes ?? null,
        completed: r.completed ?? false,
        dueDate: r.dueDate ? new Date(r.dueDate) : null,
        calendarId: r.calendarId,
      });

      setReminders([...incomplete.map(toItem), ...completed.map(toItem)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reminders");
    } finally {
      setFetching(false);
    }
  }, [isSupported]);

  const createReminder = useCallback(
    async (
      calendarId: string,
      title: string,
      notes?: string,
      dueDate?: Date,
    ): Promise<string> => {
      return Calendar.createReminderAsync(calendarId, {
        title,
        notes,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        completed: false,
      } as Partial<Calendar.Reminder>);
    },
    [],
  );

  const completeReminder = useCallback(async (id: string): Promise<void> => {
    await Calendar.updateReminderAsync(id, {
      completed: true,
      completionDate: new Date().toISOString(),
    } as Partial<Calendar.Reminder>);
  }, []);

  const uncompleteReminder = useCallback(async (id: string): Promise<void> => {
    await Calendar.updateReminderAsync(id, {
      completed: false,
    } as Partial<Calendar.Reminder>);
  }, []);

  const deleteReminder = useCallback(async (id: string): Promise<void> => {
    await Calendar.deleteReminderAsync(id);
  }, []);

  useEffect(() => {
    if (permState === "granted") {
      refreshLists().catch(() => {});
    }
  }, [permState, refreshLists]);

  return {
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
  };
}
