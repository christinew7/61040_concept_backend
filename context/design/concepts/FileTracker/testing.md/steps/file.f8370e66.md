---
timestamp: 'Wed Oct 15 2025 17:05:32 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_170532.ac2fc1a9.md]]'
content_id: f8370e66271ebd3b007e0d63ab2825e33b0667b4637578feaa4fe1cc5092df85
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
import { Config, GeminiLLM } from "@utils/gemini-llm.ts";
import process from "node:process";

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
  try {
    const config = require("../config.json");
    return config;
  } catch (error) {
    console.error(
      "❌ Error loading config.json. Please ensure it exists with your API key.",
    );
    console.error("Error details:", (error as Error).message);
    process.exit(1);
  }
}
// actions, startTracking, deleteTracking, jumpTo, next, back, setVisibility, startTracking w/ llm

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  const config = loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);
  

  await client.close();
});

/**
  const [db, client] = await testDb();
  const config = loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);



  await client.close();
 */

```

\[@Likert testing
