---
timestamp: 'Wed Oct 15 2025 17:02:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_170245.eaf04b6d.md]]'
content_id: 1e9c71eb034427a848986ff0ebcd2dda7ced43fd282b1ce6fb20abdd2cf8180a
---

# file: src/concepts/FileTracker/FileTrackerConcept.test.ts

```typescript
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import FileTrackerConcept from "./FileTrackerConcept.ts";


// actions, startTracking, deleteTracking, jumpTo, next, back, setVisibility, startTracking w/ llm

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  const concept = new FileTrackerConcept(db);

  await client.close();
});

/**
  const [db, client] = await testDb();
  const concept = new FileTrackerConcept(db);



  await client.close();
 */

```

\[@Likert testing
