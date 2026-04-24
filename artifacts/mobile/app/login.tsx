import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useWebInsets } from "@/hooks/useWebInsets";
import { BaserowApiError, DEFAULT_BASEROW_URL } from "@/lib/baserow";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const webInsets = useWebInsets();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASEROW_URL);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Math.max(insets.top, webInsets.top, 24);
  const bottomPad = Math.max(insets.bottom, webInsets.bottom, 24);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn({ baseUrl, email, password });
      router.replace("/(app)");
    } catch (e) {
      if (e instanceof BaserowApiError) {
        if (e.status === 401 || e.status === 400) {
          setError("Invalid email or password.");
        } else {
          setError(e.message || "Sign in failed. Please try again.");
        }
      } else if (e instanceof Error) {
        setError(
          e.message.includes("Network")
            ? "Could not reach the Baserow server. Check the URL and your connection."
            : e.message,
        );
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.fill}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: topPad + 32, paddingBottom: bottomPad + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.logoWrap,
              { backgroundColor: colors.primary, borderRadius: 18 },
            ]}
          >
            <Feather name="database" size={28} color={colors.primaryForeground} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Sign in to Baserow
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Connect with your Baserow account to browse and edit your tables on the
            go.
          </Text>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.foreground,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            />
          </View>

          <Pressable
            onPress={() => setShowAdvanced((s) => !s)}
            hitSlop={8}
            style={styles.advancedToggle}
          >
            <Feather
              name={showAdvanced ? "chevron-down" : "chevron-right"}
              size={14}
              color={colors.mutedForeground}
            />
            <Text style={[styles.advancedText, { color: colors.mutedForeground }]}>
              Self-hosted instance
            </Text>
          </Pressable>

          {showAdvanced ? (
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                Baserow URL
              </Text>
              <TextInput
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder={DEFAULT_BASEROW_URL}
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              />
            </View>
          ) : null}

          {error ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.destructive,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          ) : null}

          <Button
            title="Sign in"
            onPress={handleSubmit}
            loading={submitting}
            style={{ marginTop: 8 }}
          />

          <Text style={[styles.helper, { color: colors.mutedForeground }]}>
            Your credentials are sent directly to the Baserow API. The session
            token is stored on this device only.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    gap: 4,
  },
  logoWrap: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28,
  },
  formGroup: {
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    marginBottom: 8,
  },
  advancedText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  helper: {
    marginTop: 18,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
