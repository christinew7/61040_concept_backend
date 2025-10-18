---
timestamp: 'Sat Oct 18 2025 10:37:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_103745.da2ff953.md]]'
content_id: 524598a6d4612ca6b7b33a08f4b154b9e57004629d8dc3ef162f0123f36daa99
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

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const userCharlie = "user:Charlie" as ID; // Added for new test cases

const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items (0-9)
const file2 = "file:FileB" as ID;
const file2MaxIndex = 19; // 20 items (0-19)
const file3 = "file:FileC" as ID; // Added for new test cases

// Assuming GeminiLLM interface exists and is imported from @utils/gemini-llm.ts
interface GeminiLLM {
  executeLLM(prompt: string): Promise<string>;
}

// Mock for GeminiLLM to control responses in tests
class MockGeminiLLM implements GeminiLLM {
  private response: string;
  private throwError: boolean;
  private mockFunction?: (prompt: string) => Promise<string>;

  constructor(
    response: string = `{"currentIndex": 0}`,
    throwError: boolean = false,
    mockFunction?: (prompt: string) => Promise<string>,
  ) {
    this.response = response;
    this.throwError = throwError;
    this.mockFunction = mockFunction;
  }

  executeLLM(prompt: string): Promise<string> {
    if (this.throwError) {
      return Promise.reject(new Error("Mock LLM error"));
    }
    if (this.mockFunction) {
      return this.mockFunction(prompt);
    }
    return Promise.resolve(this.response);
  }
}

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  // Using a dummy LLM for the principle test as it doesn't directly involve LLM actions.
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
        "Current index should be 0 after one 'back'", // Fix: was "1"
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
      assertExists(trackedFileDoc, "Tracked file document should exist"); // Fix: Typo was trackedFileaDoc
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
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); // Pass mock LLM

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
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); // Pass mock LLM

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
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); // Pass mock LLM

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
      // Current index is file1MaxIndex from previous step
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
    const concept = new FileTrackerConcept(db, new MockGeminiLLM()); // Pass mock LLM

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
  const concept = new FileTrackerConcept(db, new MockGeminiLLM()); // Pass mock LLM

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

  // Define a sample file content for testing
  const sampleFileContent = [
    "Materials:",
    "Yarn, Hook",
    "",
    "Instructions:",
    "1. Make a magic ring.",
    "2. Chain 3, 12 DC into ring, join.",
    "3. Ch 3, 2 DC in each stitch around, join (24 DC).",
    "4. Next round...",
  ];
  const fileInput = JSON.stringify(sampleFileContent);
  const fileMaxIndex = sampleFileContent.length - 1; // 0-indexed max index

  await t.step("1. Successfully start tracking with valid LLM input", async () => {
    // Mock LLM to return a valid starting index within the range
    const mockLLM = new MockGeminiLLM(`{"currentIndex": 4}`); // Index 4 is "1. Make a magic ring."
    const concept = new FileTrackerConcept(db, mockLLM);

    const result = await concept.startTrackingUsingLLM({
      owner: userAlice,
      fileId: file3,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertNotEquals("error" in result, true, `Expected no error, but got: ${JSON.stringify(result)}`);
    const trackedFileId = (result as { id: ID }).id;
    assertExists(trackedFileId, "Expected a tracked file ID to be returned.");

    // Verify the state
    const trackedFileDoc = await db.collection("FileTracker.trackedFiles").findOne({ _id: trackedFileId });
    assertExists(trackedFileDoc, "Tracked file document should exist.");
    assertEquals(trackedFileDoc.owner, userAlice);
    assertEquals(trackedFileDoc.file, file3);
    assertEquals(trackedFileDoc.currentIndex, 4, "Current index should match LLM's determined index.");
    assertEquals(trackedFileDoc.maxIndex, fileMaxIndex);
    assertEquals(trackedFileDoc.isVisible, true);
  });

  await t.step("2. Fails if tracking already exists for owner and file", async () => {
    // Re-use userAlice and file3 from previous step
    const mockLLM = new MockGeminiLLM(`{"currentIndex": 0}`);
    const concept = new FileTrackerConcept(db, mockLLM);

    const result = await concept.startTrackingUsingLLM({
      owner: userAlice,
      fileId: file3,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertEquals("error" in result, true, "Expected an error for duplicate tracking.");
    assertEquals(
      (result as { error: string }).error,
      `Tracking already exists for owner '${userAlice}' and file '${file3}'.`,
      "Error message should indicate duplicate tracking.",
    );
  });

  await t.step("3. Fails with invalid (non-JSON) fileInput", async () => {
    const mockLLM = new MockGeminiLLM();
    const concept = new FileTrackerConcept(db, mockLLM);

    const invalidFileInput = "This is not JSON.";
    const result = await concept.startTrackingUsingLLM({
      owner: userBob,
      fileId: "file:InvalidJson" as ID,
      fileInput: invalidFileInput,
      fileMaxIndex: 5,
    });

    assertEquals("error" in result, true, "Expected an error for invalid JSON fileInput.");
    assertExists((result as { error: string }).error.includes("Invalid fileContentString"), "Error message should mention invalid JSON.");
  });

  await t.step("4. Fails with invalid (JSON but not array of strings) fileInput", async () => {
    const mockLLM = new MockGeminiLLM();
    const concept = new FileTrackerConcept(db, mockLLM);

    let result = await concept.startTrackingUsingLLM({
      owner: userBob,
      fileId: "file:JsonNotArray" as ID,
      fileInput: JSON.stringify({ key: "value" }), // Not an array
      fileMaxIndex: 5,
    });
    assertEquals("error" in result, true, "Expected error for JSON that is not an array.");
    assertEquals(
      (result as { error: string }).error,
      "fileContentString must be a JSON stringified array of strings.",
    );

    result = await concept.startTrackingUsingLLM({
      owner: userBob,
      fileId: "file:JsonArrayNotStrings" as ID,
      fileInput: JSON.stringify(["line1", 123, "line3"]), // Array contains non-string
      fileMaxIndex: 5,
    });
    assertEquals("error" in result, true, "Expected error for JSON array containing non-strings.");
    assertEquals(
      (result as { error: string }).error,
      "fileContentString must be a JSON stringified array of strings.",
    );
  });

  await t.step("5. Fails with inconsistent fileMaxIndex (empty content)", async () => {
    const mockLLM = new MockGeminiLLM();
    const concept = new FileTrackerConcept(db, mockLLM);

    const emptyFileInput = JSON.stringify([]);
    const result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:EmptyContentMismatch" as ID,
      fileInput: emptyFileInput,
      fileMaxIndex: 0, // Mismatch: empty means maxIndex should be -1
    });

    assertEquals("error" in result, true, "Expected error for inconsistent maxIndex with empty content.");
    assertEquals(
      (result as { error: string }).error,
      "maxIndex 0 is inconsistent with empty file content.",
    );
  });

  await t.step("6. Fails with inconsistent fileMaxIndex (non-empty content)", async () => {
    const mockLLM = new MockGeminiLLM();
    const concept = new FileTrackerConcept(db, mockLLM);

    const inconsistentFileInput = JSON.stringify(["line1", "line2"]); // Length 2, maxIndex should be 1
    const result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:ContentMismatch" as ID,
      fileInput: inconsistentFileInput,
      fileMaxIndex: 0, // Mismatch: expected 1, got 0
    });

    assertEquals("error" in result, true, "Expected error for inconsistent maxIndex with non-empty content.");
    assertEquals(
      (result as { error: string }).error,
      `maxIndex 0 is inconsistent with file content length 2 (expected 1).`,
    );
  });

  await t.step("7. Fails if LLM returns an out-of-bounds currentIndex", async () => {
    // Mock LLM to return an index greater than fileMaxIndex
    const mockLLM = new MockGeminiLLM(`{"currentIndex": ${fileMaxIndex + 1}}`); // Out of bounds
    const concept = new FileTrackerConcept(db, mockLLM);

    const result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:LLM_OutOfBounds" as ID,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertEquals("error" in result, true, "Expected an error for LLM returning out-of-bounds index.");
    assertExists(
      (result as { error: string }).error.includes(
        `currentIndex ${fileMaxIndex + 1} is out of bounds [0, ${fileMaxIndex}]`,
      ),
      "Error message should indicate out-of-bounds currentIndex from LLM.",
    );
  });

  await t.step("8. Fails if LLM returns malformed JSON or empty response", async () => {
    // Mock LLM to return invalid JSON
    let mockLLM = new MockGeminiLLM(`Not valid JSON`);
    let concept = new FileTrackerConcept(db, mockLLM);

    let result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:LLM_MalformedJson" as ID,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertEquals("error" in result, true, "Expected an error for malformed LLM JSON response.");
    assertExists((result as { error: string }).error.includes("Failed to parse LLM response"), "Error message should indicate parsing failure.");

    // Mock LLM to return JSON without currentIndex
    mockLLM = new MockGeminiLLM(`{"someOtherKey": 5}`);
    concept = new FileTrackerConcept(db, mockLLM);

    result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:LLM_NoCurrentIndex" as ID,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertEquals("error" in result, true, "Expected an error for LLM JSON missing currentIndex.");
    assertExists((result as { error: string }).error.includes("Invalid response, there is no currentIndex passed in."), "Error message should indicate missing currentIndex.");
  });

  await t.step("9. Fails if LLM call itself throws an error", async () => {
    // Mock LLM to throw an error
    const mockLLM = new MockGeminiLLM(undefined, true); // `throwError: true`
    const concept = new FileTrackerConcept(db, mockLLM);

    const result = await concept.startTrackingUsingLLM({
      owner: userCharlie,
      fileId: "file:LLM_Error" as ID,
      fileInput: fileInput,
      fileMaxIndex: fileMaxIndex,
    });

    assertEquals("error" in result, true, "Expected an error when LLM call throws.");
    assertExists((result as { error: string }).error.includes("Failed to start tracking with LLM"), "Error message should indicate LLM failure.");
  });

  await client.close();
});

```
