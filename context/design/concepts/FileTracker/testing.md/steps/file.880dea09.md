---
timestamp: 'Wed Oct 15 2025 17:15:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_171554.a8153b25.md]]'
content_id: 880dea0969ea752f528c42dd3ec5fa754e0d48a3930f88d4029eccf80b5edf34
---

# file: src/concepts/FileTracker/FileTrackerConcept.test.ts

```typescript
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
  assertObjectMatch,
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
    const config = require("../../../config.json");
    return config;
  } catch (error) {
    console.error(
      "❌ Error loading config.json. Please ensure it exists with your API key.",
    );
    console.error("Error details:", (error as Error).message);
    process.exit(1);
  }
}

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;

// actions, startTracking, deleteTracking, jumpTo, next, back, setVisibility, startTracking w/ llm

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  const config = loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  const file1 = "file:FileA" as ID;
  const file1MaxIndex = 9; // 10 items

  await t.step(
    "1. User starts tracking a file normally (without LLM)",
    async () => {
      const result = await concept.startTracking({
        owner: userAlice,
        file: file1,
        maxIndex: file1MaxIndex,
      });
      assertNotEquals(
        "error" in result,
        true,
        "There should be no error tracking a new file",
      );
      const trackingId = (result as { id: ID }).id;
      assertExists(trackingId, "Expected to start tracking file successfully");

      // verify initial state (currentIndex = 0, isVisible= true)
      const currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertExists(currentStatus, "Expected to retrieve tracking status");
      assertObjectMatch(
        currentStatus,
        { index: 0 },
        "Current index should be 0 initially after startTracking",
      );
    },
  );
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
