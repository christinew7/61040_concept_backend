---
timestamp: 'Wed Oct 15 2025 16:38:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_163857.ff0c12b0.md]]'
content_id: 4b122c719adeedfd05a3ef0da86c4e7e2287242c71b3b6df5bc8f5b5fc798fd7
---

# response:

Here's the fixed `FileTrackerConcept.ts` file, addressing the issues in the `startTrackingUsingLLM` action and its helper functions, specifically adhering to the rule that action methods must take a single JSON object argument with primitive values, and properly integrating the `GeminiLLM` dependency.

Key changes:

1. **`GeminiLLM` Injection**: The `GeminiLLM` instance is now passed to the `FileTrackerConcept`'s constructor, making it an internal dependency rather than an argument to the `startTrackingUsingLLM` action. This respects the rule of "no custom objects" in action arguments.
2. **`FileContentInput` Interface**: A new interface `FileContentInput` is introduced to properly type the `file` argument in `startTrackingUsingLLM`. This object contains the `file.id` (of type `File` which is `ID`) and `file.items` (the content lines), ensuring all necessary data is encapsulated in a single JSON-compatible object.
3. **`startTrackingUsingLLM` Signature**: Now takes a single argument `{ owner: User; file: FileContentInput }` as required.
4. **`createTrackingPrompt` Update**: The helper function now correctly receives `FileContentInput` to access file content and length for prompt generation.
5. **`parseAndStartTracking` Update**:
   * It is now `async` to accommodate MongoDB insertion.
   * It uses `this.trackedFiles.insertOne()` instead of `push()`.
   * Improved robust JSON parsing and validation of LLM's output (`currentIndex`, `maxIndex`) against the *actual* file's `maxIndex`.
   * Returns `{ id: TrackedFile } | { error: string }` consistently for success or failure.
6. **`maxIndex` Validation in `startTracking`**: Adjusted the validation to correctly treat `0` as a valid `maxIndex` (for a file with a single item, where `maxIndex` refers to the highest valid index).

