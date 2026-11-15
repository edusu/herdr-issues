import test from "node:test";
import assert from "node:assert/strict";
import { opener } from "../pure.js";

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
