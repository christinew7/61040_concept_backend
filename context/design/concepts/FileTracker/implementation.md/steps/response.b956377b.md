---
timestamp: 'Thu Oct 16 2025 15:55:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_155501.8b27e05f.md]]'
content_id: b956377b14d4f68cd3a28607c547c866d75f300bae874a191d03ae1148b09250
---

# response:

To adhere to the concept design rules, specifically:

1. **"No import statements can reference another concept in any way, including type declarations."** This means `FileTrackerConcept` cannot import `FileDoc` from `LibraryConcept`.
2. **"Every action must take a single argument, and output a single argument: both of these are a dictionary/JSON object with primitive values (no custom objects)."** This means the `items: string[]` (which is an array, a composite JSON type, not a primitive) cannot be directly passed as part of the action's input argument.

The `startTrackingUsingLLM` action needs the file's content (`items: string[]`) to generate the LLM prompt. Since it cannot receive this content as an argument and cannot import another concept (`LibraryConcept`) to define a type for fetching it, the only way to satisfy the user's request to "find the file id" and its associated content *within* `FileTrackerConcept` is for `FileTrackerConcept` to:

* Accept only the `file` ID (a primitive `ID` type).
* *Implicitly* know the name and structure of the `Library` concept's `files` collection to retrieve the `items`.

This approach creates an implicit dependency on `Library`'s collection schema and naming within `FileTrackerConcept`, which goes against the *spirit* of "concept independence" as described in the Concept Design document. However, given the explicit constraints and the user's specific request to "find the file id" *and* "keep it modular" (interpreted as avoiding explicit `import` statements), this is the necessary compromise.

Here's the refactored `FileTrackerConcept` implementation and updated tests:

