---
name: StreamFlix drizzle inArray requirement
description: Why raw ANY() SQL fails in Drizzle ORM and how to fix it
---

Use `inArray(table.col, arrayVar)` from `drizzle-orm` instead of `sql\`${table.col} = ANY(${arr}::int[])\``.

**Why:** Drizzle's template SQL interpolates arrays as `($1, $2, $3)` (a tuple), not `ARRAY[$1, $2, $3]` (a PostgreSQL array literal). `ANY()` requires an array type, so `ANY(($1,$2,$3)::int[])` is invalid SQL and throws at runtime.

**How to apply:** Whenever querying `WHERE col IN (array)`, import `inArray` from `drizzle-orm` and use it.
