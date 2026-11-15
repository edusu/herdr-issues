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
