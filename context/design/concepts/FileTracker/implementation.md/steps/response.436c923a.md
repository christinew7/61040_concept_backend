---
timestamp: 'Sat Oct 18 2025 10:27:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_102733.e1881e1f.md]]'
content_id: 436c923ac22cc1151c7bc66b1ccd66a0a2bb2260c52d16b9b8a5aef58f9925e9
---

# response:

To address your request, we need to make the following adjustments to the `FileTrackerConcept` implementation:

1. **Refine `startTrackingUsingLLM` action parameters**: Clarify that the `fileContent` input is a stringified array of lines and that `maxIndex` refers to the highest valid index.
2. **Add validation for `fileContentString`**: Ensure the input string is a valid JSON array of strings before proceeding.
3. **Modify `createTrackingPrompt`**: This private method will now receive the parsed array of file lines directly, along with the correct `maxIndex` (highest valid index). It will use these to construct a precise prompt for the LLM.
4. **Ensure consistency of `maxIndex`**: The `maxIndex` in `TrackedFileDoc` and all related validation (e.g., in `jumpTo`, `next`, `back`) should consistently refer to the *highest valid index* (i.e., `items.length - 1`). The `startTracking` action's `maxIndex` parameter, which traditionally represents the *count* of items, will be converted to the *highest valid index* when stored.

Here's the updated `FileTrackerConcept.ts` file:

