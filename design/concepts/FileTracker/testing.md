
[@testing-concepts](../../background/testing-concepts.md)

[@implementation](../../../src/concepts/FileTracker/FileTrackerConcept.ts)

[@testing](../../../src/concepts/FileTracker/FileTrackerConcept.test.ts)

[@LikertTesting](../LikertSurvey/testing.md)
# context: these are all questions about the FileTracker concept and its test cases. use the Likert testing as reference

# reference: 
```
/**

* FileTracker Test Cases

*

* Demonstrates both LLM-assisted file tracking

*/

  

import { GeminiLLM, Config } from './gemini-llm';

import { FileTracker } from './filetracker';

import { User } from './passwordauthentication';

import { File } from './library';

  
  

/**

* Load configuration from config.json

*/

function loadConfig(): Config {

try {

const config = require('../config.json');

return config;

} catch (error) {

console.error('❌ Error loading config.json. Please ensure it exists with your API key.');

console.error('Error details:', (error as Error).message);

process.exit(1);

}

}

  

const alice: User = { username: "alice", password: "bob" };

const bob: User = { username: "bob", password: "hi" };

  

const file1: File = {

items: ["Materials",

"Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",

"Tools",

"Hook: 4mm",

"Darning Needle",

"Scissors",

"Instructions",

"Foundation Chain: Ch 6, ss in 6th ch from hook to form a ring.",

"Round One: Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3."

],

dateAdded: new Date()

};

  

const file2: File = {

items: ["Materials Required:",

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

"Fins (make 2)",

"1. MR, *sc* x6 (6)",

"2. *sc, inc* x 3 (9)",

"3. Sc around (9)",

"4. *sc, dec* x3 (6)",

"Cut yarn leaving long tail for sewing",

// "",

"Tail (make 2)",

"1. MR, *sc* x6 (6)",

"2. *inc* x6 (12)",

],

dateAdded: new Date(),

};

  

const file3: File = {

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

"Half Double Crochet (hdc) Half Double Crochet Stitch Video Tutorial",

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

"The Blanket Pattern",

"* pattern is worked by holding two skeins of yarn together at the same time.",

"",

"*st counts shown in () are as follows, (lovey, stroller, receiving, baby, throw, twin, full/queen, king)",

"",

"Foundation Row: ch (see size chart for size being made), in second ch from the hook hdc, hdc into each ch across, turn. (36,96,120,132,156,204,2 76,324)",

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

dateAdded: new Date()

};

  

const file4: File = {

items: ["Materials",

"Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",

"Tools",

"Hook: 4mm",

"Darning Needle",

"Scissors",

"",

"Instructions",

"Foundation Chain: Ch 6, ss in 6th ch from hook to form a ring.",

"Round One: Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3."

],

dateAdded: new Date()

};

  

const file5: File = {

items: ["🧶 Materials 🧶",

"🧶 Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",

"🪛 Tools 🪡",

"Hook: 4mm",

"Darning Needle",

"Scissors",

"",

"Single crochet",

"1️⃣ Insert hook from front to back in the second chain from the hook or designated stitch",

"2️⃣ Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch) from back to front (2 loops on hook).",

"3️⃣ Yo and pull through both loops on the hook.",

"Body",

"1️⃣ Ch 6, ss in 6th ch from hook to form a ring.",

"2️⃣ Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3."

],

dateAdded: new Date()

}

  

const file6: File = {

// items: [

// "CROCHET-A-LONG WEEK 1",

// "",

// "VIDEO TUTORIAL AVAILABLE: youtu.be/example",

// "",

// "WRITTEN PATTERN:",

// "Skill Level: Beginner",

// "",

// "STITCH GUIDE:",

// "SC = Single Crochet",

// "DC = Double Crochet",

// "CH = Chain",

// "",

// "WEEK 1 - PART A:",

// "Step 1: Make a slip knot",

// "Step 2: Chain 50 stitches",

// "Step 3: Single crochet in 2nd chain from hook",

// "",

// "WATCH THE VIDEO if you're confused!",

// "",

// "TEXT-ONLY VERSION:",

// "Foundation: ch 50",

// "Row 1: sc in 2nd ch from hook and each ch across (49)",

// "Row 2: ch 1, turn, sc in each st across",

// "",

// "Continue until we meet next week for Part B!"

// ],

items: [

"vintage pattern from 1978",

"",

"materia1s :", // OCR error

"— worsted yarn", // Strange character

"- size H hook",

"",

"specia1 stitches :", // OCR error

"dc = double crochet",

"",

"instructions :",

"ohain l5O", // OCR error - "chain 150"

"row l: dc in 4th ch from hook", // OCR error - "row 1"

"and eaoh oh across", // OCR error - "and each ch across"

"",

"row 2: oh 3, turn, dc in ea st", // Multiple OCR errors

"across"

],

dateAdded: new Date()

}

  

export async function testWithMisc(): Promise<void> {

console.log('\n🧪 TEST CASE 1: Test with lots miscellaneous comments and prep instructions before');

console.log('=================================');

  

const fileTracker = new FileTracker();

  

const config = loadConfig();

const llm = new GeminiLLM(config);

  

await fileTracker.startTrackingUsingLLM(alice, file3, llm);

  

fileTracker.displayTrackedFiles();

}

  

export async function testWithSections(): Promise<void> {

console.log('\n🧪 TEST CASE 2: Test with instruction sections');

console.log('=================================');

  

const fileTracker = new FileTracker();

  

const config = loadConfig();

const llm = new GeminiLLM(config);

  

await fileTracker.startTrackingUsingLLM(alice, file5, llm);

  

fileTracker.displayTrackedFiles();

}

  

export async function testWithTypos(): Promise<void> {

console.log('\n🧪 TEST CASE 2: Test with instruction sections');

console.log('=================================');

  

const fileTracker = new FileTracker();

  

const config = loadConfig();

const llm = new GeminiLLM(config);

  

await fileTracker.startTrackingUsingLLM(alice, file6, llm);

  

fileTracker.displayTrackedFiles();

}

  

// ---------- OLDER BASIC TEST CASES ------------

  

/**

* Basic test case 1: Manual tracking

* Demonstrates adding a new file to track and defaulting the currentIndex to the first item

*/

export async function testManualTracking(): Promise<void> {

console.log('\n🧪 TEST CASE 1: Manual Tracking');

console.log('==================================');

  

const fileTracker = new FileTracker();

  

fileTracker.startTracking(alice, file1);

  

// Display the schedule

fileTracker.displayTrackedFiles();

}

  

/**

* Basic test case 2: LLM Tracking

* Demonstrates adding a new file to track and letting the LLM automatically determine the currentIndex

*/

export async function testLLMTracking(): Promise<void> {

console.log('\n🧪 TEST CASE 2: LLM Tracking');

console.log('==================================');

  

const fileTracker = new FileTracker();

  

const config = loadConfig();

const llm = new GeminiLLM(config);

  

await fileTracker.startTrackingUsingLLM(alice, file1, llm);

await fileTracker.startTrackingUsingLLM(alice, file2, llm);

  

fileTracker.displayTrackedFiles();

}

  

/**

* Basic test case 3: Mixed tracking

* Demonstrates adding some file tracking manually and others via LLM

*/

export async function testMixedTracking(): Promise<void> {

console.log('\n🧪 TEST CASE 3: Mixed Scheduling');

console.log('=================================');

  

const fileTracker = new FileTracker();

  

const config = loadConfig();

const llm = new GeminiLLM(config);

  

fileTracker.startTracking(bob, file1);

await fileTracker.startTrackingUsingLLM(alice, file1, llm);

await fileTracker.startTrackingUsingLLM(alice, file2, llm);

  

fileTracker.displayTrackedFiles();

}

  

// ----------------------------------------------

// -------- ^ OLDER BASIC TEST CASES ^ ----------

// ----------------------------------------------

  

/**

* Main function to run all test cases

*/

async function main(): Promise<void> {

console.log('📁 FileTracker Test Suite');

console.log('========================\n');

  

try {

// await testManualTracking();

  

// await testLLMTracking();

  

// await testMixedTracking();

  

await testWithMisc();

  

await testWithSections();

  

await testWithTypos();

  

console.log('\n🎉 All test cases completed successfully!');

  

} catch (error) {

console.error('❌ Test error:', (error as Error).message);

process.exit(1);

}

}

  

// Run the tests if this file is executed directly

if (require.main === module) {

main();

}
```

