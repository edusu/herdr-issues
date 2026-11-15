import test from "node:test";
import assert from "node:assert/strict";
import { opener, trusted, href, host, mentions, mentionsOn } from "../pure.js";

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

test("href gives curl a URL whose host matches what trusted checked", () => {
  const raw = "https://github.com\\@evil.test/x.png";
  assert.equal(trusted(raw), true);
  assert.equal(href(raw), "https://github.com/@evil.test/x.png");
  assert.equal(href("https://evil.test@github.com/x.png"), "https://evil.test@github.com/x.png");
  assert.equal(href("not a url"), null);
});

test("host names the host to show, or says it is unknown", () => {
  assert.equal(host("https://tracker.example.com/p.gif?x=1"), "tracker.example.com");
  assert.equal(host("https://"), "unknown host");
});

const REPO = "o/r";

test("mentions finds #123, not inside words, paths or other anchors", () => {
  assert.deepEqual(mentions("fix #12, see (#7) and #9.", REPO), [12, 7, 9]);
  assert.deepEqual(mentions("abc#5 a/#6 &#7 ##8 #9x #10-x #123456 word #11", REPO), [11]);
});

test("mentions lists the newest line first and each line left to right", () => {
  assert.deepEqual(mentions("#1 #2\n#3\n#4 #5", REPO), [4, 5, 3, 1, 2]);
});

test("mentions reads links to this repo's issues and pull requests only", () => {
  const text = "https://github.com/o/r/issues/30 https://github.com/o/r/pull/31 https://github.com/o/other/issues/32 https://github.com/oXr/issues/33";
  assert.deepEqual(mentions(text, REPO), [30, 31]);
  assert.deepEqual(mentions("https://github.com/a.b/c/issues/4 https://github.com/aXb/c/issues/5", "a.b/c"), [4]);
});

test("mentions lists a number once and gives [] when there is none", () => {
  assert.deepEqual(mentions("#4\nhttps://github.com/o/r/issues/4 #4", REPO), [4]);
  assert.deepEqual(mentions("nothing here", REPO), []);
});

test("mentionsOn is false only when settings.mentions is false", () => {
  assert.equal(mentionsOn('{"settings":{"mentions":false}}'), false);
  for (const raw of ['{"settings":{"mentions":true}}', '{"settings":{}}', "{}", "not json", "", null]) assert.equal(mentionsOn(raw), true, String(raw));
});
