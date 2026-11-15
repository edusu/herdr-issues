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
