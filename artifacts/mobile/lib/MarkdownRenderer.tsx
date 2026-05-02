/**
 * MarkdownRenderer — a self-contained, zero-dependency markdown renderer
 * for React Native. Handles: headings, bold, italic, inline code, code blocks,
 * tables, unordered & ordered lists, blockquotes, horizontal rules, links, paragraphs.
 */
import React from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";

type Token =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "hr" }
  | { kind: "blank" }
  | { kind: "fence"; lang: string; code: string }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "paragraph"; text: string };

// ── Tokeniser ─────────────────────────────────────────────────────────────────

function tokenise(md: string): Token[] {
  const raw = md.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = raw.split("\n");
  const tokens: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank
    if (line.trim() === "") { tokens.push({ kind: "blank" }); i++; continue; }

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { codeLines.push(lines[i]); i++; }
      i++; // consume closing ```
      tokens.push({ kind: "fence", lang, code: codeLines.join("\n") });
      continue;
    }

    // Heading
    const hMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (hMatch) {
      tokens.push({ kind: "heading", level: Math.min(hMatch[1].length, 4) as 1|2|3|4, text: hMatch[2] });
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}\s*$/.test(line)) { tokens.push({ kind: "hr" }); i++; continue; }

    // Blockquote
    if (line.startsWith("> ") || line === ">") {
      const bqLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      tokens.push({ kind: "blockquote", lines: bqLines });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s/, ""));
        i++;
      }
      tokens.push({ kind: "ul", items }); continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      tokens.push({ kind: "ol", items }); continue;
    }

    // Table (GFM)
    if (line.includes("|") && i + 1 < lines.length && /^\|?[-:| ]+\|?$/.test(lines[i + 1])) {
      const parseRow = (r: string) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = parseRow(line);
      i += 2; // skip separator row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) { rows.push(parseRow(lines[i])); i++; }
      tokens.push({ kind: "table", head, rows }); continue;
    }

    // Paragraph — accumulate until blank/block element
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^[-*_]{3,}\s*$/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !(lines[i].includes("|") && i + 1 < lines.length && /^\|?[-:| ]+\|?$/.test(lines[i + 1])) &&
      !/^>\s/.test(lines[i])
    ) { paraLines.push(lines[i]); i++; }
    if (paraLines.length) tokens.push({ kind: "paragraph", text: paraLines.join("\n") });
  }
  return tokens;
}

// ── Inline renderer ────────────────────────────────────────────────────────────

type InlineChunk = { type: "text"; t: string } | { type: "bold"; t: string } | { type: "italic"; t: string } | { type: "code"; t: string };

function parseInline(text: string): InlineChunk[] {
  const chunks: InlineChunk[] = [];
  let rem = text;
  while (rem.length > 0) {
    // Inline code
    const codeMatch = rem.match(/^`([^`]+)`/);
    if (codeMatch) { chunks.push({ type: "code", t: codeMatch[1] }); rem = rem.slice(codeMatch[0].length); continue; }
    // Bold
    const boldMatch = rem.match(/^\*\*(.+?)\*\*/) || rem.match(/^__(.+?)__/);
    if (boldMatch) { chunks.push({ type: "bold", t: boldMatch[1] }); rem = rem.slice(boldMatch[0].length); continue; }
    // Italic
    const itMatch = rem.match(/^\*(.+?)\*/) || rem.match(/^_(.+?)_/);
    if (itMatch) { chunks.push({ type: "italic", t: itMatch[1] }); rem = rem.slice(itMatch[0].length); continue; }
    // Text until next special char
    const nextSpec = rem.search(/[*_`]/);
    if (nextSpec === -1) { chunks.push({ type: "text", t: rem }); break; }
    if (nextSpec > 0) { chunks.push({ type: "text", t: rem.slice(0, nextSpec) }); rem = rem.slice(nextSpec); continue; }
    // Unmatched special char
    chunks.push({ type: "text", t: rem[0] }); rem = rem.slice(1);
  }
  return chunks;
}

function InlineText({ text, baseStyle }: { text: string; baseStyle?: object }) {
  const chunks = parseInline(text);
  return (
    <Text style={baseStyle}>
      {chunks.map((c, i) => {
        if (c.type === "bold") return <Text key={i} style={[baseStyle, m.bold]}>{c.t}</Text>;
        if (c.type === "italic") return <Text key={i} style={[baseStyle, m.italic]}>{c.t}</Text>;
        if (c.type === "code") return <Text key={i} style={[baseStyle, m.inlineCode]}>{c.t}</Text>;
        return <Text key={i} style={baseStyle}>{c.t}</Text>;
      })}
    </Text>
  );
}

// ── Block renderers ────────────────────────────────────────────────────────────

