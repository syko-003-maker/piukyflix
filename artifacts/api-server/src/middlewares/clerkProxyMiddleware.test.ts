import { test } from "node:test";
import assert from "node:assert/strict";
import { getClerkProxyHost } from "./clerkProxyMiddleware";

test("getClerkProxyHost prefers x-forwarded-host over host", () => {
  assert.equal(
    getClerkProxyHost({ headers: { "x-forwarded-host": "fwd.example.com", host: "origin.example.com" } }),
    "fwd.example.com",
  );
});

test("getClerkProxyHost falls back to the host header", () => {
  assert.equal(
    getClerkProxyHost({ headers: { host: "origin.example.com" } }),
    "origin.example.com",
  );
});

test("getClerkProxyHost takes the leftmost value from a comma list", () => {
  assert.equal(
    getClerkProxyHost({ headers: { "x-forwarded-host": "client.example.com, proxy.example.com" } }),
    "client.example.com",
  );
});

test("getClerkProxyHost handles an array-valued header", () => {
  assert.equal(
    getClerkProxyHost({ headers: { "x-forwarded-host": ["first.example.com", "second.example.com"] } }),
    "first.example.com",
  );
});

test("getClerkProxyHost returns undefined when no host info is present", () => {
  assert.equal(getClerkProxyHost({ headers: {} }), undefined);
});
