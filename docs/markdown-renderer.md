# Replicating the MarkdownRenderer in Another Project

A zero-dependency, self-contained markdown renderer for **React Native / Expo**. No `react-native-markdown-display`, no `marked`, no external packages required.

---

## What it renders

| Element | Syntax |
|---|---|
| Headings H1–H4 | `# … ####` |
| Bold | `**text**` or `__text__` |
| Italic | `*text*` or `_text_` |
| Inline code | `` `code` `` |
| Fenced code blocks | ```` ```lang … ``` ```` |
| Unordered lists | `- item` / `* item` |
| Ordered lists | `1. item` |
| Tables (GFM) | `\| col \| col \|` with separator row |
| Blockquotes | `> text` |
| Horizontal rules | `---` / `***` |
| Paragraphs | plain text blocks |

---

## Step 1 — Copy the file

Copy the file from:

```
/Users/buddybot/.openclaw/workspace/baserow-mobile/artifacts/mobile/lib/MarkdownRenderer.tsx
```

into your project. There are **no imports to install** — it only uses `react`, `react-native` core (`View`, `Text`, `ScrollView`, `StyleSheet`, `Platform`).

Suggested path in your repo:

```
src/
  components/
    MarkdownRenderer.tsx   ← drop it here
```

---

## Step 2 — Use it

```tsx
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function MyScreen() {
  const content = `
## Your Tasks

| ID | Title | Done |
|----|-------|------|
| 1  | Buy milk | ✅ |
| 2  | Call dentist | ❌ |

There is **1 incomplete task**.
`;

  return <MarkdownRenderer>{content}</MarkdownRenderer>;
}
```

The component accepts a single `children: string` prop. No config required.

---

## Step 3 — Theming (optional)

The colour palette is defined in the `const m = StyleSheet.create({…})` block at the bottom of the file. Key tokens to change for a **light theme**:

| Style key | Dark value | Light equivalent |
|---|---|---|
| `para` color | `#e2e8f0` | `#1e293b` |
| `h1`–`h4` color | `#a5b4fc` | `#4f46e5` |
| `thTxt` color | `#a5b4fc` | `#4f46e5` |
| `tdTxt` color | `#cbd5e1` | `#334155` |
| `thead` bg | `#1e1b4b` | `#f1f5f9` |
| `trowAlt` bg | `#0d0d24` | `#f8fafc` |
| `fence` bg | `#070714` | `#f1f5f9` |
| `fenceCode` color | `#a5b4fc` | `#4f46e5` |
| `bullet` color | `#6366f1` | `#6366f1` |
| `blockquote` border | `#6366f1` | `#6366f1` |

Just edit those values in your copy — no props system needed.

---

## How the table column alignment works

This is the most interesting part. Standard approaches use `minWidth` which breaks alignment when content lengths differ across rows.

Instead, the renderer **measures before it paints**:

```
For each column index ci:
  maxLen = max(header[ci].length, row[0][ci].length, row[1][ci].length, …)
  colWidth[ci] = clamp(maxLen × 8.2px + 24px, 60px, 260px)
```

Every `<View>` cell in column `ci` — both header and body — receives `{ width: colWidth[ci] }`. Because the width is the same pixel value for every row in that column, the grid aligns perfectly like a spreadsheet.

The constants you can tune:

```ts
const COL_PAD  = 24;   // horizontal padding per cell (12px each side)
const CH_WIDTH = 8.2;  // approximate px per character at fontSize 13
const MIN_COL  = 60;   // minimum column width
const MAX_COL  = 260;  // cap to prevent one long column from dominating
```

If your font size is different, adjust `CH_WIDTH` proportionally (e.g. `fontSize: 15` → `CH_WIDTH ≈ 9.5`).

---

## TypeScript

The file is already `.tsx` with full types. No `@types/*` packages needed.

If your project has `"strict": true` in `tsconfig.json`, you may need to handle the one nullable access:

```ts
// Already handled in the file:
row[ci] ?? ""
```

---

## Works on

| Platform | Status |
|---|---|
| iOS (native) | ✅ |
| Android (native) | ✅ |
| Expo Web (browser) | ✅ |
| React Native Web | ✅ |

The monospace font falls back gracefully:

```ts
const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
```

---

## Limitations

- **Links** — rendered as plain text (no `Linking.openURL`). Easy to add: detect `[text](url)` in `parseInline` and wrap in a `<Text onPress={…}>`.
- **Nested lists** — not supported (flat only).
- **Images** — not supported.
- **HTML** — not parsed; HTML tags appear as literal text.
- **Strikethrough** — not supported (`~~text~~`).

These are intentional omissions to keep the file small and dependency-free. Add them only as needed.

---

## Adding link support (optional)

In `parseInline`, add this case before the bold check:

```ts
// Link [text](url)
const linkMatch = rem.match(/^\[([^\]]+)\]\(([^)]+)\)/);
if (linkMatch) {
  chunks.push({ type: 'link', t: linkMatch[1], href: linkMatch[2] });
  rem = rem.slice(linkMatch[0].length);
  continue;
}
```

Then in `InlineText`:

```tsx
import { Linking } from 'react-native';

if (c.type === 'link') return (
  <Text key={i} style={[baseStyle, m.link]} onPress={() => Linking.openURL(c.href)}>
    {c.t}
  </Text>
);
```

And add to styles:

```ts
link: { color: '#818cf8', textDecorationLine: 'underline' },
```
