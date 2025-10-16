---
timestamp: 'Wed Oct 15 2025 19:08:56 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_190856.73283f11.md]]'
content_id: aa848429ed7479dbf32a4f5b662a416467427cdb33b02f4a9ff9645e109d1e91
---

# response:

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
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID; // Added for more distinct user testing

const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items (indices 0-9)
const file2 = "file:FileB" as ID; // Used in `startTracking` tests

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

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

      // Also verify isVisible default
      const trackedFileDoc = await db.collection("FileTracker.trackedFiles")
        .findOne({ _id: trackingId });
      assertExists(trackedFileDoc, "Tracked file document should exist in DB");
      assertEquals(
        trackedFileDoc.isVisible,
        true,
        "isVisible should be true by default",
      );
    },
  );

  await t.step(
    "2. User moves sequentially through file items (next and back)",
    async () => {
      const nextResult = await concept.next({ owner: userAlice, file: file1 });
      assertNotEquals(
        "error" in nextResult,
        true,
        "User should be able to move forward",
      );
      let currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(
        currentStatus,
        { index: 1 },
        "Current index should be 1 after one 'next'",
      );

      // Action: back
      const backResult = await concept.back({ owner: userAlice, file: file1 });
      assertNotEquals(
        "error" in backResult,
        true,
        "User should be able to move backwards",
      );
      currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(
        currentStatus,
        { index: 0 },
        "Current index should be 0 after one 'back'", // Corrected expected index
      );
    },
  );

  await t.step("3. User skips to a specific file item (jumpTo)", async () => {
    // Action: jumpTo
    const targetIndex = 7;
    const jumpResult = await concept.jumpTo({
      owner: userAlice,
      file: file1,
      index: targetIndex,
    });
    assertNotEquals(
      "error" in jumpResult,
      true,
      "Should be able to jump to a valid index",
    );

    // Effect: Verify currentIndex is updated to the target index
    const currentStatus = await concept._getCurrentItem({
      owner: userAlice,
      file: file1,
    });
    assertObjectMatch(
      currentStatus,
      { index: targetIndex },
      `Current index should be ${targetIndex} after 'jumpTo'`,
    );
  });

  await t.step(
    "4. User controls how their progress is displayed (setVisibility)",
    async () => {
      // Action: setVisibility (false)
      let setVisibilityResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: false,
      });
      assertNotEquals(
        "error" in setVisibilityResult,
        true,
        "You're always able to toggle visibility!",
      );

      // Effect: Verify isVisible status is false
      let trackedFileDoc = await db.collection("FileTracker.trackedFiles")
        .findOne({ owner: userAlice, file: file1 });
      assertExists(trackedFileDoc, "Tracked file document should exist");
      assertEquals(
        trackedFileDoc.isVisible,
        false,
        "isVisible should be false after setting visibility to false",
      );

      // Action: setVisibility (true)
      setVisibilityResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: true,
      });
      assertNotEquals(
        "error" in setVisibilityResult,
        true,
        "You're always able to toggle visibility!",
      );

      // Effect: Verify isVisible status is true
      trackedFileDoc = await db.collection("FileTracker.trackedFiles").findOne({
        owner: userAlice,
        file: file1,
      });
      assertExists(trackedFileDoc, "Tracked file document should exist");
      assertEquals(
        trackedFileDoc.isVisible,
        true,
        "isVisible should be true after setting visibility to true",
      );
    },
  );
  await client.close();
});

