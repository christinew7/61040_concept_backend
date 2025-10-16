---
timestamp: 'Wed Oct 15 2025 20:33:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_203334.1f943f29.md]]'
content_id: 7b0598596755809edd5d54ae34a23bfd7a12a1a381aea8ce5df0168ab0e9a0fd
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
import { ListIndexesCursor } from "npm:mongodb"; // This import seems unused, but was present in the original snippet.

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
const userCharlie = "user:Charlie" as ID; // Added for new tests

const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items, 0-indexed max index is 9
const file2 = "file:FileB" as ID;

// Define FileContentInput objects for LLM-based tests based on the provided raw test data
const file1ContentInput = {
  id: "file:FileA_LLM" as ID, // Distinct ID for LLM version of FileA
  items: [
    "Materials",
    "Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",
    "Tools",
    "Hook: 4mm",
    "Darning Needle",
    "Scissors",
    "Instructions", // Index 6
    "Foundation Chain: Ch 6, ss in 6th ch from hook to form a ring.", // Index 7 (First instruction)
    "Round One: Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.",
  ],
};

const file2ContentInput = {
  id: "file:FileB_LLM" as ID, // Distinct ID for LLM version of FileB
  items: [
    "Materials Required:",
    "2 Colours of Yarn - main colour for the body, white for the belly - I recommend Cygnet Chunky available to purchase HERE",
    "Scrap of pink yarn for the blush",
    "4mm Crochet Hook",
    "12mm Safety Eyes",
    "Scissors",
    "Large Eye Needle",
    "Polyfil Stuffing",
    "Amigurumi Whale WRITTEN PATTERN",
    "USA STITCH TERMS",
    "MR = Magic Ring",
    "ch = chain",
    "sc = single crochet",
    "BLO = back loop only",
    "inc = increase (2sc in same stitch)",
    "dec = decrease",
    "inv dec = invisible decrease",
    "* * repeat the pattern in between the asterix X amount of times",
    "() =number of stitches at the end of the round",
    "Work in continuous spiral; do not join your work at the end of the rounds",
    "Fins (make 2)", // Index 20 (Section title)
    "1. MR, *sc* x6 (6)", // Index 21 (First instruction for "Fins")
    "2. *sc, inc* x 3 (9)",
    "3. Sc around (9)",
    "4. *sc, dec* x3 (6)",
    "Cut yarn leaving long tail for sewing",
    "Tail (make 2)", // Index 26 (Section title)
    "1. MR, *sc* x6 (6)", // Index 27 (First instruction for "Tail")
    "2. *inc* x6 (12)",
  ],
};