```typescript
// file: src/concepts/FileTracker/FileTrackerConcept.ts

/**
 * @concept FileTracker [User, File]
 * @purpose track current position and enable navigation within files
 * @principle a user can start tracking their file from the first listed item (which might not be the first item);
 *   a user can also use an LLM to start tracking their file at a better suited item within the file;
 *   they can move through file items sequentially without losing their place or skip to a file item;
 *   and control how progress is displayed.
 */
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // Required for LLM functionality

// Declare collection prefix, use concept name
const PREFIX = "FileTracker" + ".";

/**
 * Generic types of this concept
 * User and File are IDs, treated as branded strings.
 */
type User = ID;
type File = ID; // File ID in the system
type TrackedFile = ID; // ID of the TrackedFile document itself

/**
 * @state TrackedFiles
 * a set of `TrackedFiles` with
 *    an `owner` User
 *    a `file` `File`
 *    a `currentIndex` `Number`
 *    a `maxIndex` `Number`
 *    a `isVisible` `Flag`
 */
interface TrackedFileDoc {
  _id: TrackedFile; // Unique ID for this tracking record
  owner: User;
  file: File; // Reference to the file ID
  currentIndex: number;
  maxIndex: number; // The highest valid index (e.g., file.items.length - 1)
  isVisible: boolean;
}

/**
 * Helper type for passing file content to LLM-related actions.
 * This is an *input structure* for action arguments, consistent with JSON objects.
 */
interface FileContentInput {
  id: File;
  items: string[]; // The actual line-by-line content of the file
}

export default class FileTrackerConcept {
  private trackedFiles: Collection<TrackedFileDoc>;
  private readonly llm: GeminiLLM; // LLM instance injected and managed by the concept

  constructor(private readonly db: Db, llm: GeminiLLM) { // LLM is injected via constructor
    this.trackedFiles = this.db.collection(PREFIX + "trackedFiles");
    this.llm = llm; // Assign the injected LLM instance
  }

  /**
   * @action startTracking
   * @param input - A dictionary containing owner, file, and maxIndex.
   * @param input.owner - The ID of the user.
   * @param input.file - The ID of the file.
   * @param input.maxIndex - The highest valid index for items within the file (e.g., `total_items - 1`).
   * @returns {Promise< {id: TrackedFile} | { error: string }>} An object containing the ID of the new tracked file on success, or an error object.
   *
   * @requires this `owner` exists, this `file` exists, this `maxIndex` is a non-negative integer,
   *   this `owner` and this `file` isn't already in the set of `TrackedFiles`.
   * @effects create a new `TrackedFile` with this owner, this file and this maxIndex, `currentIndex` is initialized to 0,
   *   `isVisible` set to true.
   */
  async startTracking(
    { owner, file, maxIndex }: { owner: User; file: File; maxIndex: number },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.
    // Validate `maxIndex` - must be a non-negative integer (can be 0 for a file with 1 item).
    if (
      typeof maxIndex !== "number" || maxIndex < 0 ||
      !Number.isInteger(maxIndex)
    ) {
      return {
        error:
          `Invalid maxIndex: ${maxIndex}. Must be a non-negative integer (representing the highest valid index).`,
      };
    }

    // Check if tracking already exists for this owner and file
    const existingTracking = await this.trackedFiles.findOne({ owner, file });
    if (existingTracking) {
      return {
        error:
          `Tracking already exists for owner '${owner}' and file '${file}'.`,
      };
    }

    const newTrackedFile: TrackedFileDoc = {
      _id: freshID(),
      owner,
      file,
      currentIndex: 0,
      maxIndex,
      isVisible: true,
    };
    await this.trackedFiles.insertOne(newTrackedFile);
    return { id: newTrackedFile._id };
  }

  /**
   * @action startTrackingUsingLLM
   * @param input - A dictionary containing owner and file content.
   * @param input.owner - The ID of the user.
   * @param input.file - An object containing the file's ID and its line content.
   * @param input.file.id - The actual File ID.
   * @param input.file.items - An array of strings representing the file's lines.
   * @returns {Promise<{ id: TrackedFile } | { error: string }>} The ID of the new tracked file on success, or an error object.
   *
   * @requires this `owner` exists, this `file` (referencing `input.file.id`) exists,
   *   this `owner` and this `file` isn't already in the set of `TrackedFiles`.
   * @effect uses an internal `llm` to determine a more accurate `currentIndex` for the file,
   *   then creates a new `TrackedFile` document in the database.
   */
  async startTrackingUsingLLM(
    { owner, file }: { owner: User; file: FileContentInput },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    const fileID = file.id;
    const fileItems = file.items;
    // Calculate the actual max index based on the provided file content
    const actualMaxIndex = fileItems.length > 0 ? fileItems.length - 1 : 0;

    // Validate file content
    if (!Array.isArray(fileItems) || fileItems.length === 0) {
      return {
        error: `File content (items) is empty or invalid for file '${fileID}'.`,
      };
    }

    // Check if tracking already exists for this owner and file
    const existingTracking = await this.trackedFiles.findOne({
      owner,
      file: fileID,
    });
    if (existingTracking) {
      return {
        error:
          `Tracking already exists for owner '${owner}' and file '${fileID}'.`,
      };
    }

    try {
      console.log("🤖 Requesting tracking position from Gemini API...");

      const prompt = this.createTrackingPrompt(file); // Pass the file content input to prompt creator
      const text = await this.llm.executeLLM(prompt); // Use the internal LLM instance

      console.log("✅ Received response from Gemini AI!");
      console.log("\n🤖 RAW GEMINI RESPONSE");
      console.log("======================");
      console.log(text);
      console.log("======================\n");

      // Parse LLM response and attempt to create the TrackedFile
      const parseResult = await this.parseAndStartTracking( // Await since it's now async
        text,
        owner,
        fileID,
        actualMaxIndex,
      );

      if ("error" in parseResult) {
        return parseResult; // Return error from parsing or insertion
      }

      return { id: parseResult.id }; // Return the ID of the newly created TrackedFile
    } catch (error) {
      console.error(
        "❌ Error during LLM interaction or response processing:",
        (error as Error).message,
      );
      return {
        error: `Failed to start tracking with LLM: ${(error as Error).message}`,
      };
    }
  }

  /**
   * @action deleteTracking
   * @param input - A dictionary containing owner and file.
   * @param input.owner - The ID of the user.
   * @param input.file - The ID of the file.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` is in the set of TrackedFiles
   * @effects delete the `TrackedFile` with this `owner` and this `file`
   */
  async deleteTracking(
    { owner, file }: { owner: User; file: File },
  ): Promise<Empty | { error: string }> {
    const result = await this.trackedFiles.deleteOne({ owner, file });
    if (result.deletedCount === 0) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }
    return {};
  }

  /**
   * @action jumpTo
   * @param input - A dictionary containing owner, file, and index.
   * @param input.owner - the id of the user
   * @param input.file - the id of the file
   * @param input.index - The index to jump to.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`
   * @effects updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`
   */
  async jumpTo(
    { owner, file, index }: { owner: User; file: File; index: number },
  ): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }

    // Validate index
    if (
      typeof index !== "number" || index < 0 || index > trackedFile.maxIndex ||
      !Number.isInteger(index)
    ) {
      return {
        error:
          `Index '${index}' is out of bounds [0, ${trackedFile.maxIndex}] or not an integer.`,
      };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $set: { currentIndex: index } },
    );
    return {};
  }

  /**
   * @action next
   * @param input - A dictionary containing owner and file.
   * @param input.owner - the id of the user
   * @param input.file - the id of the file
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`
   * @effects increments the TrackedFile with this owner and this file by 1
   */
  async next(
    { owner, file }: { owner: User; file: File },
  ): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }

    if (trackedFile.currentIndex >= trackedFile.maxIndex) {
      return {
        error:
          `Current index ${trackedFile.currentIndex} is already at or beyond max index ${trackedFile.maxIndex}. Cannot move next.`,
      };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $inc: { currentIndex: 1 } },
    );
    return {};
  }

  /**
   * @action back
   * @param input - A dictionary containing owner and file.
   * @param input.owner - the id of the user
   * @param input.file - the id of the file
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
   * @effects decrements the TrackedFile with this owner and this file by 1
   */
  async back(
    { owner, file }: { owner: User; file: File },
  ): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }

    if (trackedFile.currentIndex <= 0) {
      return {
        error:
          `Current index ${trackedFile.currentIndex} is already at or below 0. Cannot move back.`,
      };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $inc: { currentIndex: -1 } },
    );
    return {};
  }

  /**
   * @action setVisibility
   * @param input - A dictionary containing owner, file, and visible flag.
   * @param input.owner - the ID of the user
   * @param input.file - the ID of the file
   * @param input.visible - the desired visibility status
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   *
   * @requires this owner and this file exists in the TrackedFiles
   * @effects in the TrackedFile with this owner and this file, set isVisible to this visible
   */
  async setVisibility(
    { owner, file, visible }: { owner: User; file: File; visible: boolean },
  ): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }

    if (typeof visible !== "boolean") {
      return { error: `Invalid visible value: ${visible}. Must be a boolean.` };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $set: { isVisible: visible } },
    );

    return {};
  }

  /**
   * Helper functions and queries follow
   */

  /**
   * Private helper function to create the prompt for Gemini LLM.
   * @param fileContent - An object containing the file's ID and its line content.
   * @returns The generated prompt string.
   */
  private createTrackingPrompt(fileContent: FileContentInput): string {
    const analysisLines = fileContent.items.slice(0, 50);
    const fullFileLength = fileContent.items.length;
    const maxValidIndex = fullFileLength > 0 ? fullFileLength - 1 : 0;

    const criticalRequirements = [
      `1. The currentIndex MUST be between 0 and maxIndex (INCLUSIVE). Current maxIndex is ${maxValidIndex}.`,
      "2. You are only analyzing the first 50 lines, but your current index should reference the ORIGINAL full file.",
      `3. The actual file has ${fullFileLength} total lines, but you only see the first 50 for analysis.`,
    ];

    const potentialSections = [
      "Materials",
      "Stitch Abbreviations",
      "Finished Size",
      "Notes",
      "Gauge",
      "Stitch Terms",
      "Tools",
      "Single crochet",
      "Double crochet",
      "Body",
      "Head",
    ];

    const commonOCRErrors = [
      "'ohain' -> 'chain'",
      "'row l' -> 'row 1'",
      "'eaoh' -> 'each'",
      "'materia1s' -> 'materials'",
      "'0' -> 'O'",
      "'5' -> 'S'",
    ];

    return `
You are a helpful AI assistant that finds the best tracking index of a file for crocheters.

I'm providing you with the FIRST 50 LINES of a crochet pattern file for analysis.
This may contain OCR errors from scanning. Be flexible in recognizing instructions despite character recognition issues.
POTENTIAL OCR ERRORS
${commonOCRErrors.join("\n")}

The full file has ${fullFileLength} total lines.

The file will be passed as a list of line entries, where the first couple of sections are NOT instructions.
There will be a MATERIALS section and optionally, other potential sections listed below. The sections are case-INsensitive.
Then, there will be the instructions section, which can include multiple subsections.
You are to provide the index at the first instruction of the main pattern section. This may be marked by "1.", but it might not include the line item.
Ignore any instructional steps for the basic or tutorial stitches, like single crochet, double crochet, magic ring.
Find the index of the first instruction, NOT the index of the section title, some of which are defined below.

POTENTIAL SECTIONS:
${potentialSections.join("\n")}

FILE PREVIEW (first 50 lines):
${analysisLines.map((line, index) => `[${index}]: ${line}`).join("\n")}

CRITICAL REQUIREMENTS:
${criticalRequirements.join("\n")}

Return your response as a JSON object with this exact structure. Use integers and obey the ranges shown.

{
    "currentIndex": {YOUR DETERMINED INDEX}, // Must be 0 - ${maxValidIndex},
    "maxIndex": ${maxValidIndex}, // This should explicitly be the actual max index for verification
}

Return ONLY the JSON object, no additional text. Strictly enforce the integer ranges above — if you cannot satisfy them, return an empty assignments array.
        `;
  }

  /**
   * Private helper function to parse the LLM response and attempt to create a new TrackedFile.
   * @param responseText - The raw text response from the LLM.
   * @param owner - The ID of the user.
   * @param fileID - The ID of the file.
   * @param actualMaxIndex - The highest valid index of the actual file (length - 1).
   * @returns {Promise<{ id: TrackedFile } | { error: string }>} An object containing the ID of the new tracked file on success, or an error object.
   */
  private async parseAndStartTracking(
    responseText: string,
    owner: User,
    fileID: File,
    actualMaxIndex: number,
  ): Promise<{ id: TrackedFile } | { error: string }> {
    try {
      // Attempt to extract and parse JSON from the LLM's response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { error: "No JSON object found in LLM response." };
      }

      let indices: { currentIndex: number; maxIndex: number };
      try {
        indices = JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        return {
          error: `Failed to parse LLM JSON response: ${(jsonError as Error).message}`,
        };
      }

      const issues: string[] = [];

      if (!indices || typeof indices !== "object") {
        issues.push(`Invalid response format: LLM response is empty or not an object.`);
      } else {
        // Checking for existence, type, and integer nature of fields
        if (typeof indices.currentIndex !== "number" || !Number.isInteger(indices.currentIndex)) {
          issues.push(
            `Invalid currentIndex: '${indices.currentIndex}' is not an integer.`,
          );
        }
        if (typeof indices.maxIndex !== "number" || !Number.isInteger(indices.maxIndex)) {
          issues.push(`Invalid maxIndex: '${indices.maxIndex}' is not an integer.`);
        }

        // If types are correct, proceed with bounds and consistency checks
        if (issues.length === 0) {
          // Validate currentIndex against the actual file's max index
          if (indices.currentIndex < 0 || indices.currentIndex > actualMaxIndex) {
            issues.push(
              `LLM suggested currentIndex ${indices.currentIndex} is out of bounds [0, ${actualMaxIndex}].`,
            );
          }
          // Validate LLM's maxIndex against the actual file's max index
          if (indices.maxIndex !== actualMaxIndex) {
            issues.push(
              `LLM-provided maxIndex ${indices.maxIndex} does not match actual maxIndex ${actualMaxIndex}.`,
            );
          }
        }
      }

      if (issues.length > 0) {
        // If any validation issues, return an error with all collected messages
        return { error: `LLM suggested indices are invalid: ${issues.join("; ")}` };
      }

      // If all validations pass, create and insert the new tracked file document
      const newTrackedFile: TrackedFileDoc = {
        _id: freshID(),
        owner: owner,
        file: fileID,
        currentIndex: indices.currentIndex,
        maxIndex: actualMaxIndex, // Always use the actual max index, derived from file content length
        isVisible: true,
      };

      await this.trackedFiles.insertOne(newTrackedFile);
      return { id: newTrackedFile._id }; // Return the ID of the newly created document
    } catch (error) {
      console.error(
        "❌ Error during LLM response parsing or database insertion:",
        (error as Error).message,
      );
      return {
        error: `Failed to parse LLM response or save tracking: ${(error as Error).message}`,
      };
    }
  }

  /**
   * @query _getCurrentItem
   * @param input - A dictionary containing owner and file.
   * @param input.owner - the ID of the user
   * @param input.file - the ID of the file
   * @returns {Promise<{ index: number } | { error: string }>} The current index on success, or an error object.
   *
   * @requires this owner and this file exists in the TrackedFiles
   * @effects in the TrackedFile with this owner and this file, return the currentIndex
   */
  async _getCurrentItem(
    { owner, file }: { owner: User; file: File },
  ): Promise<{ index: number } | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }
    return { index: trackedFile.currentIndex };
  }
}
```
