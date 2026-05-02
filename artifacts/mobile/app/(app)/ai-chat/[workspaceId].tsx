import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  LayoutAnimation,
  UIManager,
  Clipboard,
} from "react-native";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import Markdown from "../../../lib/MarkdownRenderer";
import { useCreds } from "../../../contexts/AuthContext";
import {
  listAssistantChats,
  listAssistantMessages,
  sendAssistantMessage,
  submitAssistantFeedback,
  type AssistantChat,
  type AssistantMessage,
} from "../../../lib/baserow";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Types ────────────────────────────────────────────────────────────────────

type ParsedSseEvent = { type?: string; content?: string; id?: number; [k: string]: unknown };

type DisplayMessage = {
  id: string;
  numericId?: number;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  created_at: string;
  isStreaming?: boolean;
  sentiment?: "positive" | "negative" | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSseText(raw: string): { reasoning: string; content: string; id?: number } {
  let reasoning = "";
  let content = "";
  let id: number | undefined;
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    let json: string | null = null;
    if (t.startsWith("data:")) json = t.slice(5).trim();
    else if (t.startsWith("{")) json = t;
    if (!json || json === "[DONE]") continue;
    try {
      const ev = JSON.parse(json) as ParsedSseEvent;
      if (typeof ev.id === "number") id = ev.id;
      if (ev.type === "ai/reasoning" && typeof ev.content === "string") reasoning = ev.content;
      else if (ev.type === "ai/message" && typeof ev.content === "string") content = ev.content;
    } catch {}
  }
  return { reasoning, content, id };
}

function toDisplay(msg: AssistantMessage): DisplayMessage {
  if (msg.role === "user") {
    return { id: String(msg.id), numericId: msg.id, role: "user", content: msg.message, created_at: msg.created_at };
  }
  const { reasoning, content } = parseSseText(msg.message);
  return {
    id: String(msg.id),
    numericId: msg.id,
    role: "assistant",
    content: content || msg.message,
    reasoning: reasoning || undefined,
    created_at: msg.created_at,
  };
}



// ── ReasoningBadge ────────────────────────────────────────────────────────────

function ReasoningBadge({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false);
  const rot = useRef(new Animated.Value(0)).current;
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(rot, { toValue: open ? 0 : 1, duration: 180, useNativeDriver: true }).start();
    setOpen((p) => !p);
  };
  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });
  return (
    <View style={s.reasonBox}>
      <TouchableOpacity style={s.reasonHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={s.reasonDot} />
        <Text style={s.reasonLabel}>REASONING</Text>
        <Animated.Text style={[s.reasonChev, { transform: [{ rotate }] }]}>›</Animated.Text>
      </TouchableOpacity>
      {open && (
        <View style={s.reasonBody}>
          <Text style={s.reasonText}>{reasoning}</Text>
        </View>
      )}
    </View>
  );
}

// ── FeedbackBar ───────────────────────────────────────────────────────────────

function FeedbackBar({ msg, onFeedback }: { msg: DisplayMessage; onFeedback: (id: string, sentiment: "positive" | "negative") => void }) {
  const copy = () => { try { Clipboard.setString(msg.content); } catch {} };
  return (
    <View style={s.feedbackRow}>
      <TouchableOpacity style={s.feedbackBtn} onPress={() => onFeedback(msg.id, "positive")} activeOpacity={0.7}>
        <Text style={[s.feedbackIcon, msg.sentiment === "positive" && s.feedbackActive]}>👍</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.feedbackBtn} onPress={() => onFeedback(msg.id, "negative")} activeOpacity={0.7}>
        <Text style={[s.feedbackIcon, msg.sentiment === "negative" && s.feedbackActive]}>👎</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.feedbackBtn} onPress={copy} activeOpacity={0.7}>
        <Text style={s.feedbackIcon}>⧉</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── TypingDots ────────────────────────────────────────────────────────────────

function TypingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    dots.forEach((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0.3, duration: 300, useNativeDriver: true }),
      ])).start()
    );
  }, []);
  return (
    <View style={s.dotsRow}>
      {dots.map((d, i) => <Animated.View key={i} style={[s.dot, { opacity: d }]} />)}
    </View>
  );
}

// ── MessageBubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, onFeedback }: { msg: DisplayMessage; onFeedback: (id: string, s: "positive" | "negative") => void }) {
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (msg.role === "user") {
    return (
      <View style={s.rowRight}>
        <View style={s.userBubble}>
          <Text style={s.userText}>{msg.content}</Text>
          <Text style={s.tsRight}>{time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.rowLeft}>
      <View style={s.avatar}><Text style={s.avatarIcon}>✦</Text></View>
      <View style={s.assistantOuter}>
        {msg.reasoning && !msg.isStreaming && <ReasoningBadge reasoning={msg.reasoning} />}
        {msg.isStreaming && <TypingDots />}
        {!msg.isStreaming && msg.content ? (
          <View style={s.assistantBubble}>
            <Markdown>{msg.content}</Markdown>
            <Text style={s.tsLeft}>{time}</Text>
          </View>
        ) : null}
        {!msg.isStreaming && msg.content ? (
          <FeedbackBar msg={msg} onFeedback={onFeedback} />
        ) : null}
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AIChatScreen() {
  const { workspaceId } = useLocalSearchParams<{ workspaceId: string }>();
  const router = useRouter();
  const creds = useCreds();
  const [chat, setChat] = useState<AssistantChat | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => { loadChat(); }, [workspaceId]);

  async function loadChat() {
    if (!creds) return;
    try {
      setLoading(true); setError(null);
      const chats = await listAssistantChats(creds, Number(workspaceId));
      const first = chats[0];
      if (first) {
        setChat(first);
        const resp = await listAssistantMessages(creds, first.uuid);
        setMessages([...resp.results].reverse().map(toDisplay));
      }
    } catch (e: any) { setError(e.message || "Failed to load chat"); }
    finally { setLoading(false); }
  }

  const scrollEnd = useCallback(() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80), []);

  const handleFeedback = useCallback(async (id: string, sentiment: "positive" | "negative") => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, sentiment } : m));
    const msg = messages.find((m) => m.id === id);
    if (creds && msg?.numericId) {
      try { await submitAssistantFeedback(creds, msg.numericId, sentiment); } catch {}
    }
  }, [creds, messages]);

  async function handleSend() {
    if (!creds || !input.trim() || sending || !chat?.uuid) return;
    const text = input.trim();
    setInput(""); setSending(true); setError(null);

    const uid = `u-${Date.now()}`;
    const sid = `s-${Date.now()}`;
    const userMsg: DisplayMessage = { id: uid, role: "user", content: text, created_at: new Date().toISOString() };
    const streamMsg: DisplayMessage = { id: sid, role: "assistant", content: "", reasoning: "", created_at: new Date().toISOString(), isStreaming: true };
    setMessages((p) => [...p, userMsg, streamMsg]);
    scrollEnd();

    try {
      const stream = await sendAssistantMessage(creds, chat.uuid, text, {
        workspace: { id: Number(workspaceId), name: "Workspace" },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });

      const body = stream as unknown as ReadableStream<Uint8Array> | null;
      const decoder = new TextDecoder();
      let buf = "", lastReason = "", finalContent = "", finalId = 0;

      const flush = () => {
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          let json: string | null = null;
          if (t.startsWith("data:")) json = t.slice(5).trim();
          else if (t.startsWith("{")) json = t;
          if (!json || json === "[DONE]") continue;
          try {
            const ev = JSON.parse(json) as ParsedSseEvent;
            if (typeof ev.id === "number") finalId = ev.id;
            if (ev.type === "ai/reasoning" && typeof ev.content === "string") {
              lastReason = ev.content;
              setMessages((p) => p.map((m) => m.id === sid ? { ...m, reasoning: ev.content as string } : m));
            } else if (ev.type === "ai/message" && typeof ev.content === "string") {
              finalContent = ev.content;
            }
          } catch {}
        }
      };

      if (body && typeof (body as any).getReader === "function") {
        const reader = (body as ReadableStream<Uint8Array>).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) { buf += decoder.decode(value, { stream: true }); flush(); scrollEnd(); }
        }
        buf += decoder.decode(); flush();
      }

      const final: DisplayMessage = {
        id: finalId ? String(finalId) : sid,
        numericId: finalId || undefined,
        role: "assistant",
        content: finalContent || "Assistant response received.",
        reasoning: lastReason || undefined,
        created_at: new Date().toISOString(),
      };
      setMessages((p) => p.map((m) => m.id === sid ? final : m));
      scrollEnd();
    } catch (e: any) {
      setError(e.message || "Failed to send message");
      setMessages((p) => p.filter((m) => m.id !== uid && m.id !== sid));
    } finally { setSending(false); }
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={s.loadingTxt}>Loading AI Assistant…</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{
        title: "AI Assistant",
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: "#0a0a1a" },
        headerTintColor: "#a5b4fc",
        headerTitleStyle: { color: "#e2e8f0", fontWeight: "700" },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={s.backArrow}>‹</Text>
            <Text style={s.backLabel}>Back</Text>
          </TouchableOpacity>
        ),
      }} />
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
        {error && (
          <View style={s.errBar}>
            <Text style={s.errTxt}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)}><Text style={s.errDismiss}>✕</Text></TouchableOpacity>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <MessageBubble msg={item} onFeedback={handleFeedback} />}
          contentContainerStyle={s.list}
          onContentSizeChange={scrollEnd}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>✦</Text>
              <Text style={s.emptyTitle}>Ask me anything</Text>
              <Text style={s.emptySub}>Query your data, count records, analyze trends — just ask in plain language.</Text>
            </View>
          }
        />

        {/* Status bar (Baserow-style) */}
        <View style={s.statusBar}>
          <Text style={s.statusDot}>✦</Text>
          <Text style={s.statusTxt}>
            {sending ? "Kuma is thinking…" : "Assistant is ready to help"}
          </Text>
        </View>

        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything…"
            placeholderTextColor="#475569"
            multiline
            maxLength={2000}
            editable={!sending}
            // Shift+Enter or Cmd+Enter sends on web; plain Enter stays as newline
            onKeyPress={(e: any) => {
              if (
                Platform.OS === "web" &&
                e.nativeEvent?.key === "Enter" &&
                (e.nativeEvent?.shiftKey || e.nativeEvent?.metaKey)
              ) {
                e.preventDefault?.();
                handleSend();
              }
            }}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendOff]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.sendArrow}>↑</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PURPLE = "#6366f1";