const file3ContentInput = {
  id: "file:FileC_Misc" as ID,
  items: [
    "Materials",
    "Bernat Softee Baby (soft peach) or any 3 weight yarn (See chart below for yardage)",
    "5 mm (H-8) crochet hook (or any hook size needed to obtain gauge)",
    "Yarn needle",
    "Scissors",
    "Measuring tape",
    "Click for more info about Yarn Needle Tapestry Needle Sewing Needles Weaving Needle Darning Needles Bent in Box Click for more info about Bernat® Softee® Baby Solid Yarn Click for more info about Soft Tape Measure,Double Scale 60 Inch(150CM) Click for more info about 5 Pieces Stainless Steel Tip Classic Stork Scissors Crane Design 3.6 Inch Sewing Dressmaker Sciss... Click for more info about Tulip TP1166 Etimo Crochet Hook Set",
    "Gauge",
    "12 sts x 7 rows= 4″ x 4″",
    "Gauge Pattern: Ch 13 and follow along with pattern as written",
    "Making a gauge swatch is important for a properly sized blanket, and I highly recommend crocheting one.",
    "Stitch Abbreviations",
    "bo = bobble",
    "sc = single crochet",
    "hdc = half double crochet",
    "ch = chain",
    "st = stitch",
    "rep = repeat",
    "Stitch Explanations",
    "Single Crochet (sc) Single Crochet Stitch Tutorial",
    "",
    "Insert hook from front to back in the second chain from the hook or designated stitch",
    "Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch) from back to front (2 loops on hook).",
    "Yo and pull through both loops on the hook.",
    "Bobble (bo) Bobble Stitch Tutorial",
    "",
    "Yo (yarn over) insert the hook into the designated st (stitch) in the row and pick up a loop. Yo draw yarn through 2 loops (3 loops)",
    "Yo insert hook into same st, yo draw through 2 loops (4 loops)",
    "Yo insert hook into same st, yo draw through 2 loops (5 loops)",
    "Yo insert hook into same st, yo draw through 2 loops (6 loops)",
    "Yo draw yarn through all 6 loops on hook, tighten down",
    "Half Double Crochet (hdc) Half Crochet Stitch Video Tutorial",
    "",
    "Yo (yarn over) insert hook from front to back of the designated stitch, Yo the hook and pick up a loop.",
    "Yo the hook and pull back through all three loops on the hook.",
    "Finished Size",
    "40″ x 40″ Receiving Blanket Size (+ bonus sizes such as throw blanket, queen blanket and more are listed below in the chart)",
    "Change size by using a multiple of 6 + 1 if you’d like to make this blanket in a different size than the standard ones listed below in the chart",
    "Notes",
    "Baby blanket is written in standard US terms",
    "If you’d like to make a bobble stripes blanket, for example, you can change the yarn colors. For color changes (or yarn skein changes) in this blanket, you can use our how to change colors in crochet tutorial.",
    "Blanket is made by holding TWO SKEINS of YARN together at the same time.",
    "You can make this blanket with just one skein of yarn at a time if you’d like, just remember to cut the number of skeins + yardage needed in half that are shown in the chart below.",
    "The Blanket Pattern", // Index 50 (Section title)
    "* pattern is worked by holding two skeins of yarn together at the same time.",
    "",
    "*st counts shown in () are as follows, (lovey, stroller, receiving, baby, throw, twin, full/queen, king)",
    "",
    "Foundation Row: ch (see size chart for size being made), in second ch from the hook hdc, hdc into each ch across, turn. (36,96,120,132,156,204,2 76,324)", // Index 51 (First instruction)
    "",
    "Row 1: ch 1, sc, sc, *bobble, sc, sc, rep from * across ending with a sc in last st, turn. (36,96,120,132,156,204,2 76,324)",
    "",
    "Row 2: ch 1, hdc into each st across, turn.",
    "",
    "Row 3: ch 1, hdc into each st across, turn.",
    "",
    "Row 4: ch 1, hdc into each st across, turn.",
    "",
    "Row 5 – (see chart for size being made): rep row 1 – 4 until two rows remain",
    "",
    "Second to Last Row: rep row 1",
    "",
    "Last Row: rep row 2",
    "",
    "Finishing: Fasten off and wave in loose ends with a yarn needle.",
  ],
};

const file5ContentInput = {
  id: "file:FileD_Sections" as ID,
  items: [
    "🧶 Materials 🧶",
    "🧶 Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",
    "🪛 Tools 🪡",
    "Hook: 4mm",
    "Darning Needle",
    "Scissors",
    "",
    "Single crochet", // Index 7 (Tutorial section title)
    "1️⃣ Insert hook from front to back in the second chain from the hook or designated stitch",
    "2️⃣ Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch) from back to front (2 loops on hook).",
    "3️⃣ Yo and pull through both loops on the hook.",
    "Body", // Index 11 (Main section title)
    "1️⃣ Ch 6, ss in 6th ch from hook to form a ring.", // Index 12 (First instruction for "Body")
    "2️⃣ Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.",
  ],
};

