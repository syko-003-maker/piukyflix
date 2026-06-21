import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "./rateLimit";

function mockReq(ip: string): any {
  return { headers: { "x-forwarded-for": ip }, socket: {} };
}

function mockRes(): any {
  const res: any = { statusCode: 0, body: undefined, headers: {} as Record<string, string> };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (payload: unknown) => { res.body = payload; return res; };
  res.setHeader = (key: string, value: string) => { res.headers[key] = value; };
  return res;
}

test("rateLimit allows up to max requests then blocks with 429", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 2 });
  let nextCalls = 0;
  const next = () => { nextCalls++; };

  const r1 = mockRes(); limiter(mockReq("1.1.1.1"), r1, next);
  const r2 = mockRes(); limiter(mockReq("1.1.1.1"), r2, next);
  const r3 = mockRes(); limiter(mockReq("1.1.1.1"), r3, next);

  assert.equal(nextCalls, 2);
  assert.equal(r3.statusCode, 429);
  assert.ok(r3.headers["Retry-After"]);
});

test("rateLimit tracks limits independently per IP", () => {
  const limiter = rateLimit({ windowMs: 60_000, max: 1 });
  let nextCalls = 0;
  const next = () => { nextCalls++; };

  const r1 = mockRes(); limiter(mockReq("2.2.2.2"), r1, next);
  const r2 = mockRes(); limiter(mockReq("3.3.3.3"), r2, next);

  assert.equal(nextCalls, 2);
  assert.equal(r1.statusCode, 0);
  assert.equal(r2.statusCode, 0);
});
