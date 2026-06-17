---
name: StreamFlix orval queryKey required
description: Orval-generated hooks require queryKey in query options object
---

Generated hooks like `useGetContent(id, { query: { enabled: true } })` fail TS because `queryKey` is required in the `query` options type.

**Why:** The orval config generates hooks where `queryKey` is a required field in `UseQueryOptions`. Without it TypeScript errors with "Property 'queryKey' is missing".

**How to apply:** Always import the matching `get*QueryKey(params)` helper and pass it: `{ query: { enabled: !!id, queryKey: getGetContentQueryKey(id) } }`.