const file6ContentInput = {
  id: "file:FileE_Typos" as ID,
  items: [
    "vintage pattern from 1978",
    "",
    "materia1s :", // OCR error, Index 2
    "— worsted yarn",
    "- size H hook",
    "",
    "specia1 stitches :", // OCR error, Index 6
    "dc = double crochet",
    "",
    "instructions :", // Index 9 (Section title)
    "ohain l5O", // OCR error - "chain 150", Index 10 (First instruction)
    "row l: dc in 4th ch from hook", // OCR error - "row 1"
    "and eaoh oh across", // OCR error - "and each ch across"
    "",
    "row 2: oh 3, turn, dc in ea st", // Multiple OCR errors
    "across",
  ],
};

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
      assertEquals(
        (currentStatus as { index: number }).index,
        0,
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
      assertEquals(
        (currentStatus as { index: number }).index,
        1,
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
      assertEquals(
        (currentStatus as { index: number }).index,
        0,
        "Current index should be 0 after one 'back'",
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
    assertEquals(
      (currentStatus as { index: number }).index,
      targetIndex,
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
      assertEquals(
        (aliceStatus as { index: number }).index,
        0,
        "Alice's index should be 0.",
      );
      let bobStatus = await concept._getCurrentItem({ owner: userBob, file });
      assertEquals(
        (bobStatus as { index: number }).index,
        0,
        "Bob's index should be 0.",
      );

      // Alice iterates through to make sure it's not tracking the same index
      await concept.next({ owner: userAlice, file });
      aliceStatus = await concept._getCurrentItem({
        owner: userAlice,
        file,
      });
      assertEquals(
        (aliceStatus as { index: number }).index,
        1,
        "Alice's index should be 1.",
      );
      bobStatus = await concept._getCurrentItem({ owner: userBob, file });
      assertEquals(
        (bobStatus as { index: number }).index,
        0,
        "Bob's index should be 0.",
      );
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
      assertEquals(
        (file3Status as { index: number }).index,
        0,
        "Alice's index for file3 should be 0.",
      );
      assertEquals(
        (file2Status as { index: number }).index,
        1,
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

Deno.test("Action: next, back, jumpTo", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

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
      assertEquals((status as { index: number }).index, 1);

      // hit next again
      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals((status as { index: number }).index, 2);

      await concept.next({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals((status as { index: number }).index, 3);
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
      assertEquals((status as { index: number }).index, 2);

      // hit back again
      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals((status as { index: number }).index, 1);

      // hit back again
      await concept.back({ owner: userAlice, file: file1 });
      status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1,
      });
      assertEquals((status as { index: number }).index, 0);
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
      assertEquals((status as { index: number }).index, 0);
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
      assertEquals((status as { index: number }).index, 9);
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
    assertEquals((status as { index: number }).index, 7);

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
    assertEquals((status as { index: number }).index, 7);
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
      );
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
    const config = await loadConfig();
    const llm = new GeminiLLM(config);
    const concept = new FileTrackerConcept(db, llm);

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
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  let trackedFileId: ID;
  const result = await concept.startTracking({
    owner: userAlice,
    file: file1,
    maxIndex: file1MaxIndex,
  });

  trackedFileId = (result as { id: ID }).id;

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
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  await t.step(
    "1. LLM Tracking for a simple file (file1ContentInput)",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file1ContentInput,
      });
      assertNotEquals(
        "error" in result,
        true,
        `LLM tracking for ${file1ContentInput.id} should succeed. Error: ${
          ("error" in result && result.error) || ""
        }`,
      );
      const trackedId = (result as { id: ID }).id;
      assertExists(trackedId, "Expected a tracking ID to be returned.");

      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file1ContentInput.id,
      });
      assertEquals(
        (status as { index: number }).index,
        7, // Expected: "Foundation Chain" at index 7
        `LLM should find the first instruction at index 7 for ${file1ContentInput.id}.`,
      );
    },
  );

  await t.step(
    "2. LLM Tracking for a file with more sections (file2ContentInput)",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file2ContentInput,
      });
      assertNotEquals(
        "error" in result,
        true,
        `LLM tracking for ${file2ContentInput.id} should succeed. Error: ${
          ("error" in result && result.error) || ""
        }`,
      );
      const trackedId = (result as { id: ID }).id;
      assertExists(trackedId, "Expected a tracking ID to be returned.");

      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file2ContentInput.id,
      });
      assertEquals(
        (status as { index: number }).index,
        21, // Expected: "1. MR, *sc* x6 (6)" starts at index 21
        `LLM should find the first instruction at index 21 for ${file2ContentInput.id}.`,
      );
    },
  );

  await t.step(
    "3. LLM Tracking with miscellaneous prep instructions (file3ContentInput)",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file3ContentInput,
      });
      assertNotEquals(
        "error" in result,
        true,
        `LLM tracking for ${file3ContentInput.id} should succeed. Error: ${
          ("error" in result && result.error) || ""
        }`,
      );
      const trackedId = (result as { id: ID }).id;
      assertExists(trackedId, "Expected a tracking ID to be returned.");

      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file3ContentInput.id,
      });
      assertEquals(
        (status as { index: number }).index,
        51, // Expected: "Foundation Row" starts at index 51
        `LLM should find the first instruction at index 51 for ${file3ContentInput.id}.`,
      );
    },
  );

  await t.step(
    "4. LLM Tracking with instruction sections (file5ContentInput)",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file5ContentInput,
      });
      assertNotEquals(
        "error" in result,
        true,
        `LLM tracking for ${file5ContentInput.id} should succeed. Error: ${
          ("error" in result && result.error) || ""
        }`,
      );
      const trackedId = (result as { id: ID }).id;
      assertExists(trackedId, "Expected a tracking ID to be returned.");

      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file5ContentInput.id,
      });
      assertEquals(
        (status as { index: number }).index,
        12, // Expected: "1️⃣ Ch 6" starts at index 12
        `LLM should find the first instruction at index 12 for ${file5ContentInput.id}.`,
      );
    },
  );

  await t.step(
    "5. LLM Tracking with OCR typos (file6ContentInput)",
    async () => {
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file6ContentInput,
      });
      assertNotEquals(
        "error" in result,
        true,
        `LLM tracking for ${file6ContentInput.id} should succeed. Error: ${
          ("error" in result && result.error) || ""
        }`,
      );
      const trackedId = (result as { id: ID }).id;
      assertExists(trackedId, "Expected a tracking ID to be returned.");

      const status = await concept._getCurrentItem({
        owner: userAlice,
        file: file6ContentInput.id,
      });
      assertEquals(
        (status as { index: number }).index,
        10, // Expected: "ohain l5O" starts at index 10
        `LLM should find the first instruction at index 10 for ${file6ContentInput.id}.`,
      );
    },
  );

  await t.step(
    "6. Attempt to LLM track an already tracked file (should fail)",
    async () => {
      // Assuming file1ContentInput was tracked in step 1
      const duplicateResult = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file1ContentInput,
      });
      assertEquals(
        "error" in duplicateResult,
        true,
        `LLM tracking a duplicate for ${file1ContentInput.id} should return an error.`,
      );
      assertEquals(
        (duplicateResult as { error: string }).error,
        `Tracking already exists for owner '${userAlice}' and file '${file1ContentInput.id}'.`,
        "Error message should indicate duplicate tracking.",
      );
    },
  );

  await t.step(
    "7. LLM Tracking by different users for the same file (should succeed)",
    async () => {
      const resultBob = await concept.startTrackingUsingLLM({
        owner: userBob,
        file: file1ContentInput, // Same file as Alice tracked in step 1
      });
      assertNotEquals(
        "error" in resultBob,
        true,
        `Bob tracking ${file1ContentInput.id} should succeed. Error: ${
          ("error" in resultBob && resultBob.error) || ""
        }`,
      );
      const trackedIdBob = (resultBob as { id: ID }).id;
      assertExists(trackedIdBob, "Expected a tracking ID for Bob.");

      const statusBob = await concept._getCurrentItem({
        owner: userBob,
        file: file1ContentInput.id,
      });
      assertEquals(
        (statusBob as { index: number }).index,
        7, // Still expected index 7
        `Bob's tracking for ${file1ContentInput.id} should also be at index 7.`,
      );

      // Verify Alice's tracking is separate and untouched (from step 1)
      const statusAlice = await concept._getCurrentItem({
        owner: userAlice,
        file: file1ContentInput.id,
      });
      assertEquals(
        (statusAlice as { index: number }).index,
        7,
        "Alice's tracking should remain unchanged.",
      );
    },
  );

  await client.close();
});