const DEEP = "#0a0a1a";
const CARD = "#13132a";
const BORDER = "#1e1b4b";

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: DEEP },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: DEEP },
  loadingTxt: { marginTop: 14, fontSize: 15, color: "#94a3b8" },

  errBar: { backgroundColor: "#1e0a0a", borderBottomWidth: 1, borderBottomColor: "#ef4444", paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center" },
  errTxt: { color: "#fca5a5", flex: 1, fontSize: 13 },
  errDismiss: { color: "#f87171", fontSize: 16, marginLeft: 12 },

  list: { padding: 16, paddingBottom: 8, flexGrow: 1 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, paddingTop: 80 },
  emptyIcon: { fontSize: 44, color: PURPLE, marginBottom: 14 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: "#e2e8f0", marginBottom: 8 },
  emptySub: { fontSize: 15, color: "#64748b", textAlign: "center", lineHeight: 22 },

  // User bubble
  rowRight: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 16 },
  userBubble: { backgroundColor: PURPLE, borderRadius: 20, borderBottomRightRadius: 4, paddingHorizontal: 16, paddingVertical: 12, maxWidth: "78%" },
  userText: { color: "#fff", fontSize: 15, lineHeight: 22 },
  tsRight: { fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, alignSelf: "flex-end" },

  // Assistant bubble
  rowLeft: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4 },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#1e1b4b", justifyContent: "center", alignItems: "center", marginRight: 10, flexShrink: 0, marginTop: 2 },
  avatarIcon: { fontSize: 13, color: "#a5b4fc" },
  assistantOuter: { flex: 1, maxWidth: "85%" },
  assistantBubble: { backgroundColor: CARD, borderRadius: 16, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 4 },
  tsLeft: { fontSize: 10, color: "#475569", marginTop: 4 },

  // Reasoning
  reasonBox: { marginBottom: 6, borderRadius: 10, backgroundColor: "#070714", borderWidth: 1, borderColor: "#1e293b", overflow: "hidden" },
  reasonHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  reasonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#818cf8" },
  reasonLabel: { fontSize: 11, color: "#818cf8", fontWeight: "700", flex: 1, letterSpacing: 0.8, textTransform: "uppercase" },
  reasonChev: { fontSize: 18, color: "#475569" },
  reasonBody: { paddingHorizontal: 12, paddingBottom: 10, borderTopWidth: 1, borderTopColor: "#1e293b" },
  reasonText: { fontSize: 13, color: "#64748b", lineHeight: 20, fontStyle: "italic", paddingTop: 8 },

  // Feedback
  feedbackRow: { flexDirection: "row", paddingLeft: 4, marginBottom: 12, gap: 2 },
  feedbackBtn: { padding: 6, borderRadius: 8 },
  feedbackIcon: { fontSize: 15, color: "#475569" },
  feedbackActive: { color: "#6366f1" },

  // Typing dots
  dotsRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PURPLE },

  // Status bar
  statusBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderTopWidth: 1, borderTopColor: BORDER },
  statusDot: { fontSize: 11, color: PURPLE },
  statusTxt: { fontSize: 12, color: "#64748b" },

  // Input
  inputRow: { flexDirection: "row", paddingHorizontal: 12, paddingBottom: Platform.OS === "ios" ? 20 : 12, paddingTop: 8, backgroundColor: DEEP, alignItems: "flex-end", gap: 10 },
  input: { flex: 1, backgroundColor: CARD, borderRadius: 24, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: "#e2e8f0", maxHeight: 120 },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: PURPLE, justifyContent: "center", alignItems: "center", flexShrink: 0 },
  sendOff: { backgroundColor: BORDER },
  sendArrow: { color: "#fff", fontSize: 22, fontWeight: "700", lineHeight: 26 },

  // Back button
  backBtn: { flexDirection: "row", alignItems: "center", paddingLeft: 8, gap: 2 },
  backArrow: { fontSize: 28, color: "#a5b4fc", lineHeight: 32, fontWeight: "300" },
  backLabel: { fontSize: 15, color: "#a5b4fc", fontWeight: "500" },
});
