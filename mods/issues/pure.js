// Logic with no herdr or gpui import, so `node --test` can load it.

// The program that opens a link or a local file, and its arguments. Windows has neither open nor
// xdg-open: explorer opens a link in the default browser and a file in its app, given the path
// with backslashes. An unknown platform gets xdg-open.
export function opener(platform, target) {
  if (platform === "macos") return ["open", [target]];
  if (platform === "windows") return ["explorer.exe", [/^[a-z][a-z\d+.-]+:/i.test(target) ? target : target.replace(/\//g, "\\")]];
  return ["xdg-open", [target]];
}

const parse = (url) => { try { return new URL(url); } catch { return null; } };

// The URL as WHATWG normalizes it, or null. Hand this to curl, not the raw string: curl reads
// `https://github.com\@evil.test/` as userinfo and connects to evil.test, WHATWG as a path on github.com.
export const href = (url) => parse(url)?.href ?? null;

// The host to show for a link, or a placeholder when it doesn't parse.
export const host = (url) => parse(url)?.hostname || "unknown host";

// Whether an image may be downloaded without a click: https on GitHub's own hosts. Only the
// parsed hostname counts, so credentials, paths and look-alike names can't pass.
export function trusted(url) {
  const u = parse(url);
  return Boolean(u) && u.protocol === "https:" && (u.hostname === "github.com" || u.hostname.endsWith(".githubusercontent.com"));
}

// #123, and links to this repo's issues and pull requests: the lowest line on
// screen (the newest) first, each line read left to right.
export function mentions(text, repo) {
  const found = [], pattern = new RegExp(`(?:^|[^\\w&/#])#(\\d{1,5})(?![\\w-])|github\\.com/${repo.replace(/\./g, "\\.")}/(?:issues|pull)/(\\d+)`, "g");
  for (const line of text.split("\n").reverse()) {
    for (const m of line.matchAll(pattern)) {
      const n = Number(m[1] ?? m[2]);
      if (!found.includes(n)) found.push(n);
    }
  }
  return found;
}

// Whether the terminal scan is on: mod.json's `settings.mentions`, true unless it is false.
export function mentionsOn(raw) {
  try { return JSON.parse(raw ?? "{}").settings?.mentions !== false; } catch { return true; }
}

// What the confirmation row says before an issue is closed; reason is gh's: "completed" or "not planned".
export const closeLabel = (reason, comment) => `Close as ${reason}${comment ? " with comment" : ""}`;

// The message to hand an agent: the issue's reference, link and how to read it. The body is left out:
// it is untrusted and can be long, and the agent can fetch it.
export const brief = ({ number, title, url }, repo) =>
  `Please work on ${repo}#${number}: ${String(title ?? "").replace(/[\p{Cc}\s]+/gu, " ").trim()}\n${url}\nRead it with: gh issue view ${number} -R ${repo} --comments`;

// What `hc` is asked to type into a terminal; a leading dash would otherwise read as one of its flags.
export const sendArgs = (address, message) => ["send", address, asText(message)];

// The same guard for a message handed to a program that starts an agent.
export const asText = (message) => (message.startsWith("-") ? ` ${message}` : message);

const BRANCH_MAX = 50;

// The branch for an issue: issue-<n>-<slug of the title>, ASCII only (accents dropped, other scripts
// left out), cut at a dash when it has to be shortened.
export function branchName(number, title) {
  const head = `issue-${number}`, room = BRANCH_MAX - head.length - 1;
  let slug = String(title ?? "").normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slug.length > room) {
    const cut = slug.slice(0, room), dash = cut.lastIndexOf("-");
    slug = (slug[room] === "-" || dash < 1 ? cut : cut.slice(0, dash)).replace(/-$/, "");
  }
  return slug ? `${head}-${slug}` : head;
}

// Why a branch name can't be used, or null: the characters the form allows, minus what git refuses in them.
export function branchError(name) {
  if (!name) return "Enter a branch name.";
  if (!/^[\w./-]+$/.test(name)) return "Use letters, digits, dots, dashes, underscores and slashes.";
  if (/^[-/]|[/.]$|\.\.|\/\/|(^|\/)\.|\.lock(\/|$)/.test(name)) return "Git does not accept that branch name.";
  return null;
}

// Where new worktrees go: mod.json's `settings.worktrees_root`, else Herdr's own folder.
export function worktreesRoot(raw) {
  try {
    const root = JSON.parse(raw ?? "{}").settings?.worktrees_root;
    if (typeof root === "string" && root.trim()) return root.trim();
  } catch { /* an unreadable mod.json gives the default */ }
  return "~/.herdr/worktrees";
}

// The folder of a branch's worktree, laid out as Branch PR's: <root>/<owner>-<repo>/<name>.
export const worktreePath = (root, home, repo, branch) =>
  `${root.replace(/^~(?=\/|$)/, home).replace(/\/+$/, "")}/${repo.replace("/", "-")}/${branch.replace(/\//g, "-")}`;

// The number in the URL `gh issue create` prints on its last line, or null.
// Where a layout keeps Branch PR's block: its stack, its id, and the hidden parents to show.
export function prPanel(node, parents = []) {
  for (const child of node?.children ?? []) {
    if (node.type === "stack" && child.content?.mod === "branch-pr") return { stack: node.id, child: child.id, hidden: [...parents, node].filter((n) => n.hidden).map((n) => n.id) };
    const found = prPanel(child, [...parents, node]);
    if (found) return found;
  }
  return null;
}

// Text sizes at the default font_size (BODY is the panel's main text), and the sizes that grow with
// them: ICONS follow `scale` alone; BOXES hold text, so they also grow with font_size and it always fits.
const BODY = 13;
const BASE_TEXT = { tiny: 9, caption: 11, small: 12, body: BODY, large: 14, heading: 16, title: 30 };
const ICONS = { icon: 12, glyph: 14, glyphLarge: 16, avatarSmall: 16, avatar: 20, avatarLarge: 24, dot: 28 };
const BOXES = { chip: 20, segment: 24, control: 26, field: 28, button: 32, notice: 36, cardHeader: 38, header: 42, check: 14, number: 40, sidebar: 264,
  sortMenuWidth: 210, sortMenuHeight: 196, copyMenuWidth: 300, copyMenuHeight: 222, copyMenuSendHeight: 272 };
export const SIZES = { scale: 1, font_size: BODY };
const RANGES = { scale: [0.8, 1.6], font_size: [9, 24] };

// What the views draw with; setSizes changes them in place, so a render reads the current ones.
export const TEXT = { ...BASE_TEXT }, SIZE = { ...ICONS, ...BOXES };

// mod.json's `settings.scale` and `settings.font_size`, kept in their ranges; a hand edit
// that isn't a number, or an unreadable file, gives the default.
export function sizesOf(raw) {
  let given = {};
  try { given = JSON.parse(raw ?? "{}").settings ?? {}; } catch { /* the defaults */ }
  return Object.fromEntries(Object.entries(SIZES).map(([key, fallback]) => {
    const v = given[key], [min, max] = RANGES[key];
    return [key, typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback];
  }));
}

// Text may be fractional; sizes are rounded to whole px.
export function setSizes({ scale, font_size }) {
  const text = font_size / BODY, box = Math.max(scale, text);
  for (const k in BASE_TEXT) TEXT[k] = BASE_TEXT[k] * text;
  for (const k in ICONS) SIZE[k] = Math.round(ICONS[k] * scale);
  for (const k in BOXES) SIZE[k] = Math.round(BOXES[k] * box);
}

export const issueNumber = (stdout) => Number(/\/issues\/(\d+)$/.exec(stdout.trim().split("\n").at(-1).trim())?.[1]) || null;
