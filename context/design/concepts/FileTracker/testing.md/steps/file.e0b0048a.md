---
timestamp: 'Sat Oct 18 2025 10:40:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_104007.233ee4da.md]]'
content_id: e0b0048a8d59c6705e8e852d494a4e0a8d6501a0926983309c899598234ac489
---

# file: src/concepts/FileTracker/FileTrackerConcept.test.ts

```typescript
import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertObjectMatch,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import FileTrackerConcept from "./FileTrackerConcept.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // Assuming this is the interface/class to mock

// --- Mock Gemini LLM ---
class MockGeminiLLM implements GeminiLLM {
  private mockResponse: string = '{"currentIndex": 5}'; // Default successful response
  private shouldThrow: boolean = false;

  setMockResponse(response: string) {
    this.mockResponse = response;
    this.shouldThrow = false;
  }

  setThrowError(shouldThrow: boolean) {
    this.shouldThrow = shouldThrow;
  }

  async executeLLM(prompt: string): Promise<string> {
    if (this.shouldThrow) {
      throw new Error("Simulated LLM network or API error.");
    }
    // In a real scenario, you might inspect the prompt for more complex mocks
    // For now, we'll just return the pre-set mock response.
    return Promise.resolve(this.mockResponse);
  }
}
// --- End Mock Gemini LLM ---

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID; // Added for more distinct test cases

const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items (0-9)
const file2 = "file:FileB" as ID;

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  // Pass a dummy LLM instance, as it's not used in this principle test, but constructor requires it.
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

  await t.step(
    "1. User starts tracking a file",
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
      assertExists(trackedFileDoc, "Tracked file document should exist"); // Corrected variable name from trackedFileaDoc
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
  // Pass a dummy LLM instance, as it's not used in this test, but constructor requires it.
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

  await concept.startTracking({
    owner: userBob,
    file: file1,
    maxIndex: file1MaxIndex,
  });

  await t.step(
    "1. User tries to track an already tracked file",
    async () => {
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
      const file = file2;
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
        { index: 1 },
        "Alice's index for file2 should be 1.",
      );
    },
  );

  await client.close();
});

Deno.test("Action: deleteTracking", async (t) => {
  const [db, client] = await testDb();
  // Pass a dummy LLM instance, as it's not used in this test, but constructor requires it.
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

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

Deno.test("Action: next, back, jumpTo", async (t) => {
  const [db, client] = await testDb();
  // Pass a dummy LLM instance, as it's not used in this test, but constructor requires it.
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

  await t.step(
    "1. User can click next multiple times in a row",
    async () => {
      await concept.startTracking({
        owner: userAlice,
        file: file1,
        maxIndex: file1MaxIndex,
      });

      await concept.next({ owner: userAlice, file: file1 });
      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 1 });

      // hit next again
      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 2 });

      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 3 });
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
      assertObjectMatch(status, { index: 2 });

      // hit back again
      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 1 });

      // hit back again
      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 0 });
    },
  );

  await t.step(
    "3. User cannot hit back if it's on the first item",
    async () => {
      const backResult = await concept.back({ owner: userAlice, file: file1 });
      assertEquals(
        "error" in backResult,
        true,
        "User is on the first item and cannot go any further back",
      );
      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 0 });
    },
  );

  await t.step(
    "3. User cannot hit next if it's on the last item",
    async () => {
      await concept.jumpTo({ owner: userAlice, file: file1, index: 9 });
      const nextResult = await concept.next({ owner: userAlice, file: file1 });
      assertEquals(
        "error" in nextResult,
        true,
        "User is on the last item and cannot go any further",
      );
      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertObjectMatch(status, { index: 9 });
    },
  );

  await t.step("4. User can jump to the same item (no change)", async () => {
    const jumpResult = await concept.jumpTo({
      owner: userAlice,
      file: file1,
      index: 7,
    });
    assertNotEquals(
      "error" in jumpResult,
      true,
      "Jumping to a valid index should succeed",
    );
    let status = await concept._getCurrentItem({
      owner: userAlice,
      file: file1,
    });
    assertObjectMatch(status, { index: 7 });

    const dupJumpResult = await concept.jumpTo({
      owner: userAlice,
      file: file1,
      index: 7,
    });
    assertNotEquals(
      "error" in dupJumpResult,
      true,
      "Jumping to the same valid index should succeed",
    );
    status = await concept._getCurrentItem({
      owner: userAlice,
      file: file1,
    });
    assertObjectMatch(status, { index: 7 });
  });

  await t.step(
    "5. User cannot jump to an invalid index (negative, out of bounds, non-integer)",
    async () => {
      // Current index is 7 from previous step
      const currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      if ("error" in currentStatus) {
        throw new Error(
          `Expected a successful status, but got an error: ${currentStatus.error}`,
        );
      }
      const originalIndex = currentStatus.index;

      // Test negative index
      let jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: -1,
      });
      assertEquals(
        "error" in jumpResult,
        true,
        "Jumping to a negative index should fail.",
      );
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '-1' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate out of bounds for negative index.",
      );
      let status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      if ("error" in status) {
        throw new Error(
          `Expected a successful status, but got an error: ${status.error}`,
        );
      }
      assertEquals(
        status.index,
        originalIndex,
        "Index should not change for invalid jump.",
      );

      // Test index greater than maxIndex
      jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: file1MaxIndex + 1,
      });
      assertEquals(
        "error" in jumpResult,
        true,
        "Jumping to an index > maxIndex should fail.",
      );
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '${
          file1MaxIndex + 1
        }' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate out of bounds for index > maxIndex.",
      );
      status = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      if ("error" in status) {
        throw new Error(
          `Expected a successful status, but got an error: ${status.error}`,
        );
      }
      assertEquals(
        status.index,
        originalIndex,
        "Index should not change for invalid jump.",
      );

      // Test non-integer index
      jumpResult = await concept.jumpTo({
        owner: userAlice,
        file: file1,
        index: 3.5,
      });
      assertEquals(
        "error" in jumpResult,
        true,
        "Jumping to a non-integer index should fail.",
      );
      assertEquals(
        (jumpResult as { error: string }).error,
        `Index '3.5' is out of bounds [0, ${file1MaxIndex}] or not an integer.`,
        "Error message should indicate non-integer index.",
      );
      status = await concept._getCurrentItem({ owner: userAlice, file: file1 });
      if ("error" in status) {
        throw new Error(
          `Expected a successful status, but got an error: ${status.error}`,
        );
      }
      assertEquals(
        status.index,
        originalIndex,
        "Index should not change for invalid jump.",
      );
    },
  );
  await client.close();
});

Deno.test(
  "All navigation and visibility actions fail on a non-existent tracking record",
  async (t) => {
    const [db, client] = await testDb();
    // Pass a dummy LLM instance, as it's not used in this test, but constructor requires it.
    const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

    const userCharlie = "user:Charlie" as ID;
    const nonExistentFile = "file:NonExistent" as ID;
    const nonExistentUser = userCharlie; // Using userCharlie for a fresh, non-existent user scenario

    await t.step("1. Nonexistent user tries to go next", async () => {
      const result = await concept.next({
        owner: nonExistentUser,
        file: nonExistentFile,
      });
      assertEquals(
        "error" in result,
        true,
        "Next on non-existent tracking should fail.",
      );
      assertEquals(
        (result as { error: string }).error,
        `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`,
        "Error message for next on non-existent tracking.",
      );
    });

    await t.step("2. Nonexistent user tries to go back", async () => {
      const result = await concept.back({
        owner: nonExistentUser,
        file: nonExistentFile,
      });
      assertEquals(
        "error" in result,
        true,
        "Back on non-existent tracking should fail.",
      );
      assertEquals(
        (result as { error: string }).error,
        `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`,
        "Error message for back on non-existent tracking.",
      );
    });

    await t.step("3. Nonexistent user tries to jumpTo", async () => {
      const result = await concept.jumpTo({
        owner: nonExistentUser,
        file: nonExistentFile,
        index: 0,
      });
      assertEquals(
        "error" in result,
        true,
        "JumpTo on non-existent tracking should fail.",
      );
      assertEquals(
        (result as { error: string }).error,
        `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`,
        "Error message for jumpTo on non-existent tracking.",
      );
    });

    await t.step("4. Nonexistent user tries to change visibility", async () => {
      const result = await concept.setVisibility({
        owner: nonExistentUser,
        file: nonExistentFile,
        visible: true,
      });
      assertEquals(
        "error" in result,
        true,
        "SetVisibility on non-existent tracking should fail.",
      );
      assertEquals(
        (result as { error: string }).error,
        `No tracking found for owner '${nonExistentUser}' and file '${nonExistentFile}'.`,
        "Error message for setVisibility on non-existent tracking.",
      );
    });
    await client.close();
  },
);

Deno.test("Action: setVisibility", async (t) => {
  const [db, client] = await testDb();
  // Pass a dummy LLM instance, as it's not used in this test, but constructor requires it.
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); 

  const result = await concept.startTracking({
    owner: userAlice,
    file: file1,
    maxIndex: file1MaxIndex,
  });

  const trackedFileId = (result as { id: ID }).id;

  const doc = await db.collection("FileTracker.trackedFiles").findOne({
    _id: trackedFileId,
  });
  assertExists(doc, "Tracked file document must exist.");
  assertEquals(doc.isVisible, true, "isVisible should be true initially.");

  await t.step(
    "1. Set visibility to true when already true (no change, no error)",
    async () => {
      // It's already true from the previous step
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: true,
      });
      assertNotEquals(
        "error" in setResult,
        true,
        "Setting to true when already true should not error.",
      );

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist.");
      assertEquals(doc.isVisible, true, "isVisible should remain true.");
    },
  );

  await t.step(
    "2. Set visibility to false when already false (no change, no error)",
    async () => {
      // First, set it to false
      await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: false,
      });

      // Then, try setting it to false again
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: false,
      });
      assertNotEquals(
        "error" in setResult,
        true,
        "Setting to false when already false should not error.",
      );

      const doc = await db.collection("FileTracker.trackedFiles").findOne({
        _id: trackedFileId,
      });
      assertExists(doc, "Tracked file document must exist.");
      assertEquals(doc.isVisible, false, "isVisible should remain false.");
    },
  );

  await t.step(
    ". Attempt to set visibility with an invalid (non-boolean) 'visible' parameter",
    async () => {
      // Use 'any' to bypass TypeScript's static type checking for this specific test
      const invalidVisibleValue = "true" as any; // String "true" instead of boolean true
      const setResult = await concept.setVisibility({
        owner: userAlice,
        file: file1,
        visible: invalidVisibleValue,
      });
      assertEquals(
        "error" in setResult,
        true,
        "Setting visibility with a non-boolean value should return an error.",
      );
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
      assertEquals(
        doc.isVisible,
        false,
        "isVisible should not have changed due to invalid input.",
      );
    },
  );

  await client.close();
});

Deno.test("Action: startTrackingUsingLLM", async (t) => {
  const [db, client] = await testDb();
  const mockLLM = new MockGeminiLLM();
  const concept = new FileTrackerConcept(db, mockLLM); // Pass the mock LLM

  const fileToTrackLLM = "file:LLMFile" as ID;
  const fileMaxIndexLLM = 20; // Example max index (0-20, so 21 items)
  const fileInputContent = [
    "Line 0: Title",
    "Line 1: Materials:",
    "Line 2: Yarn A",
    "Line 3: Hook B",
    "Line 4: Notes:",
    "Line 5: This is a note.",
    "Line 6: Instructions:",
    "Line 7: 1. Ch 10", // The LLM is expected to pick this or a subsequent one
    "Line 8: 2. Sc in 2nd ch from hook",
    "Line 9: 3. Turn",
    // ... more lines up to fileMaxIndexLLM + 1 items
    Array(fileMaxIndexLLM - 9).fill("Line X: Filler instruction..."), // Fill up to max index
  ].flat();
  const fileInputString = JSON.stringify(fileInputContent);

  await t.step(
    "1. Successfully start tracking a new file using LLM to determine current index",
    async () => {
      // Configure LLM to return a specific index within the valid range
      const expectedLLMIndex = 7;
      mockLLM.setMockResponse(`{"currentIndex": ${expectedLLMIndex}}`);

      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        fileId: fileToTrackLLM,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });

      assertNotEquals("error" in result, true, `Expected no error, but got: ${JSON.stringify(result)}`);
      const trackingId = (result as { id: ID }).id;
      assertExists(trackingId, "Expected a tracking ID on success.");

      // Verify effects: a new TrackedFile exists with the LLM-determined currentIndex
      const trackedFileDoc = await db.collection("FileTracker.trackedFiles").findOne({ _id: trackingId });
      assertExists(trackedFileDoc, "Tracked file document should exist.");
      assertEquals(trackedFileDoc.owner, userAlice);
      assertEquals(trackedFileDoc.file, fileToTrackLLM);
      assertEquals(trackedFileDoc.currentIndex, expectedLLMIndex, "Current index should match LLM output.");
      assertEquals(trackedFileDoc.maxIndex, fileMaxIndexLLM);
      assertEquals(trackedFileDoc.isVisible, true, "isVisible should be true by default.");
    },
  );

  await t.step(
    "2. Fail to start tracking if `fileInput` is not a valid JSON stringified array of strings",
    async () => {
      // Use distinct file IDs for each test case to avoid "already exists" errors
      const untrackedFileId1 = "file:LLMInvalidInput1" as ID;
      const untrackedFileId2 = "file:LLMInvalidInput2" as ID;
      const untrackedFileId3 = "file:LLMInvalidInput3" as ID;
      const untrackedMaxIndex = 10;

      // Test with non-JSON string
      let result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: untrackedFileId1,
        fileInput: "this is not json",
        fileMaxIndex: untrackedMaxIndex,
      });
      assertEquals("error" in result, true, "Should fail for non-JSON fileInput.");
      assertExists((result as { error: string }).error.includes("Invalid fileContentString"), "Error message should indicate invalid JSON.");

      // Test with JSON but not an array
      result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: untrackedFileId2,
        fileInput: '{"key": "value"}',
        fileMaxIndex: untrackedMaxIndex,
      });
      assertEquals("error" in result, true, "Should fail for JSON that is not an array.");
      assertExists((result as { error: string }).error.includes("fileContentString must be a JSON stringified array of strings."), "Error message should indicate not an array.");

      // Test with JSON array but not of strings
      result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: untrackedFileId3,
        fileInput: '[1, 2, 3]',
        fileMaxIndex: untrackedMaxIndex,
      });
      assertEquals("error" in result, true, "Should fail for JSON array not of strings.");
      assertExists((result as { error: string }).error.includes("fileContentString must be a JSON stringified array of strings."), "Error message should indicate not an array of strings.");
    },
  );

  await t.step(
    "3. Fail to start tracking if `maxIndex` is inconsistent with `fileInput` length",
    async () => {
      const inconsistentFileId1 = "file:LLMInconsistentMaxIndex1" as ID;
      const inconsistentFileId2 = "file:LLMInconsistentMaxIndex2" as ID;
      const inconsistentFileId3 = "file:LLMInconsistentMaxIndex3" as ID;

      const smallContent = ["line1", "line2", "line3"]; // Length 3
      const smallContentString = JSON.stringify(smallContent);

      // maxIndex = 2 (correct for 3 items, 0-indexed) - should succeed
      let result = await concept.startTrackingUsingLLM({
        owner: userCharlie,
        fileId: inconsistentFileId1,
        fileInput: smallContentString,
        fileMaxIndex: 2,
      });
      assertNotEquals("error" in result, true, `Should succeed with consistent maxIndex: ${JSON.stringify(result)}`);

      // maxIndex = 5 (inconsistent with 3 items) - should fail
      result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        fileId: inconsistentFileId2,
        fileInput: smallContentString,
        fileMaxIndex: 5,
      });
      assertEquals("error" in result, true, "Should fail if maxIndex is inconsistent with fileInput length.");
      assertExists((result as { error: string }).error.includes("maxIndex 5 is inconsistent with file content length 3 (expected 2)"), "Error message should detail inconsistency.");

      // empty content, maxIndex is not -1 (should fail)
      const emptyContentString = JSON.stringify([]);
      result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        fileId: inconsistentFileId3,
        fileInput: emptyContentString,
        fileMaxIndex: 0, // Should be -1 for empty content
      });
      assertEquals("error" in result, true, "Should fail if empty content has maxIndex > -1.");
      assertExists((result as { error: string }).error.includes("maxIndex 0 is inconsistent with empty file content."), "Error message should detail inconsistency for empty file.");

      // empty content, maxIndex is -1 (should succeed)
      result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: "file:LLMEmptyContentConsistent" as ID,
        fileInput: emptyContentString,
        fileMaxIndex: -1,
      });
      assertNotEquals("error" in result, true, `Should succeed if empty content has maxIndex -1: ${JSON.stringify(result)}`);
    },
  );

  await t.step(
    "4. Fail to start tracking if tracking already exists for owner and file",
    async () => {
      // We already tracked fileToTrackLLM for userAlice in step 1.
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        fileId: fileToTrackLLM,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if tracking already exists.");
      assertEquals((result as { error: string }).error, `Tracking already exists for owner '${userAlice}' and file '${fileToTrackLLM}'.`);
    },
  );

  await t.step(
    "5. Fail gracefully if LLM returns malformed response or an invalid index",
    async () => {
      const llmErrorFile = "file:LLMErrorFile" as ID;
      const llmMalformedFile = "file:LLMMalformedFile" as ID;
      const llmInvalidIndexFile = "file:LLMInvalidIndexFile" as ID;
      const llmMissingIndexFile = "file:LLMMissingIndexFile" as ID;
      const llmNonIntegerIndexFile = "file:LLMNonIntegerIndexFile" as ID;

      // LLM throws an error (e.g., API timeout, internal LLM error)
      mockLLM.setThrowError(true);
      let result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: llmErrorFile,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if LLM throws an error.");
      assertExists((result as { error: string }).error.includes("Failed to start tracking with LLM: Simulated LLM network or API error."));
      mockLLM.setThrowError(false); // Reset for subsequent tests

      // LLM returns malformed JSON (not parsable)
      mockLLM.setMockResponse("this is not json from LLM");
      result = await concept.startTrackingUsingLLM({
        owner: userCharlie,
        fileId: llmMalformedFile,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if LLM returns malformed JSON.");
      assertExists((result as { error: string }).error.includes("No JSON found in response"));


      // LLM returns valid JSON but currentIndex is out of bounds (too high)
      const tooHighLLMIndex = fileMaxIndexLLM + 1;
      mockLLM.setMockResponse(`{"currentIndex": ${tooHighLLMIndex}}`);
      result = await concept.startTrackingUsingLLM({
        owner: userBob,
        fileId: llmInvalidIndexFile,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if LLM returns an out-of-bounds index.");
      assertExists((result as { error: string }).error.includes(`currentIndex ${tooHighLLMIndex} is out of bounds [0, ${fileMaxIndexLLM}].`), "Error message should indicate out of bounds.");

      // LLM returns valid JSON but `currentIndex` is missing
      mockLLM.setMockResponse(`{"someOtherField": 10}`);
      result = await concept.startTrackingUsingLLM({
        owner: userCharlie,
        fileId: llmMissingIndexFile,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if LLM response JSON is missing `currentIndex`.");
      assertExists((result as { error: string }).error.includes("Invalid response, there is no currentIndex passed in."));

      // LLM returns valid JSON but `currentIndex` is not an integer
      mockLLM.setMockResponse(`{"currentIndex": 7.5}`);
      result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        fileId: llmNonIntegerIndexFile,
        fileInput: fileInputString,
        fileMaxIndex: fileMaxIndexLLM,
      });
      assertEquals("error" in result, true, "Should fail if LLM response JSON has non-integer `currentIndex`.");
      assertExists((result as { error: string }).error.includes("currentIndex 7.5 is not a valid integer."));
    },
  );


  await client.close();
});
```
