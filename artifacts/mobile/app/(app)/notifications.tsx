import { StyleSheet, Switch, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useColors } from "@/hooks/useColors";

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    hasPermission,
    expoPushToken,
    settings,
    updateSettings,
  } = usePushNotifications();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
        }}
      />

      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingBottom: insets.bottom },
        ]}
      >
        {/* Permission Status */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            PERMISSION STATUS
          </Text>

          <View
            style={[
              styles.row,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.rowContent}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>
                Push Notifications
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                {hasPermission
                  ? "Enabled"
                  : "Tap to enable in your device settings"}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: hasPermission ? "#22c55e" : "#ef4444",
                },
              ]}
            >
              <Text style={styles.badgeText}>
                {hasPermission ? "ON" : "OFF"}
              </Text>
            </View>
          </View>

          {expoPushToken && (
            <View
              style={[
                styles.tokenContainer,
                { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.tokenLabel, { color: colors.mutedForeground }]}>
                Device Token
              </Text>
              <Text
                style={[styles.tokenValue, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {expoPushToken.substring(0, 40)}...
              </Text>
            </View>
          )}
        </View>

        {/* Notification Types */}
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            NOTIFICATION TYPES
          </Text>

          <NotificationToggle
            title="Table Updates"
            subtitle="Get notified when rows are added or modified"
            value={settings.tableUpdates}
            onValueChange={(value) => updateSettings({ tableUpdates: value })}
            colors={colors}
          />

          <NotificationToggle
            title="Mentions"
            subtitle="Get alerted when someone mentions you"
            value={settings.mentionAlerts}
            onValueChange={(value) => updateSettings({ mentionAlerts: value })}
            colors={colors}
          />

          <NotificationToggle
            title="Weekly Digest"
            subtitle="Summary of your Baserow activity"
            value={settings.weeklyDigest}
            onValueChange={(value) => updateSettings({ weeklyDigest: value })}
            colors={colors}
          />
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            To receive notifications, make sure push notifications are enabled
            for this app in your device settings.
          </Text>
        </View>
      </View>
    </>
  );
}

function NotificationToggle({
  title,
  subtitle,
  value,
  onValueChange,
  colors,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.muted, true: colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  tokenContainer: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  infoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