```typescript
/**
 * @concept FileTracker [User, File]
 * @purpose track current position and enable navigation within files
 * @principle a user can create a FileTracker to keep track of their position in various files
 * they can track or untrack files,
 * move through file items sequentially or skip to a specific file item
 * and they can control how their progress is displayed
 */
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
 * @concept FileTracker
 * @purpose track current position and enable navigation within files
 * @principle a user can start tracking their file from the first listed item
 *  they can move through file items sequentially without losing their place or skip to a file item
 *  and control how progress is displayed
 */

// Declare collection prefix, use concept name
const PREFIX = "FileTracker" + ".";

/**
 * Generic types of this concept
 * User and File are IDs, treated as branded strings.
 */
type User = ID;
type File = ID;
type TrackedFile = ID;

/**
 * a set of TrackedFiles with
 *    document ID
 * @state
 * An entry representing a user's tracking progress for a specific file.
 * `maxIndex` stores the highest valid index (e.g., for 10 items, maxIndex is 9).
 */
interface TrackedFileDoc {
  _id: TrackedFile;
  owner: User;
  file: File;
  currentIndex: number;
  maxIndex: number; // Highest valid index (items.length - 1)
  isVisible: boolean;
}

export default class FileTrackerConcept {
  private trackedFiles: Collection<TrackedFileDoc>;
  private readonly llm: GeminiLLM;

  constructor(private readonly db: Db, llm: GeminiLLM) {
    this.trackedFiles = this.db.collection(PREFIX + "trackedFiles");
    this.llm = llm;
  }

  /**
   * @action startTracking
   * @param owner - the ID of the user
   * @param file - the ID of the file
   * @param itemCount - the total number of items in the file (length of the file content array)
   * @returns {Promise< {id: TrackedFile} | { error: string }>} An empty object on success, or an error object.
   *
   * @requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
   * @effects create a new TrackedFile with this owner and this file. `currentIndex` is initialized to 0.
   *   `maxIndex` is set to `itemCount - 1` (the highest valid index). `isVisible` set to true.
   */
  async startTracking(
    { owner, file, itemCount }: { owner: User; file: File; itemCount: number },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.
    // Validate `itemCount` (which is the length of the file content array)
    if (
      typeof itemCount !== "number" || itemCount < 0 ||
      !Number.isInteger(itemCount)
    ) {
      return {
        error: `Invalid itemCount: ${itemCount}. Must be a non-negative integer.`,
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
      maxIndex: itemCount > 0 ? itemCount - 1 : -1, // Convert item count to highest valid index
      isVisible: true,
    };
    await this.trackedFiles.insertOne(newTrackedFile);
    return { id: newTrackedFile._id };
  }

  /**
   * @action deleteTracking
   * @param owner - The ID of the user.
   * @param file - The ID of the file.
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
   * @param owner - the id of the user
   * @param file - the id of the file
   * @param index - The index to jump to.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex` (highest valid index).
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

    // Validate index against the stored maxIndex (highest valid index)
    if (
      typeof index !== "number" || index < 0 ||
      index > trackedFile.maxIndex ||
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
   * @param owner - the id of the user
   * @param file - the id of the file
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex` (highest valid index).
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
   * @param owner - the id of the user
   * @param file - the id of the file
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
   * @param owner - the ID of the user
   * @param file - the ID of the file
   * @param visible - the desired visibility status
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
   * @action startTrackingUsingLLM
   * @param owner - The ID of the user.
   * @param file - The ID of the file.
   * @param fileContentString - A JSON stringified array of strings, representing the lines of the file content.
   * @param maxIndex - The highest valid index for the file (i.e., `fileContentArray.length - 1`).
   * @returns {Promise<{ id: TrackedFile } | { error: string }>} The ID of the new tracked file on success, or an error object.
   *
   * @requires this `owner` exists, this `file` exists, this `owner` and this `file` isn't already in the set of `TrackedFiles`.
   * @effects uses an internal `llm` to determine a more accurate `currentIndex` for the file based on `fileContentString`,
   *   then creates a new `TrackedFile` document in the database with `isVisible` set to true.
   */
  async startTrackingUsingLLM(
    { owner, file, fileContentString, maxIndex }: {
      owner: User;
      file: File;
      fileContentString: string; // The full content as a JSON stringified array of lines
      maxIndex: number; // The highest valid index (e.g., if there are 10 lines, maxIndex is 9)
    },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Check if tracking already exists for this owner and file
    const existingTracking = await this.trackedFiles.findOne({ owner, file });
    if (existingTracking) {
      return {
        error:
          `Tracking already exists for owner '${owner}' and file '${file}'.`,
      };
    }

    // Validate `maxIndex` (highest valid index)
    if (typeof maxIndex !== "number" || maxIndex < -1 || !Number.isInteger(maxIndex)) {
      return {
        error: `Invalid maxIndex: ${maxIndex}. Must be an integer >= -1.`,
      };
    }

    // Attempt to parse fileContentString early to validate input and catch errors
    let fileLines: string[];
    try {
      fileLines = JSON.parse(fileContentString);
      if (!Array.isArray(fileLines) || !fileLines.every((item) => typeof item === "string")) {
        return { error: "fileContentString must be a JSON stringified array of strings." };
      }
      // Consistency check between maxIndex and parsed content length
      if (fileLines.length === 0 && maxIndex !== -1) {
        return { error: `maxIndex ${maxIndex} is inconsistent with empty file content.` };
      }
      if (fileLines.length > 0 && maxIndex !== fileLines.length - 1) {
        return {
          error:
            `maxIndex ${maxIndex} is inconsistent with file content length ${fileLines.length} (expected ${fileLines.length - 1}).`,
        };
      }
    } catch (e) {
      return {
        error: `Invalid fileContentString: Must be a valid JSON stringified array. Error: ${(e as Error).message}`,
      };
    }

    try {
      // Create the LLM prompt using the parsed file lines and the provided maxIndex
      const prompt = this.createTrackingPrompt(fileLines, maxIndex);
      const text = await this.llm.executeLLM(prompt);

      // Parse LLM response and attempt to create the TrackedFile
      const parseResult = await this.parseAndStartTracking(
        text,
        owner,
        file,
        maxIndex, // Pass the actual maxIndex to the parsing logic
      );
      if ("error" in parseResult) {
        return parseResult;
      }
      return { id: parseResult.id };
    } catch (error) {
      return {
        error: `Failed to start tracking with LLM: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Create the prompt for Gemini with hardwired preferences
   * @param fileLines - The array of strings representing the file content.
   * @param actualFileMaxIndex - The highest valid index for the full file (e.g., 9 for 10 lines).
   * @private
   */
  private createTrackingPrompt(
    fileLines: string[],
    actualFileMaxIndex: number,
  ): string {
    const analysisLines = fileLines.slice(0, 50);
    const fullFileLength = fileLines.length;

    const criticalRequirements = [
      `1. The currentIndex MUST be between 0 and maxIndex (INCLUSIVE). Current max index is ${actualFileMaxIndex}`,
      "2. You are only analyzing the first 50 lines, but your current index should reference the ORIGINAL full file",
      `3. The actual file has ${fullFileLength} total lines (indices from 0 to ${actualFileMaxIndex}), but you only see the first 50 for analysis`,
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

The full file has ${fullFileLength} total lines (indices from 0 to ${actualFileMaxIndex}).

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
    "currentIndex": {YOUR DETERMINED INDEX}, // Must be 0 - ${actualFileMaxIndex}
    "maxIndex": ${actualFileMaxIndex},
}

Return ONLY the JSON object, no additional text. Strictly enforce the integer ranges above — if you cannot satisfy them, return an empty assignments array.
        `;
  }

  /**
   * Parse the LLM response and create a new TrackingFile
   * @private
   */
  private async parseAndStartTracking(
    responseText: string,
    owner: User,
    fileID: File,
    actualMaxIndex: number, // This is the highest valid index for the file
  ): Promise<{ id: TrackedFile } | { error: string }> {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in LLM response");
      }

      const indices = JSON.parse(jsonMatch[0]);

      const issues: string[] = [];

      if (!indices) {
        issues.push(`Invalid response format: ${indices}`);
      }

      // checking format
      if (!("currentIndex" in indices)) {
        issues.push(`LLM response missing 'currentIndex'.`);
      }
      if (!("maxIndex" in indices)) {
        issues.push(`LLM response missing 'maxIndex'.`);
      }

      // If basic structure is missing, return error immediately
      if (issues.length > 0) {
        return { error: `LLM response parsing failed: ${issues.join(" ")}` };
      }

      // checking type
      if (typeof indices.currentIndex !== "number" || !Number.isInteger(indices.currentIndex)) {
        issues.push(`currentIndex ${indices.currentIndex} is not an integer.`);
      }
      if (typeof indices.maxIndex !== "number" || !Number.isInteger(indices.maxIndex)) {
        issues.push(`maxIndex ${indices.maxIndex} is not an integer.`);
      }

      // checking bounds (if types are correct)
      if (issues.length === 0) { // Only check bounds if types are valid numbers
        if (indices.currentIndex < 0 || indices.currentIndex > actualMaxIndex) {
          issues.push(
            `LLM-determined currentIndex ${indices.currentIndex} is out of bounds [0, ${actualMaxIndex}].`,
          );
        }
        if (indices.maxIndex !== actualMaxIndex) {
          issues.push(
            `LLM-determined maxIndex ${indices.maxIndex} does not match expected maxIndex ${actualMaxIndex}.`,
          );
        }
      }

      if (issues.length > 0) {
        return { error: `LLM response validation failed: ${issues.join(" ")}` };
      }

      const trackedFile: TrackedFileDoc = {
        _id: freshID(),
        owner: owner,
        file: fileID,
        currentIndex: indices.currentIndex,
        maxIndex: actualMaxIndex, // Use the actualMaxIndex from input, not LLM's response
        isVisible: true,
      };

      await this.trackedFiles.insertOne(trackedFile);
      return { id: trackedFile._id };
    } catch (error) {
      return {
        error: `Failed to parse LLM response or save tracking: ${
          (error as Error).message
        }`,
      };
    }
  }

  /**
   * @query _getCurrentItem
   * @param owner - the ID of the user
   * @param file - the ID of the file
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
