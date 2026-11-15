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
