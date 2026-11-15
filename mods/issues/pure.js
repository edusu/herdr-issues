// Logic with no herdr or gpui import, so `node --test` can load it.

// The program that opens a link or a local file, and its arguments. Windows has neither open nor
// xdg-open: explorer opens a link in the default browser and a file in its app, given the path
// with backslashes. An unknown platform gets xdg-open.
export function opener(platform, target) {
  if (platform === "macos") return ["open", [target]];
  if (platform === "windows") return ["explorer.exe", [/^[a-z][a-z\d+.-]+:/i.test(target) ? target : target.replace(/\//g, "\\")]];
  return ["xdg-open", [target]];
}