```typescript
// file: src/concepts/FileTracker/FileTrackerConcept.ts
/**
 * @concept FileTracker [User, File]
 * @purpose track current position and enable navigation within files
 * @principle a user can start tracking their file from the first listed item (which might not be the first item)
 *  a user can also use an LLM to start tracking their file at a better suited item within the file
 *  they can move through file items sequentially without losing their place or skip to a file item
 *  and control how progress is displayed
 */
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { GeminiLLM } from "@utils/gemini-llm.ts";

/**
 * @concept FileTracker
 * @purpose track current position and enable navigation within files
 * @principle a user can start tracking their file from the first listed item (which might not be the first item)
 *  a user can also use an LLM to start tracking their file at a better suited item within the file
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

/**
 * Internal representation of a file's content, fetched from the database.
 * This locally defines the necessary parts of a FileDoc from the Library concept
 * to avoid direct import, while acknowledging an implicit dependency.
 */
interface LibraryFileContent {
  _id: File;
  items: string[]; // The actual line-by-line content of the file
}

export default class FileTrackerConcept {
  private trackedFiles: Collection<TrackedFileDoc>;
  private readonly llm: GeminiLLM;
  private readonly libraryFilesCollection: Collection<LibraryFileContent>; // Implicit dependency

  constructor(private readonly db: Db, llm: GeminiLLM) {
    this.trackedFiles = this.db.collection(PREFIX + "trackedFiles");
    this.llm = llm;
    // Implicitly referencing the 'files' collection managed by the 'Library' concept.
    // This avoids a direct import of LibraryConcept or FileDoc, but maintains a
    // structural dependency on its collection name and schema.
    this.libraryFilesCollection = this.db.collection("Library.files");
  }

  /**
   * @action startTracking
   * @param owner - the ID of the user
   * @param file - the ID of the file
   * @param maxIndex - the total number of items in the file
   * @returns {Promise< {id: TrackedFile} | { error: string }>} An empty object on success, or an error object.
   *
   * @requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
   * @effects create a new TrackedFile with this owner and this file, currentIndex is initialized to 0,
   *   `maxIndex` is the length of the file's items , `isVisible` set to true
   */
  async startTracking(
    { owner, file, maxIndex }: { owner: User; file: File; maxIndex: number },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    // Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.
    // Validate `maxIndex`
    if (
      typeof maxIndex !== "number" || maxIndex < 0 ||
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
      currentIndex: 0,
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
   * @param file - The ID of the file whose content will be analyzed by the LLM.
   * @returns {Promise<{ id: TrackedFile } | { error: string }>} The ID of the new tracked file on success, or an error object.
   *
   * @requires this `owner` exists, this `file` (referencing the file ID) exists,
   *   this `owner` and this `file` isn't already in the set of `TrackedFiles`.
   * @effect retrieves file content from the Library concept's collection,
   *   uses an internal `llm` to determine a more accurate `currentIndex` for the file,
   *   then creates a new `TrackedFile` document in the database.
   */
  async startTrackingUsingLLM(
    { owner, file }: { owner: User; file: File },
  ): Promise<{ id: TrackedFile } | { error: string }> {
    const fileID = file;

    // First, check if tracking already exists for this owner and file
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

    // Attempt to retrieve file content from the Library's files collection
    // This creates an implicit dependency on the Library concept's collection name and schema.
    const fileContent = await this.libraryFilesCollection.findOne({
      _id: fileID,
    });

    if (!fileContent) {
      return { error: `File '${fileID}' not found in the library.` };
    }

    const fileItems = fileContent.items;
    // Calculate the actual max index based on the retrieved file content
    const actualMaxIndex = fileItems.length > 0 ? fileItems.length - 1 : 0;

    // Validate file content
    if (!Array.isArray(fileItems) || fileItems.length === 0) {
      return {
        error: `File content (items) is empty or invalid for file '${fileID}'.`,
      };
    }

    try {
      // console.log("🤖 Tracking file from Gemini API...");

      const prompt = this.createTrackingPrompt({ id: fileID, items: fileItems });
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
        fileID,
        actualMaxIndex,
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
   * @param fileContent - Internal helper for LLM prompt generation, not an exposed action argument type.
   */
  private createTrackingPrompt(fileContent: { id: File; items: string[] }): string {
    const analysisLines = fileContent.items.slice(0, 50);
    const fullFileLength = fileContent.items.length;
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

The full file has ${fileContent.items.length} total lines.

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
    "currentIndex": {YOUR DETERMINED INDEX}, // Must be 0 - ${
      fileContent.items.length - 1
    },
    "maxIndex": ${fileContent.items.length - 1},
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
    fileID: File,
    actualMaxIndex: number,
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
      if (typeof indices.currentIndex === "undefined") {
        issues.push(`Invalid response, there is no currentIndex passed in.`);
      }
      if (typeof indices.maxIndex === "undefined") {
        issues.push(`Invalid response, there is no maxIndex passed in.`);
      }

      // If we have issues with missing keys, report them early
      if (issues.length > 0) {
        return { error: `LLM response parsing errors: ${issues.join("; ")}` };
      }

      // checking bounds
      if (indices.currentIndex < 0 || indices.currentIndex > indices.maxIndex) {
        issues.push(`currentIndex ${indices.currentIndex} is out of bounds`);
      }
      if (indices.maxIndex !== actualMaxIndex) {
        issues.push(`maxIndex ${indices.maxIndex} is not correct`);
      }

      // checking type
      if (typeof indices.currentIndex !== "number" || !Number.isInteger(indices.currentIndex)) {
        issues.push(`currentIndex ${indices.currentIndex} is not an integer number`);
      }
      if (typeof indices.maxIndex !== "number" || !Number.isInteger(indices.maxIndex)) {
        issues.push(`maxIndex ${indices.maxIndex} is not an integer number`);
      }

      if (issues.length > 0) {
        return { error: `LLM response validation errors: ${issues.join("; ")}` };
      }

      const trackedFile: TrackedFileDoc = {
        _id: freshID(),
        owner: owner,
        file: fileID,
        currentIndex: indices.currentIndex,
        maxIndex: actualMaxIndex, // Use the actualMaxIndex calculated from retrieved file items
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

```typescript
// file: src/concepts/Library/LibraryConcept.ts
/**
 * @concept Library [User]
 * @purpose manage collection of files for users
 * @principle a user creates a library to store their files
 * the user can add, retrieve, modify, or delete files within their library
 * and they can delete the library if it's no longer needed
 */
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "Library" + ".";