# prompt: can you use these test cases and change it so it fits the current implementation for new test cases, only show me the Deno.test for the action of startTrackingUsingLLm
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

// Define some generic User IDs for testing
const userAlice = "user:Alice" as ID;

// Define file content for LLM-based tracking tests
const file3Items = [
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
  "Half Double Crochet (hdc) Half Double Crochet Stitch Video Tutorial",
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
  "The Blanket Pattern",
  "* pattern is worked by holding two skeins of yarn together at the same time.",
  "",
  "*st counts shown in () are as follows, (lovey, stroller, receiving, baby, throw, twin, full/queen, king)",
  "",
  "Foundation Row: ch (see size chart for size being made), in second ch from the hook hdc, hdc into each ch across, turn. (36,96,120,132,156,204,2 76,324)",
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
];
const file3Content = { id: "file:File3" as ID, items: file3Items };

const file5Items = [
  "🧶 Materials 🧶",
  "🧶 Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",
  "🪛 Tools 🪡",
  "Hook: 4mm",
  "Darning Needle",
  "Scissors",
  "",
  "Single crochet",
  "1️⃣ Insert hook from front to back in the second chain from the hook or designated stitch",
  "2️⃣ Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch) from back to front (2 loops on hook).",
  "3️⃣ Yo and pull through both loops on the hook.",
  "Body",
  "1️⃣ Ch 6, ss in 6th ch from hook to form a ring.",
  "2️⃣ Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.",
];
const file5Content = { id: "file:File5" as ID, items: file5Items };