function RenderToken({ tok, idx }: { tok: Token; idx: number }) {
  switch (tok.kind) {
    case "blank": return null;
    case "hr": return <View key={idx} style={m.hr} />;
    case "heading":
      return <InlineText key={idx} text={tok.text} baseStyle={m[`h${tok.level}` as "h1"|"h2"|"h3"|"h4"]} />;
    case "fence":
      return (
        <View key={idx} style={m.fence}>
          {tok.lang ? <Text style={m.fenceLang}>{tok.lang}</Text> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={m.fenceCode}>{tok.code}</Text>
          </ScrollView>
        </View>
      );
    case "blockquote":
      return (
        <View key={idx} style={m.blockquote}>
          {tok.lines.map((l, j) => <InlineText key={j} text={l} baseStyle={m.bqText} />)}
        </View>
      );
    case "ul":
      return (
        <View key={idx} style={m.list}>
          {tok.items.map((item, j) => (
            <View key={j} style={m.listItem}>
              <Text style={m.bullet}>•</Text>
              <InlineText text={item} baseStyle={m.listText} />
            </View>
          ))}
        </View>
      );
    case "ol":
      return (
        <View key={idx} style={m.list}>
          {tok.items.map((item, j) => (
            <View key={j} style={m.listItem}>
              <Text style={m.bullet}>{j + 1}.</Text>
              <InlineText text={item} baseStyle={m.listText} />
            </View>
          ))}
        </View>
      );
    case "table": {
      // ── Compute per-column widths from content length ─────────────────
      const COL_PAD = 24;        // px of horizontal padding per cell (12 each side)
      const CH_WIDTH = 8.2;      // approximate px per character at fontSize 13
      const MIN_COL = 60;        // minimum column width px
      const MAX_COL = 260;       // cap so huge columns don't dominate

      const colCount = tok.head.length;
      const colWidths: number[] = tok.head.map((h, ci) => {
        // Find longest text in this column across header + all rows
        let maxLen = h.length;
        for (const row of tok.rows) {
          const cell = row[ci] ?? "";
          // strip markdown bold/italic markers for length estimate
          const plain = cell.replace(/\*\*?|__?/g, "");
          if (plain.length > maxLen) maxLen = plain.length;
        }
        const px = Math.round(maxLen * CH_WIDTH) + COL_PAD;
        return Math.min(MAX_COL, Math.max(MIN_COL, px));
      });

      const renderCell = (text: string, colIdx: number, isHeader: boolean, altRow: boolean) => (
        <View
          key={colIdx}
          style={[
            isHeader ? m.th : m.td,
            { width: colWidths[colIdx] },
            !isHeader && altRow && m.tdAlt,
            colIdx === colCount - 1 && { borderRightWidth: 0 },
          ]}
        >
          <InlineText text={text} baseStyle={isHeader ? m.thTxt : m.tdTxt} />
        </View>
      );

      return (
        <ScrollView key={idx} horizontal showsHorizontalScrollIndicator={true} style={m.tableScroll}>
          <View style={m.table}>
            {/* Header */}
            <View style={m.thead}>
              {tok.head.map((h, ci) => renderCell(h, ci, true, false))}
            </View>
            {/* Body rows */}
            {tok.rows.map((row, ri) => (
              <View key={ri} style={[m.trow, ri % 2 === 1 && m.trowAlt]}>
                {tok.head.map((_, ci) => renderCell(row[ci] ?? "", ci, false, ri % 2 === 1))}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }
    case "paragraph":
      return <InlineText key={idx} text={tok.text} baseStyle={m.para} />;
    default: return null;
  }
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function MarkdownRenderer({ children }: { children: string }) {
  const tokens = tokenise(children || "");
  return (
    <View>
      {tokens.map((tok, i) => <RenderToken key={i} tok={tok} idx={i} />)}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

const m = StyleSheet.create({
  para: { fontSize: 15, lineHeight: 23, color: "#e2e8f0", marginBottom: 8 },
  bold: { fontWeight: "700", color: "#f1f5f9" },
  italic: { fontStyle: "italic", color: "#94a3b8" },
  inlineCode: { fontFamily: MONO, fontSize: 13, color: "#a5b4fc", backgroundColor: "#1e293b", borderRadius: 4, paddingHorizontal: 4 },

  h1: { fontSize: 22, fontWeight: "700", color: "#a5b4fc", marginBottom: 10, marginTop: 4, lineHeight: 28 },
  h2: { fontSize: 18, fontWeight: "700", color: "#a5b4fc", marginBottom: 8, marginTop: 4, lineHeight: 24 },
  h3: { fontSize: 16, fontWeight: "600", color: "#c4b5fd", marginBottom: 6, marginTop: 4, lineHeight: 22 },
  h4: { fontSize: 15, fontWeight: "600", color: "#c4b5fd", marginBottom: 4, lineHeight: 22 },

  hr: { borderBottomWidth: 1, borderBottomColor: "#1e293b", marginVertical: 12 },

  fence: { backgroundColor: "#070714", borderRadius: 10, padding: 14, marginVertical: 10, borderWidth: 1, borderColor: "#1e293b" },
  fenceLang: { fontSize: 10, color: "#475569", fontFamily: MONO, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
  fenceCode: { fontFamily: MONO, fontSize: 13, color: "#a5b4fc", lineHeight: 20 },

  blockquote: { borderLeftWidth: 3, borderLeftColor: "#6366f1", paddingLeft: 12, marginVertical: 6, backgroundColor: "#0f0f1f", paddingVertical: 6, borderRadius: 4 },
  bqText: { fontSize: 15, color: "#94a3b8", lineHeight: 22 },

  list: { marginVertical: 4, marginBottom: 8 },
  listItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 6 },
  bullet: { color: "#6366f1", fontSize: 15, marginRight: 8, lineHeight: 23, minWidth: 16 },
  listText: { flex: 1, fontSize: 15, color: "#e2e8f0", lineHeight: 23 },

  tableScroll: { marginVertical: 10 },
  table: { borderRadius: 10, borderWidth: 1, borderColor: "#1e1b4b", overflow: "hidden" },
  thead: { flexDirection: "row", backgroundColor: "#1e1b4b" },
  // th / td are now *container* Views; text styles are thTxt / tdTxt
  th: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#312e81",
    justifyContent: "center",
  },
  thTxt: { fontSize: 13, fontWeight: "700", color: "#a5b4fc" },
  trow: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#1a1a35" },
  trowAlt: { backgroundColor: "#0d0d24" },
  td: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRightWidth: 1,
    borderRightColor: "#1a1a35",
    justifyContent: "center",
  },
  tdAlt: { backgroundColor: "transparent" }, // placeholder, handled inline
  tdTxt: { fontSize: 13, color: "#cbd5e1", lineHeight: 18 },
});