// Generic types for this concept
type User = ID;
type Library = ID;
type File = ID;

/**
 * @state
 * a set of Libraries with
 *   an owner User
 */
export interface LibraryDoc {
  _id: Library;
  owner: User;
}

/**
 * @state
 * a set of Files with
 *   a library Library
 *   an items List<String>
 *   a dateAdded DateTime
 */
export interface FileDoc {
  _id: File;
  library: Library;
  items: string[];
  dateAdded: Date;
}

/**
 * @concept Library [User]
 * @purpose manage collection of files for users
 * @principle a user creates a library to store their files;
 * the user can add, retrieve, modify, or delete files within their library;
 * and they can delete the library if it's no longer needed
 */
export default class LibraryConcept {
  private libraries: Collection<LibraryDoc>;
  private files: Collection<FileDoc>;

  constructor(private readonly db: Db) {
    this.libraries = this.db.collection(PREFIX + "libraries");
    this.files = this.db.collection(PREFIX + "files");
  }

  /**
   * @action create
   * @requires this owner doesn't already have a Library
   * @effects creates a new Library with this owner and an empty set of Files
   */
  async create(
    { owner }: { owner: User },
  ): Promise<{ library: Library } | { error: string }> {
    const existingLibrary = await this.libraries.findOne({ owner });
    if (existingLibrary) {
      return { error: `User ${owner} already has a library.` };
    }

    const newLibrary: LibraryDoc = {
      _id: freshID(),
      owner,
    };
    await this.libraries.insertOne(newLibrary);

    return { library: newLibrary._id };
  }

  /**
   * @action delete
   * @requires this owner has a Library
   * @effects deletes this owner's Library and all associated Files
   */
  async delete({ owner }: { owner: User }): Promise<Empty | { error: string }> {
    const libraryToDelete = await this.libraries.findOne({ owner });
    if (!libraryToDelete) {
      return { error: `User ${owner} does not have a library to delete.` };
    }

    await this.libraries.deleteOne({ _id: libraryToDelete._id });
    await this.files.deleteMany({ library: libraryToDelete._id });

    return {};
  }

  /**
   * @action createFile
   * @requires this owner has a Library
   * @effects creates a File with the current DateTime and an empty items, and adds this File to this owner's Library
   */
  async createFile(
    { owner }: { owner: User },
  ): Promise<{ id: File } | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const newFile: FileDoc = {
      _id: freshID(),
      library: ownerLibrary._id,
      items: [], // As per spec, initially empty
      dateAdded: new Date(),
    };
    await this.files.insertOne(newFile);

