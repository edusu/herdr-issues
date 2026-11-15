import test from "node:test";
import assert from "node:assert/strict";
import { opener, trusted, host } from "../pure.js";

const URL = "https://github.com/o/r/issues/1", PNG = "C:/Users/x/data/issues/images/a.png";

test("opener picks the platform's program for a link", () => {
  assert.deepEqual(opener("macos", URL), ["open", [URL]]);
  assert.deepEqual(opener("linux", URL), ["xdg-open", [URL]]);
  assert.deepEqual(opener("windows", URL), ["explorer.exe", [URL]]);
});

test("opener gives Windows a local path with backslashes and leaves other paths alone", () => {
  assert.deepEqual(opener("windows", PNG), ["explorer.exe", ["C:\\Users\\x\\data\\issues\\images\\a.png"]]);
  assert.deepEqual(opener("macos", "/Users/x/a.png"), ["open", ["/Users/x/a.png"]]);
});

test("opener falls back to xdg-open when the platform is unknown", () => {
  assert.deepEqual(opener(undefined, URL), ["xdg-open", [URL]]);
});

test("trusted accepts https images on GitHub's own hosts", () => {
  for (const u of ["https://github.com/user-attachments/assets/1-2", "https://user-images.githubusercontent.com/1/a.png", "https://private-user-images.githubusercontent.com/1/a.png?jwt=x", "https://avatars.githubusercontent.com/u/1", "https://GitHub.com/o/r/a.png"])
    assert.equal(trusted(u), true, u);
});

test("trusted rejects look-alike hosts, other schemes, IP literals and malformed URLs", () => {
  for (const u of ["https://github.com.evil.test/a.png", "https://evilgithubusercontent.com/a.png", "https://githubusercontent.com/a.png", "https://evil.test/github.com", "https://github.com@evil.test/a.png", "http://github.com/a.png", "//github.com/a.png", "https://140.82.112.3/a.png", "https://[::1]/a.png", "https://127.0.0.1/a.png", "not a url", ""])
    assert.equal(trusted(u), false, u);
  assert.equal(trusted("https://evil.test@github.com/a.png"), true);
});

test("host names the host to show, or says it is unknown", () => {
  assert.equal(host("https://tracker.example.com/p.gif?x=1"), "tracker.example.com");
  assert.equal(host("https://"), "unknown host");
});
