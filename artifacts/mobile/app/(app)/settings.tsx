import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useAuth, useCreds } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const creds = useCreds();
  const { signOut } = useAuth();

  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 16);

  function confirmSignOut() {
    Alert.alert(
      "Sign out?",
      "You will need to sign back in to access your tables.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 20,
        paddingBottom: bottomPad + 24,
      }}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          Account
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Row
            label="Signed in as"
            value={creds.user.email}
            icon="user"
            colors={colors}
          />
          <Divider colors={colors} />
          <Row
            label="Baserow URL"
            value={creds.baseUrl}
            icon="globe"
            colors={colors}
          />
        </View>
      </View>

      {/* Admin panel — visible only for superusers */}
      {(creds.user as { is_superuser?: boolean }).is_superuser && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Administration
          </Text>
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Pressable
              style={styles.row}
              onPress={() => router.push("/admin")}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: colors.muted, borderColor: colors.border },
                ]}
              >
                <Feather name="shield" size={14} color={colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
                  Admin Panel
                </Text>
                <Text style={[styles.rowValue, { color: colors.primary }]}>
                  Instance administration →
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          About
        </Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
              padding: 16,
            },
          ]}
        >
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            This app talks directly to the Baserow REST API. Your session token
            is stored only on this device and never sent to any other server.
          </Text>
        </View>
      </View>

      <Button
        title="Sign out"
        variant="destructive"
        onPress={confirmSignOut}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

function Row({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Feather name={icon} size={14} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <Text
          style={[styles.rowValue, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return (
    <View
      style={[styles.divider, { backgroundColor: colors.border }]}
    />
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  rowValue: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 58,
  },
  aboutText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 21,
  },
});