    return { id: newFile._id };
  }

  /**
   * @action addItemToFile
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects adds item to the items list of this file
   */
  async addItemToFile(
    { owner, file, item }: { owner: User; file: File; item: string },
  ): Promise<Empty | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const targetFile = await this.files.findOne({
      _id: file,
      library: ownerLibrary._id,
    });
    if (!targetFile) {
      return { error: `File ${file} not found in library for user ${owner}.` };
    }

    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $push: { items: item } },
    );

    return {};
  }

  /**
   * @action modifyItemInFile
   * @requires this owner has a Library, this file is in this owner's Library, index is a valid index for file.items (in [0, items.length()))
   * @effects replaces the item at index in file.items with newItem
   */
  async modifyItemInFile(
    { owner, file, index, newItem }: {
      owner: User;
      file: File;
      index: number;
      newItem: string;
    },
  ): Promise<Empty | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const targetFile = await this.files.findOne({
      _id: file,
      library: ownerLibrary._id,
    });
    if (!targetFile) {
      return { error: `File ${file} not found in library for user ${owner}.` };
    }

    if (index < 0 || index >= targetFile.items.length) {
      return { error: `Index ${index} is out of bounds for file ${file}.` };
    }

    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $set: { [`items.${index}`]: newItem } }, // Use dot notation for array element update
    );

    return {};
  }

  /**
   * @action removeItemFromFile
   * @requires this owner has a Library, this file is in this owner's Library, and index is a valid index for file.items (in [0, items.length()))
   * @effects removes the item at index from file.items
   */
  async removeItemFromFile(
    { owner, file, index }: { owner: User; file: File; index: number },
  ): Promise<Empty | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const targetFile = await this.files.findOne({
      _id: file,
      library: ownerLibrary._id,
    });
    if (!targetFile) {
      return { error: `File ${file} not found in library for user ${owner}.` };
    }

    if (index < 0 || index >= targetFile.items.length) {
      return { error: `Index ${index} is out of bounds for file ${file}.` };
    }

    const newItems = [
      ...targetFile.items.slice(0, index),
      ...targetFile.items.slice(index + 1),
    ];

    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $set: { items: newItems } },
    );

    return {};
  }

  /**
   * @action deleteFile
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects deletes this file from this owner's Library
   */
  async deleteFile(
    { owner, file }: { owner: User; file: File },
  ): Promise<Empty | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    // Delete the specific file associated with the library
    const deleteResult = await this.files.deleteOne({
      _id: file,
      library: ownerLibrary._id,
    });
    // verifies the file was actually deleted
    if (deleteResult.deletedCount === 0) {
      return { error: `File ${file} not found in library for user ${owner}.` };
    }

    return {};
  }

  /**
   * @query _getAllFiles
   * @requires this owner has a Library
   * @effects returns all Files in this owner's Library (full FileDoc objects, not just IDs)
   */
  async _getAllFiles(
    { owner }: { owner: User },
  ): Promise<{ files: FileDoc[] } | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const allFiles = await this.files.find({ library: ownerLibrary._id })
      .toArray();
    return { files: allFiles };
  }
}