Deno.test("Mixed Tracking: Manual and LLM tracking for different users/files", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  // Note: For distinct tracking, userBob tracks 'file1' (generic ID) and userAlice tracks 'file1ContentInput.id' (LLM-specific ID).
  // These are intentionally different IDs to represent separate tracking records, even if their content is similar.

  await t.step("1. Bob manually tracks file1", async () => {
    const result = await concept.startTracking({
      owner: userBob,
      file: file1, // Using file1 ID for manual tracking
      maxIndex: file1MaxIndex,
    });
    assertNotEquals(
      "error" in result,
      true,
      "Bob's manual tracking should succeed.",
    );
    const bobFile1Status = await concept._getCurrentItem({
      owner: userBob,
      file: file1,
    });
    assertEquals(
      (bobFile1Status as { index: number }).index,
      0,
      "Bob's manual tracking of file1 should start at index 0.",
    );
  });

  await t.step("2. Alice LLM tracks file1ContentInput", async () => {
    const result = await concept.startTrackingUsingLLM({
      owner: userAlice,
      file: file1ContentInput, // Using file1ContentInput ID for LLM tracking
    });
    assertNotEquals(
      "error" in result,
      true,
      `Alice's LLM tracking for ${file1ContentInput.id} should succeed.`,
    );
    const aliceFile1LLMStatus = await concept._getCurrentItem({
      owner: userAlice,
      file: file1ContentInput.id,
    });
    assertEquals(
      (aliceFile1LLMStatus as { index: number }).index,
      7, // Expected LLM determined index
      "Alice's LLM tracking of file1ContentInput should start at index 7.",
    );
  });

  await t.step("3. Alice LLM tracks file2ContentInput", async () => {
    const result = await concept.startTrackingUsingLLM({
      owner: userAlice,
      file: file2ContentInput,
    });
    assertNotEquals(
      "error" in result,
      true,
      `Alice's LLM tracking for ${file2ContentInput.id} should succeed.`,
    );
    const aliceFile2LLMStatus = await concept._getCurrentItem({
      owner: userAlice,
      file: file2ContentInput.id,
    });
    assertEquals(
      (aliceFile2LLMStatus as { index: number }).index,
      21, // Expected LLM determined index
      "Alice's LLM tracking of file2ContentInput should start at index 21.",
    );
  });

  await t.step("4. Verify all tracking states are distinct", async () => {
    // Bob's manual tracking
    const bobFile1Status = await concept._getCurrentItem({
      owner: userBob,
      file: file1,
    });
    assertEquals(
      (bobFile1Status as { index: number }).index,
      0,
      "Bob's file1 index should remain 0.",
    );

    // Alice's LLM tracking of file1ContentInput
    const aliceFile1LLMStatus = await concept._getCurrentItem({
      owner: userAlice,
      file: file1ContentInput.id,
    });
    assertEquals(
      (aliceFile1LLMStatus as { index: number }).index,
      7,
      "Alice's file1ContentInput index should remain 7.",
    );

    // Alice's LLM tracking of file2ContentInput
    const aliceFile2LLMStatus = await concept._getCurrentItem({
      owner: userAlice,
      file: file2ContentInput.id,
    });
    assertEquals(
      (aliceFile2LLMStatus as { index: number }).index,
      21,
      "Alice's file2ContentInput index should remain 21.",
    );
  });

  await client.close();
});
```