Deno.test("Action: startTracking", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  await concept.startTracking({
    owner: userBob,
    file: file1, // Bob tracks FileA
    maxIndex: file1MaxIndex,
  });

  await t.step(
    "1. User tries to track an already tracked file",
    async () => {
      // Alice tracks FileA (initial tracking)
      const initialTrackingResult = await concept.startTracking({
        owner: userAlice,
        file: file1,
        maxIndex: file1MaxIndex,
      });
      assertNotEquals(
        "error" in initialTrackingResult,
        true,
        "Initial tracking should succeed.",
      );

      // Alice tries to track FileA again (duplicate)
      const duplicateTrackingResult = await concept.startTracking({
        owner: userAlice,
        file: file1,
        maxIndex: file1MaxIndex,
      });
      assertEquals(
        "error" in duplicateTrackingResult,
        true,
        "Tracking an already tracked file for the same user should return an error.",
      );
      assertEquals(
        (duplicateTrackingResult as { error: string }).error,
        `Tracking already exists for owner '${userAlice}' and file '${file1}'.`,
        "Error message should indicate duplicate tracking.",
      );
    },
  );

  await t.step(
    "2. Multiple users can track the same file (succeeds)",
    async () => {
      const file = file2; // FileB
      const maxIndex = 10;

      // Alice tracks FileB
      const aliceTrackingResult = await concept.startTracking({
        owner: userAlice,
        file,
        maxIndex,
      });
      assertNotEquals(
        "error" in aliceTrackingResult,
        true,
        "Alice should be able to track FileB.",
      );
      const aliceTrackingId = (aliceTrackingResult as { id: ID }).id;
      assertExists(aliceTrackingId);

      // Bob tracks FileB
      const bobTrackingResult = await concept.startTracking({
        owner: userBob,
        file,
        maxIndex,
      });
      assertNotEquals(
        "error" in bobTrackingResult,
        true,
        "Bob should be able to track FileB.",
      );
      const bobTrackingId = (bobTrackingResult as { id: ID }).id;
      assertExists(bobTrackingId);

      assertNotEquals(
        aliceTrackingId,
        bobTrackingId,
        "Tracking IDs for different users should be distinct.",
      );

      // Verify separate tracking states
      let aliceStatus = await concept._getCurrentItem({
        owner: userAlice,
        file,
      });
      assertObjectMatch(
        aliceStatus,
        { index: 0 },
        "Alice's index should be 0.",
      );
      let bobStatus = await concept._getCurrentItem({ owner: userBob, file });
      assertObjectMatch(bobStatus, { index: 0 }, "Bob's index should be 0.");

      // Alice iterates through to make sure it's not tracking the same index
      await concept.next({ owner: userAlice, file });
      aliceStatus = await concept._getCurrentItem({
        owner: userAlice,
        file,
      });
      assertObjectMatch(
        aliceStatus,
        { index: 1 },
        "Alice's index should be 1.",
      );
      bobStatus = await concept._getCurrentItem({ owner: userBob, file });
      assertObjectMatch(bobStatus, { index: 0 }, "Bob's index should be 0.");
    },
  );

  await t.step(
    "3. One user can track multiple distinct files (succeeds)",
    async () => {
      const file3 = "file:FileC" as ID;
      const aliceTrackingResult = await concept.startTracking({
        owner: userAlice,
        file: file3,
        maxIndex: 10,
      });
      assertNotEquals(
        "error" in aliceTrackingResult,
        true,
        "Alice should be able to track file3.",
      );
      const aliceTrackingId = (aliceTrackingResult as { id: ID }).id;
      assertExists(aliceTrackingId);

      const file3Status = await concept._getCurrentItem({
        owner: userAlice,
        file: file3,
      });
      const file2Status = await concept._getCurrentItem({
        owner: userAlice,
        file: file2,
      });
      assertObjectMatch(
        file3Status,
        { index: 0 },
        "Alice's index for file3 should be 0.",
      );
      assertObjectMatch(
        file2Status,
        { index: 1 }, // This was incremented in the previous step
        "Alice's index for file2 should be 1.",
      );
    },
  );

  await client.close();
});