const file6Items = [
  "vintage pattern from 1978",
  "",
  "materia1s :", // OCR error
  "— worsted yarn", // Strange character
  "- size H hook",
  "",
  "specia1 stitches :", // OCR error
  "dc = double crochet",
  "",
  "instructions :",
  "ohain l5O", // OCR error - "chain 150"
  "row l: dc in 4th ch from hook", // OCR error - "row 1"
  "and eaoh oh across", // OCR error - "and each ch across"
  "",
  "row 2: oh 3, turn, dc in ea st", // Multiple OCR errors
  "across",
];
const file6Content = { id: "file:File6" as ID, items: file6Items };

Deno.test("Action: startTrackingUsingLLM", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);

  await t.step(
    "1. LLM determines start index for file with miscellaneous comments and prep instructions",
    async () => {
      // Trace: Mimics testWithMisc()
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file3Content,
      });
      assertEquals(
        "error" in result,
        false,
        `startTrackingUsingLLM failed: ${JSON.stringify(result)}`,
      );
      assertExists((result as { id: ID }).id, "Tracked file ID should be returned.");

      const currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file3Content.id,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      // Expected index 48: "Foundation Row: ch (see size chart for size being made)..."
      assertEquals(
        (currentStatus as { index: number }).index,
        48,
        "LLM should correctly identify the start of 'Foundation Row' instructions in file3.",
      );
    },
  );

  await t.step(
    "2. LLM determines start index for file with instructional sections (skipping basic stitches)",
    async () => {
      // Trace: Mimics testWithSections()
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file5Content,
      });
      assertEquals(
        "error" in result,
        false,
        `startTrackingUsingLLM failed: ${JSON.stringify(result)}`,
      );
      assertExists((result as { id: ID }).id, "Tracked file ID should be returned.");

      const currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file5Content.id,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      // Expected index 11: "1️⃣ Ch 6, ss in 6th ch from hook to form a ring." (first instruction of 'Body')
      assertEquals(
        (currentStatus as { index: number }).index,
        11,
        "LLM should correctly identify the start of 'Body' instructions in file5, skipping basic stitches.",
      );
    },
  );

  await t.step(
    "3. LLM determines start index for file with OCR typos",
    async () => {
      // Trace: Mimics testWithTypos()
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file6Content,
      });
      assertEquals(
        "error" in result,
        false,
        `startTrackingUsingLLM failed: ${JSON.stringify(result)}`,
      );
      assertExists((result as { id: ID }).id, "Tracked file ID should be returned.");

      const currentStatus = await concept._getCurrentItem({
        owner: userAlice,
        file: file6Content.id,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      // Expected index 8: "ohain l5O" (corrected to "chain 150", first actual instruction)
      assertEquals(
        (currentStatus as { index: number }).index,
        8,
        "LLM should correctly identify the start of instructions in file6, despite OCR typos.",
      );
    },
  );

  await t.step(
    "4. LLM should return an error if tracking already exists for the file (requires)",
    async () => {
      // Use an already tracked file to test the 'requires' clause for duplicate tracking
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: file3Content, // file3Content was tracked in step 1
      });
      assertEquals(
        "error" in result,
        true,
        "Should return an error if tracking already exists for the owner and file.",
      );
      assertEquals(
        (result as { error: string }).error,
        `Tracking already exists for owner '${userAlice}' and file '${file3Content.id}'.`,
        "Error message should match for duplicate tracking.",
      );
    },
  );

  await t.step(
    "5. LLM should return an error if file content (items) is empty (requires)",
    async () => {
      const emptyFileContent = { id: "file:EmptyFile" as ID, items: [] };
      const result = await concept.startTrackingUsingLLM({
        owner: userAlice,
        file: emptyFileContent,
      });
      assertEquals(
        "error" in result,
        true,
        "Should return an error if file content is empty.",
      );
      assertEquals(
        (result as { error: string }).error,
        `File content (items) is empty or invalid for file '${emptyFileContent.id}'.`,
        "Error message should match for empty file content.",
      );
    },
  );

  await client.close();
});
```