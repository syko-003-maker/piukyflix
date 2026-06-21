import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, toInt } from "./utils";

test("escapeHtml escapes HTML metacharacters", () => {
  assert.equal(
    escapeHtml(`<script>alert("x")</script>`),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
  );
  assert.equal(escapeHtml("a & b"), "a &amp; b");
  assert.equal(escapeHtml("it's"), "it&#39;s");
});

test("escapeHtml leaves plain text unchanged", () => {
  assert.equal(escapeHtml("Bonjour le monde"), "Bonjour le monde");
});

test("toInt clamps within bounds", () => {
  assert.equal(toInt("50", 20, 1, 100), 50);
  assert.equal(toInt("500", 20, 1, 100), 100);
  assert.equal(toInt("0", 20, 1, 100), 1);
});

test("toInt falls back on non-numeric input", () => {
  assert.equal(toInt("abc", 20, 1, 100), 20);
  assert.equal(toInt(undefined, 12, 1, 100), 12);
  assert.equal(toInt(NaN, 7, 1, 100), 7);
});

test("toInt truncates floats", () => {
  assert.equal(toInt("3.9", 20, 1, 100), 3);
});