Deno.test("Action: deleteTracking", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  const file = "file:Deletable" as ID;
  const maxIndex = 5;

  await t.step("1. Delete an existing tracking record", async () => {
    await concept.startTracking({ owner: userAlice, file, maxIndex });
    const result = await concept.deleteTracking({ owner: userAlice, file });
    assertNotEquals(
      "error" in result,
      true,
      "Deleting an existing tracking should succeed.",
    );

    const check = await db.collection("FileTracker.trackedFiles").findOne({
      owner: userAlice,
      file,
    });
    assertEquals(
      check,
      null,
      "The tracking record should be deleted from the database.",
    );

    const getFileResult = await concept._getCurrentItem({
      owner: userAlice,
      file,
    });
    assertEquals(
      "error" in getFileResult,
      true,
      "You cannot get the file if it's already deleted",
    );
  });

  await t.step(
    "2. Try to delete a non-existent tracking record (fails)",
    async () => {
      const result = await concept.deleteTracking({ owner: userBob, file }); // Bob never tracked this file
      assertEquals(
        "error" in result,
        true,
        "Deleting a non-existent tracking should fail.",
      );
      assertEquals(
        (result as { error: string }).error,
        `No tracking found for owner '${userBob}' and file '${file}'.`,
        "Error message should match the implementation.",
      );
    },
  );

  await client.close();
});