```

```typescript
// file: src/concepts/FileTracker/FileTrackerConcept.test.ts
import {
  assertEquals,
  assertExists,
  assertNotEquals,
  assertObjectMatch,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import FileTrackerConcept from "./FileTrackerConcept.ts";
import LibraryConcept from "../Library/LibraryConcept.ts"; // Import LibraryConcept for test setup
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

const file1 = "file:FileA" as ID;
const file1MaxIndex = 9; // 10 items
const file2 = "file:FileB" as ID;

Deno.test("Principle: a user starts tracking their file from the first listed item, they can move through file items sequentially without losing their place or skip to a file item; and control how progress is displayed", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);
  const libraryConcept = new LibraryConcept(db); // Initialize LibraryConcept for setup

  // Ensure Alice has a library
  await libraryConcept.create({ owner: userAlice });

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
        "Current index should be 1 after one 'back'",
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
  const libraryConcept = new LibraryConcept(db);

  // Ensure users have libraries
  await libraryConcept.create({ owner: userAlice });
  await libraryConcept.create({ owner: userBob });

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
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const concept = new FileTrackerConcept(db, llm);
  const libraryConcept = new LibraryConcept(db);

  // Ensure Alice has a library
  await libraryConcept.create({ owner: userAlice });
  await libraryConcept.create({ owner: userBob }); // Create for Bob too, for non-existent scenario

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
  const libraryConcept = new LibraryConcept(db);

  // Ensure Alice has a library
  await libraryConcept.create({ owner: userAlice });

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
    const config = await loadConfig();
    const llm = new GeminiLLM(config);
    const concept = new FileTrackerConcept(db, llm);
    const libraryConcept = new LibraryConcept(db);

    // Ensure Charlie has a library (even if not tracking a specific file yet)
    const userCharlie = "user:Charlie" as ID;
    await libraryConcept.create({ owner: userCharlie });

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
  const libraryConcept = new LibraryConcept(db);

  // Ensure Alice has a library
  await libraryConcept.create({ owner: userAlice });

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

// startTracking w/ llm

Deno.test("Action: startTrackingUsingLLM with different styles of patterns", async (t) => {
  const [db, client] = await testDb();
  const config = await loadConfig();
  const llm = new GeminiLLM(config);
  const fileTrackerConcept = new FileTrackerConcept(db, llm);
  const libraryConcept = new LibraryConcept(db);

  await libraryConcept.create({ owner: userAlice }); // Ensure Alice has a library

  await t.step(
    "1. Basic instruction with clear starting instructions",
    async () => {
      const fileId = "file:fileA" as ID;
      const items = [
        "Materials",
        "Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",
        "Tools",
        "Hook: 4mm",
        "Darning Needle",
        "Scissors",
        "Instructions",
        "Foundation Chain: Ch 6, ss in 6th ch from hook to form a ring.", // index 7
        "Round One: Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.",
      ];

      // Setup file in LibraryConcept
      const fileCreationResult = await libraryConcept.createFile({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in fileCreationResult,
        true,
        `Failed to create file for Alice: ${JSON.stringify(fileCreationResult)}`,
      );
      const actualFileId = (fileCreationResult as { id: ID }).id;

      for (const item of items) {
        await libraryConcept.addItemToFile({
          owner: userAlice,
          file: actualFileId,
          item,
        });
      }

      const startResult = await fileTrackerConcept.startTrackingUsingLLM({
        owner: userAlice,
        file: actualFileId,
      });
      assertNotEquals(
        "error" in startResult,
        true,
        "There should be no error in starting a new tracking with LLM",
      );
      assertExists(
        (startResult as { id: ID }).id,
        "Tracked file ID should be returned.",
      );

      const currentStatus = await fileTrackerConcept._getCurrentItem({
        owner: userAlice,
        file: actualFileId,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      assertEquals(
        (currentStatus as { index: number }).index,
        7,
        "LLM should correctly identify the start of 'Foundation Chain' instructions in file.",
      );
    },
  );

  await t.step(
    "2. File has lots of miscellaneous comments and prep instructions before",
    async () => {
      const fileId = "file:miscFile" as ID;
      const items = [
        "Materials",
        "Bernat Softee Baby (soft peach) or any 3 weight yarn (See chart below for yardage)",
        "5 mm (H-8) crochet hook (or any hook size needed to obtain gauge)",
        "Yarn needle",
        "Scissors",
        "Measuring tape",
        "Click for more info about Yarn Needle Tapestry Needle Sewing Needles Weaving Needle Darning Needles Bent in Box  Click for more info about Bernat® Softee® Baby Solid Yarn  Click for more info about Soft Tape Measure,Double Scale 60 Inch(150CM)  Click for more info about 5 Pieces Stainless Steel Tip Classic Stork Scissors Crane Design 3.6 Inch Sewing Dressmaker Sciss...  Click for more info about Tulip TP1166 Etimo Crochet Hook Set",
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
        "Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch)  from back to front  (2 loops on hook).",
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
        "Foundation Row: ch (see size chart for size being made), in second ch from the hook hdc, hdc into each ch across, turn. (36,96,120,132,156,204,2 76,324)", // index 48
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

      // Setup file in LibraryConcept
      const fileCreationResult = await libraryConcept.createFile({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in fileCreationResult,
        true,
        `Failed to create file for Alice: ${JSON.stringify(fileCreationResult)}`,
      );
      const actualFileId = (fileCreationResult as { id: ID }).id;

      for (const item of items) {
        await libraryConcept.addItemToFile({
          owner: userAlice,
          file: actualFileId,
          item,
        });
      }

      const startResult = await fileTrackerConcept.startTrackingUsingLLM({
        owner: userAlice,
        file: actualFileId,
      });
      assertNotEquals(
        "error" in startResult,
        true,
        "There should be no error in starting a new tracking with LLM",
      );
      assertExists(
        (startResult as { id: ID }).id,
        "Tracked file ID should be returned.",
      );

      const currentStatus = await fileTrackerConcept._getCurrentItem({
        owner: userAlice,
        file: actualFileId,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      assertEquals(
        (currentStatus as { index: number }).index,
        48,
        "LLM should correctly identify the start of 'Foundation Row' instructions in file.",
      );
    },
  );

  await t.step(
    "3. Pattern has a lot of different instruction sections",
    async () => {
      const fileId = "file:instructionsFile" as ID;
      const items = [
        "🧶 Materials 🧶",
        "🧶 Yarn: DK weight yarn – Samples feature Paintbox Simply Aran, 100% Cotton Tea Rose (643) Pale Lilac (646) Bubblegum Pink (651)",
        "🪛 Tools 🪡",
        "Hook: 4mm",
        "Darning Needle",
        "Scissors",
        "",
        "Single crochet",
        "1️⃣ Insert hook from front to back in the second chain from the hook or designated stitch",
        "2️⃣ Bring the yarn over (yo) the hook and pull the yarn back through the chain (or stitch)  from back to front  (2 loops on hook).",
        "3️⃣ Yo and pull through both loops on the hook.",
        "Body",
        "1️⃣ Ch 6, ss in 6th ch from hook to form a ring.",
        "2️⃣ Ch 3(counts as a tr here and throughout), 19 tr in ring, join with ss in top of ch- 3.",
      ];

      // Setup file in LibraryConcept
      const fileCreationResult = await libraryConcept.createFile({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in fileCreationResult,
        true,
        `Failed to create file for Alice: ${JSON.stringify(fileCreationResult)}`,
      );
      const actualFileId = (fileCreationResult as { id: ID }).id;

      for (const item of items) {
        await libraryConcept.addItemToFile({
          owner: userAlice,
          file: actualFileId,
          item,
        });
      }

      const startResult = await fileTrackerConcept.startTrackingUsingLLM({
        owner: userAlice,
        file: actualFileId,
      });
      assertNotEquals(
        "error" in startResult,
        true,
        "There should be no error in starting a new tracking with LLM",
      );
      assertExists(
        (startResult as { id: ID }).id,
        "Tracked file ID should be returned.",
      );

      const currentStatus = await fileTrackerConcept._getCurrentItem({
        owner: userAlice,
        file: actualFileId,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      assertEquals(
        (currentStatus as { index: number }).index,
        12,
        "LLM should correctly identify the start of 'Body' instructions in file.",
      );
    },
  );

  await t.step(
    "4. Pattern that has been scanned with OCR errors and typos",
    async () => {
      const items = [
        "vintage  pattern   from  1978",
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
      const fileId = "file:typoFile" as ID;

      // Setup file in LibraryConcept
      const fileCreationResult = await libraryConcept.createFile({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in fileCreationResult,
        true,
        `Failed to create file for Alice: ${JSON.stringify(fileCreationResult)}`,
      );
      const actualFileId = (fileCreationResult as { id: ID }).id;

      for (const item of items) {
        await libraryConcept.addItemToFile({
          owner: userAlice,
          file: actualFileId,
          item,
        });
      }

      const startResult = await fileTrackerConcept.startTrackingUsingLLM({
        owner: userAlice,
        file: actualFileId,
      });
      assertNotEquals(
        "error" in startResult,
        true,
        "There should be no error in starting a new tracking with LLM",
      );
      assertExists(
        (startResult as { id: ID }).id,
        "Tracked file ID should be returned.",
      );

      const currentStatus = await fileTrackerConcept._getCurrentItem({
        owner: userAlice,
        file: actualFileId,
      });
      assertEquals(
        "error" in currentStatus,
        false,
        `_getCurrentItem failed: ${JSON.stringify(currentStatus)}`,
      );
      assertEquals(
        (currentStatus as { index: number }).index,
        10,
        "LLM should correctly identify the start of 'ohain l50' instructions in file.",
      );
    },
  );

  await t.step("5. File does not exist in Library (fails)", async () => {
    const nonExistentFileId = "file:nonexistent" as ID;
    const startResult = await fileTrackerConcept.startTrackingUsingLLM({
      owner: userAlice,
      file: nonExistentFileId,
    });
    assertEquals(
      "error" in startResult,
      true,
      "Should return an error for a non-existent file.",
    );
    assertEquals(
      (startResult as { error: string }).error,
      `File '${nonExistentFileId}' not found in the library.`,
      "Error message should indicate file not found.",
    );
  });

  await client.close();
});

```
