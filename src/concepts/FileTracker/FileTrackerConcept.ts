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
 */
interface TrackedFileDoc {
  _id: TrackedFile;
  owner: User;
  file: File;
  currentIndex: number;
  maxIndex: number;
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
   * @param maxIndex - the total number of items in the file
   * @returns {Promise< {id: TrackedFile} | { error: string }>} An empty object on success, or an error object.
   *
   * @requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
   * @effects create a new TrackedFile with this owner and this file, curentIndex is initialized to 0,
   *   `maxIndex` is the length of the file's items , `isVisible` set to true
   */
  async startTracking(
    { owner, file, maxIndex }: { owner: User; file: File; maxIndex: number },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.
    // Validate `maxIndex`
    if (
      typeof maxIndex !== "number" || maxIndex <= 0 ||
      !Number.isInteger(maxIndex)
    ) {
      return {
        error: `Invalid maxIndex: ${maxIndex}. Must be a non-negative integer.`,
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
      currentIndex: 1,
      maxIndex,
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
   * @param owner - the id of the user
   * @param file - the id of the file
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

    if (trackedFile.currentIndex <= 1) {
      return {
        error:
          `Current index ${trackedFile.currentIndex} is already at or below 1. Cannot move back.`,
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
   * @param file- The ID of the file
   * @param fileInput - a string input for the LLM
   * @param fileMaxIndex - the maximum index for the LLM
   * @returns {Promise<{ id: TrackedFile } | { error: string }>} The ID of the new tracked file on success, or an error object.
   *
   * @requires this `owner` exists, this `file` (referencing `fildId`) exists,
   *   this `owner` and this `file` isn't already in the set of `TrackedFiles`,
   *   this `fileInput` is in JSON format.
   * @effect uses an internal `llm` to determine a more accurate `currentIndex` for the file,
   *   then creates a new `TrackedFile` document in the database.
   */
  async startTrackingUsingLLM(
    { owner, file, fileInput, fileMaxIndex }: {
      owner: User;
      file: File;
      fileInput: string;
      fileMaxIndex: number;
    },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Check if tracking already exists for this owner and file
    const existingTracking = await this.trackedFiles.findOne({
      owner,
      file: file,
    });
    if (existingTracking) {
      return {
        error:
          `Tracking already exists for owner '${owner}' and file '${file}'.`,
      };
    }

    // Attempt to parse fileContentString early to validate input and catch errors
    let fileLines: string[];
    try {
      fileLines = JSON.parse(fileInput);
      if (
        !Array.isArray(fileLines) ||
        !fileLines.every((item) => typeof item === "string")
      ) {
        return {
          error:
            "fileContentString must be a JSON stringified array of strings.",
        };
      }
      // Consistency check between maxIndex and parsed content length
      if (fileLines.length === 0 && fileMaxIndex !== -1) {
        return {
          error:
            `maxIndex ${fileMaxIndex} is inconsistent with empty file content.`,
        };
      }
      if (fileLines.length > 0 && fileMaxIndex !== fileLines.length - 1) {
        return {
          error:
            `maxIndex ${fileMaxIndex} is inconsistent with file content length ${fileLines.length} (expected ${
              fileLines.length - 1
            }).`,
        };
      }
    } catch (e) {
      return {
        error:
          `Invalid fileContentString: Must be a valid JSON stringified array. Error: ${
            (e as Error).message
          }`,
      };
    }

    try {
      // console.log("🤖 Tracking file from Gemini API...");

      const prompt = this.createTrackingPrompt(fileLines, fileMaxIndex);
      const text = await this.llm.executeLLM(prompt);

      // console.log("✅ Received response from Gemini AI!");
      // console.log("\n🤖 RAW GEMINI RESPONSE");
      // console.log("======================");
      // console.log(text);
      // console.log("======================\n");

      // Parse and apply the assignments
      const parseResult = await this.parseAndStartTracking(
        text,
        owner,
        file,
        fileMaxIndex,
      );
      // this.parseAndStartTracking(text);
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
   */
  private createTrackingPrompt(
    fileContent: string[],
    fileMaxIndex: number,
  ): string {
    const analysisLines = fileContent.slice(0, 50);
    const fullFileLength = fileMaxIndex + 1;
    const maxValidIndex = fullFileLength > 0 ? fullFileLength - 1 : 0;

    const criticalRequirements = [
      `1. The currentIndex MUST be between 0 and maxIndex (INCLUSIVE). Current max index is ${maxValidIndex}`,
      "2. You are only analyzing the first 50 lines, but your current index should reference the ORIGINAL full file",
      `3. The actual file has ${fullFileLength} total lines, but you only see the first 50 for analysis`,
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

The full file has ${fileMaxIndex + 1} total lines.

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
    "currentIndex": {YOUR DETERMINED INDEX}, // Must be 0 - ${fileMaxIndex}
}

Return ONLY the JSON object, no additional text. Strictly enforce the integer ranges above — if you cannot satisfy them, return an empty assignments array.
        `;
  }

  /**
   * Parse the LLM response and create a new TrackingFile
   */
  private async parseAndStartTracking(
    responseText: string,
    owner: User,
    file: File,
    fileMaxIndex: number,
  ): Promise<{ id: TrackedFile } | { error: string }> {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const indices = JSON.parse(jsonMatch[0]);

      const issues: string[] = [];

      if (!indices) {
        issues.push(`Invalid response format: ${indices}`);
      }

      // console.log("📝 Applying LLM Tracking...");

      // checking format
      if (!indices.currentIndex) {
        issues.push(`Invalid response, there is no currentIndex passed in.`);
      }

      // checking bounds
      if (indices.currentIndex < 0 || indices.currentIndex > fileMaxIndex) {
        issues.push(`currentIndex ${indices.currentIndex} is out of bounds`);
      }

      // checking type
      if (typeof indices.currentIndex !== "number") {
        issues.push(`currentIndex ${indices.currentIndex} is not a number`);
      }

      const trackedFile: TrackedFileDoc = {
        _id: freshID(),
        owner: owner,
        file: file,
        currentIndex: indices.currentIndex,
        maxIndex: fileMaxIndex,
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

  /**
   * @query _getVisibility
   * @param owner - the ID of the user
   * @param file - the ID of the file
   * @returns Promise<{ isVisible: boolean } | { error: string }> the visibility flag of the file on success
   */
  async _getVisibility(
    { owner, file }: { owner: User; file: File },
  ): Promise<{ isVisible: boolean } | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return {
        error: `No tracking found for owner '${owner}' and file '${file}'.`,
      };
    }
    return { isVisible: trackedFile.isVisible };
  }
}