Deno.test("Action: next, back, jumpTo, and setVisibility edge cases", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  // Initial setup for the entire test block: Alice starts tracking file1
  await concept.startTracking({
    owner: userAlice,
    file: file1,
    maxIndex: file1MaxIndex,
  });

  await t.step(
    "1. User can click next multiple times in a row",
    async () => {
      // Current index should be 0 from initial setup
      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 0, "Initial index should be 0.");

      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 1, "Index should be 1 after first 'next'.");

      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 2, "Index should be 2 after second 'next'.");

      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 3, "Index should be 3 after third 'next'.");
    },
  );

  await t.step(
    "2. User can click back multiple times in a row",
    async () => {
      await concept.back({ owner: userAlice, file: file1 });
      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 2, "Index should be 2 after first 'back'.");

      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 1, "Index should be 1 after second 'back'.");

      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 0, "Index should be 0 after third 'back'.");
    },
  );

  await t.step(
    "3. User cannot hit back if it's on the first item (index 0)",
    async () => {
      // Current index is 0 from previous step
      const backResult = await concept.back({ owner: userAlice, file: file1 });
      assertEquals(
        "error" in backResult,
        true,
        "Should return error when trying to move back from index 0.",
      );
      assertEquals(
        (backResult as { error: string }).error,
        `Current index 0 is already at or below 0. Cannot move back.`,
        "Error message should indicate inability to move back from 0.",
      );
      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, 0, "Index should remain 0 after failed 'back'.");
    },
  );

  await t.step(
    "4. User cannot hit next if it's on the last item (maxIndex)",
    async () => {
      // First, jump to the maxIndex to set up this scenario
      const jumpToMaxResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: file1MaxIndex,
      });
      assertNotEquals("error" in jumpToMaxResult, true, "Jumping to maxIndex should succeed.");

      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, file1MaxIndex, `Index should be at maxIndex (${file1MaxIndex}).`);

      // Now try to go next
      const nextResult = await concept.next({ owner: userAlice, file: file1 });
      assertEquals(
        "error" in nextResult,
        true,
        "Should return error when trying to move next from maxIndex.",
      );
      assertEquals(
        (nextResult as { error: string }).error,
        `Current index ${file1MaxIndex} is already at or beyond max index ${file1MaxIndex}. Cannot move next.`,
        "Error message should indicate inability to move next from maxIndex.",
      );
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, file1MaxIndex, "Index should remain at maxIndex after failed 'next'.");
    },
  );

  await t.step(
    "5. User can jump to any valid item, including the same item or maxIndex",
    async () => {
      // Jump to an intermediate index
      let targetIndex = 5;
      let jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: targetIndex,
      });
      assertNotEquals("error" in jumpResult, true, "Jumping to a valid intermediate index should succeed.");
      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, targetIndex, `Index should be ${targetIndex} after jump.`);

      // Jump to the same item (should succeed, no change)
      jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: targetIndex,
      });
      assertNotEquals("error" in jumpResult, true, "Jumping to the same valid index should succeed.");
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, targetIndex, `Index should still be ${targetIndex} after jumping to the same index.`);

      // Jump to maxIndex (already covered in step 4 setup, but explicitly test here for completeness)
      jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: file1MaxIndex,
      });
      assertNotEquals("error" in jumpResult, true, "Jumping to maxIndex should succeed.");
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals(status.index, file1MaxIndex, `Index should be ${file1MaxIndex} after jumping to maxIndex.`);
    },
  );

  await t.step(
    "6. User cannot jump to an invalid index (negative, out of bounds, non-integer)",
    async () => {
      // Current index is file1MaxIndex from previous step (5)
      const currentStatus = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      const originalIndex = currentStatus.index;

      // Test negative index
      let jumpResult = await concept.jumpTo({ owner: userAlice, file: file1, index: -1 });
      assertEquals("error" in jumpResult, true, "Jumping to a negative index should fail.");
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '-1' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate out of bounds for negative index.",
      );
      let status = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      assertEquals(status.index, originalIndex, "Index should not change for invalid jump.");

      // Test index greater than maxIndex
      jumpResult = await concept.jumpTo({ owner: userAlice, file: file1, index: file1MaxIndex + 1 });
      assertEquals("error" in jumpResult, true, "Jumping to an index > maxIndex should fail.");
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '${file1MaxIndex + 1}' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate out of bounds for index > maxIndex.",
      );
      status = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      assertEquals(status.index, originalIndex, "Index should not change for invalid jump.");

      // Test non-integer index
      jumpResult = await concept.jumpTo({ owner: userAlice, file: file1, index: 3.5 });
      assertEquals("error" in jumpResult, true, "Jumping to a non-integer index should fail.");
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '3.5' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate non-integer index.",
      );
      status = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      assertEquals(status.index, originalIndex, "Index should not change for invalid jump.");
    },
  );

  await t.step(
    "7. All navigation and visibility actions fail on a non-existent tracking record",
    async () => {
      const nonExistentFile = "file:NonExistent" as ID;
      const nonExistentUser = userCharlie; // Using userCharlie for a fresh, non-existent user scenario

      let result = await concept.next({ owner: nonExistentUser, file: nonExistentFile });
      assertEquals("error" in result, true, "Next on non-existent tracking should fail.");
      assertEquals((result as { error: string }).error, `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`, "Error message for next on non-existent tracking.");

      result = await concept.back({ owner: nonExistentUser, file: nonExistentFile });
      assertEquals("error" in result, true, "Back on non-existent tracking should fail.");
      assertEquals((result as { error: string }).error, `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`, "Error message for back on non-existent tracking.");

      result = await concept.jumpTo({ owner: nonExistentUser, file: nonExistentFile, index: 0 });
      assertEquals("error" in result, true, "JumpTo on non-existent tracking should fail.");
      assertEquals((result as { error: string }).error, `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`, "Error message for jumpTo on non-existent tracking.");

      result = await concept.setVisibility({ owner: nonExistentUser, file: nonExistentFile, visible: true });
      assertEquals("error" in result, true, "SetVisibility on non-existent tracking should fail.");
      assertEquals((result as { error: string }).error, `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`, "Error message for setVisibility on non-existent tracking.");
    },
  );

  await client.close();
});

