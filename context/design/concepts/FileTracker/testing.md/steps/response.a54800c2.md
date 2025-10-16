---
timestamp: 'Wed Oct 15 2025 19:33:17 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_193317.8e39972f.md]]'
content_id: a54800c25d3206839c99acfd3e9f69825280ade30195144081c3f335a7849d78
---

# response:

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import FileTrackerConcept from "./FileTrackerConcept.ts";
import { Config, GeminiLLM } from "@utils/gemini-llm.ts";

/**
 * Load configuration from config.json
 */
async function loadConfig(): Promise<Config> {
  try {
    const config = JSON.parse(await Deno.readTextFile("config.json"));
    return config;
  } catch (error) {
    console.error(
      "❌ Error loading config.json. Please ensure it exists with your API key.",
    );
    console.error("Error details:", (error as Error).message);
    throw error;
  }
}

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items (0-9)

Deno.test("Action: setVisibility", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  let trackedFileId: ID;

  // Setup: Start tracking a file for Alice
  await t.step("Setup: Start tracking a file", async () => {
    const result = await concept.startTracking({
      owner: userAlice,
      file: file1,
      maxIndex: file1MaxIndex,
    });
    assertNotEquals("error" in result, true, "Initial tracking should succeed.");
    trackedFileId = (result as { id: ID }).id;

    const doc = await db.collection("FileTracker.trackedFiles").findOne({
      _id: trackedFileId,
    });
    assertExists(doc, "Tracked file document must exist.");
    assertEquals(doc.isVisible, true, "isVisible should be true initially.");
  });

  await t.step(
    "1. Successfully set visibility to false",
    async () => {
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: false,
      });
      assertNotEquals("error" in setResult, true, "Should be able to set visibility to false.");

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist after update.");
      assertEquals(doc.isVisible, false, "isVisible should now be false.");
    },
  );

  await t.step(
    "2. Successfully set visibility to true",
    async () => {
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: true,
      });
      assertNotEquals("error" in setResult, true, "Should be able to set visibility to true.");

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist after update.");
      assertEquals(doc.isVisible, true, "isVisible should now be true.");
    },
  );

  await t.step(
    "3. Set visibility to true when already true (no change, no error)",
    async () => {
      // It's already true from the previous step
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: true,
      });
      assertNotEquals("error" in setResult, true, "Setting to true when already true should not error.");

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist.");
      assertEquals(doc.isVisible, true, "isVisible should remain true.");
    },
  );

  await t.step(
    "4. Set visibility to false when already false (no change, no error)",
    async () => {
      // First, set it to false
      await concept.setVisibility({ owner: userAlice, file: file1, visible: false });

      // Then, try setting it to false again
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: false,
      });
      assertNotEquals("error" in setResult, true, "Setting to false when already false should not error.");

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist.");
      assertEquals(doc.isVisible, false, "isVisible should remain false.");
    },
  );

  await t.step(
    "5. Attempt to set visibility with an invalid (non-boolean) 'visible' parameter",
    async () => {
      // Use 'any' to bypass TypeScript's static type checking for this specific test
      const invalidVisibleValue = "true" as any; // String "true" instead of boolean true
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: invalidVisibleValue,
      });

      assertEquals("error" in setResult, true, "Setting visibility with a non-boolean value should return an error.");
      assertEquals(
        (setResult as { error: string }).error,
        `Invalid visible value: ${invalidVisibleValue}. Must be a boolean.`,
        "Error message should indicate invalid boolean type.",
      );

      // Verify that the state has not changed (it was false from the previous step)
      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist.");
      assertEquals(doc.isVisible, false, "isVisible should not have changed due to invalid input.");
    },
  );

  await client.close();
});

// The scenario for "Attempting to set visibility for a non-existent tracking record"
// is already covered in the existing test block:
// "All navigation and visibility actions fail on a non-existent tracking record"
// under the step: "4. Nonexistent user tries to change visibility".
// This ensures that attempting setVisibility on a non-existent record correctly
// returns an error.
```