Deno.test("Action: startTrackingUsingLLM (integration with LLM)", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  if (!config.apiKey) {
    console.warn("Skipping LLM tests: GEMINI_API_KEY not found in config.json or empty.");
    await client.close();
    return;
  }

  const fileCrochetPattern = "file:CrochetPattern" as ID;
  const crochetItems = [
    "Crochet Pattern: Amigurumi Cat",
    "by Jane Doe",
    "",
    "Materials:",
    " - Yarn (Worsted Weight, White, Black, Pink)",
    " - 3.0mm Crochet Hook",
    " - Safety Eyes (9mm)",
    " - Tapestry Needle",
    " - Stuffing",
    "",
    "Stitch Abbreviations:",
    "ch: chain",
    "sc: single crochet",
    "inc: increase",
    "dec: decrease",
    "sl st: slip stitch",
    "FLO: front loop only",
    "BLO: back loop only",
    "",
    "Finished Size: Approximately 6 inches tall",
    "Gauge: Not critical for this project",
    "",
    "Notes:",
    " - Work in continuous rounds unless otherwise stated.",
    " - Use a stitch marker to keep track of the beginning of the round.",
    " - Stuff firmly as you go.",
    "",
    "Head:",
    "Rnd 1: Make a magic ring, 6 sc in ring. (6)",
    "Rnd 2: [inc] x 6. (12)",
    "Rnd 3: [sc, inc] x 6. (18)",
    "Rnd 4: [2 sc, inc] x 6. (24)",
    "Rnd 5: [3 sc, inc] x 6. (30)",
    "Rnd 6-10: Sc around. (30) (5 rounds)",
    "Rnd 11: [3 sc, dec] x 6. (24)",
    "Rnd 12: [2 sc, dec] x 6. (18)",
    "Rnd 13: [sc, dec] x 6. (12)",
    "Rnd 14: [dec] x 6. (6)",
    "Fasten off, leave a long tail for sewing.",
    "",
    "Body:",
    "Rnd 1: Make a magic ring, 6 sc in ring. (6)",
    "Rnd 2: [inc] x 6. (12)",
    "Rnd 3: [sc, inc] x 6. (18)",
    "Rnd 4: [2 sc, inc] x 6. (24)",
    "Rnd 5-8: Sc around. (24) (4 rounds)",
    "Rnd 9: [2 sc, dec] x 6. (18)",
    "Rnd 10: [sc, dec] x 6. (12)",
    "Fasten off, leave a long tail for sewing."
  ];

  await t.step(
    "1. Successfully start tracking using LLM for a new file",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: { id: fileCrochetPattern, items: crochetItems },
      });

      assertNotEquals("error" in result, true, "LLM tracking should succeed.");
      const { id: trackedId } = result as { id: ID };
      assertExists(trackedId, "Expected a tracked file ID.");

      const trackedDoc = await db.collection("FileTracker.trackedFiles").findOne({ _id: trackedId });
      assertExists(trackedDoc, "Tracked file document should exist in DB.");

      // Verify currentIndex is set by LLM (expecting it to be around the "Head" or "Body" section)
      // The prompt asks for "the index at the first instruction of the main pattern section."
      // "Head" instruction "Rnd 1: Make a magic ring, 6 sc in ring. (6)" is at index 27.
      const expectedIndex = 27;
      assertEquals(trackedDoc.currentIndex, expectedIndex, `LLM-determined currentIndex should be around ${expectedIndex}.`);
      assertEquals(trackedDoc.maxIndex, crochetItems.length - 1, "maxIndex should be the actual last index of the file.");
      assertEquals(trackedDoc.isVisible, true, "isVisible should be true by default.");
    },
  );

  await t.step(
    "2. Fail to start tracking using LLM if tracking already exists",
    async () => {
      // Trying to track the same file for the same user again
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: { id: fileCrochetPattern, items: crochetItems },
      });

      assertEquals("error" in result, true, "Should fail if tracking already exists for the user and file.");
      assertEquals(
        (result as { error: string }).error,
        `Tracking already exists for owner '${userAlice}' and file '${fileCrochetPattern}'.`,
        "Error message should indicate duplicate tracking.",
      );
    },
  );

  await t.step(
    "3. Fail to start tracking using LLM with empty file content",
    async () => {
      const emptyFileId = "file:Empty" as ID;
      const result = await concept.startTrackingUsingLLM({
        owner: userBob,
        file: { id: emptyFileId, items: [] },
      });

      assertEquals("error" in result, true, "Should fail with empty file content.");
      assertEquals(
        (result as { error: string }).error,
        `File content (items) is empty or invalid for file '${emptyFileId}'.`,
        "Error message should indicate empty file content.",
      );
    },
  );

  await client.close();
});
```
