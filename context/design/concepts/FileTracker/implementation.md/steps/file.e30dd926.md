---
timestamp: 'Sun Oct 12 2025 19:35:18 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_193518.3a2fb4b4.md]]'
content_id: e30dd92669fe06a57e5dc9c854586ed3c765e5c7971dcdf42ad87fdd9a069916
---

# file: src/concepts/FileTracker/FileTrackerConcept.ts

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

/**
 * @concept FileTracker
 * @purpose track current position and enable navigation within files
 * @principle a user can create a FileTracker to keep track of their position in various files;
 *   they can track or untrack files, move through file items sequentially or skip to a specific file item;
 *   and they can control how their progress is displayed.
 */

// Declare collection prefix, use concept name
const PREFIX = "FileTracker" + ".";

/**
 * Generic types of this concept
 * User and File are IDs, treated as branded strings.
 */
type User = ID;
type File = ID;

/**
 * a set of TrackedFiles with
 *    document ID
 */
interface TrackedFileDoc {
  owner: User;
  file: File;
  currentIndex: number;
  maxIndex: number;
  isVisible: boolean;
}

export default class FileTrackerConcept {
  private trackedFiles: Collection<TrackedFileDoc>;

  constructor(private readonly db: Db) {
    this.trackedFiles = this.db.collection(PREFIX + "trackedFiles");
  }

  /**
   * @action startTracking
   * @param owner - the ID of the user
   * @param file - the ID of the file
   * @param maxIndex - the total number of items in the file
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   *
   * @requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
   * @effects create a new TrackedFile with this owner and this file, curentIndex is initialized to 0,
   *   `maxIndex` is the length of the file's items , `isVisible` set to true
   */
  async startTracking({ owner, file, maxIndex }: { owner: User; file: File; maxIndex: number }): Promise<Empty | { error: string }> {
    // Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.
    // Validate `maxIndex`
    if (typeof maxIndex !== "number" || maxIndex <= 0 || !Number.isInteger(maxIndex)) {
      return { error: `Invalid maxIndex: ${maxIndex}. Must be a non-negative integer.` };
    }

    // Check if tracking already exists for this owner and file
    const existingTracking = await this.trackedFiles.findOne({ owner, file });
    if (existingTracking) {
      return { error: `Tracking already exists for owner '${owner}' and file '${file}'.` };
    }

    try {
      await this.trackedFiles.insertOne({
        _id: freshID(),
        owner,
        file,
        currentIndex: 0,
        maxIndex,
        isVisible: true,
      });
      return {};
    } catch (e) {
      console.error("Error starting tracking:", e);
      return { error: "Failed to start tracking due to a database issue." };
    }
  }

  /**
   * @action deleteTracking
   * @param {object} params - The action parameters.
   * @param {User} params.owner - The ID of the user.
   * @param {File} params.file - The ID of the file.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` is in the set of TrackedFiles
   * @effects delete the `TrackedFile` with this `owner` and this `file`
   */
  async deleteTracking({ owner, file }: { owner: User; file: File }): Promise<Empty | { error: string }> {
    const result = await this.trackedFiles.deleteOne({ owner, file });
    if (result.deletedCount === 0) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }
    return {};
  }

  /**
   * @action jumpTo
   * @param {object} params - The action parameters.
   * @param {User} params.owner - The ID of the user.
   * @param {File} params.file - The ID of the file.
   * @param {number} params.index - The index to jump to.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`
   * @effects updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`
   */
  async jumpTo({ owner, file, index }: { owner: User; file: File; index: number }): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }

    // Validate index
    if (typeof index !== "number" || index < 0 || index > trackedFile.maxIndex || !Number.isInteger(index)) {
      return { error: `Index '${index}' is out of bounds [0, ${trackedFile.maxIndex}] or not an integer.` };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $set: { currentIndex: index } },
    );
    return {};
  }

  /**file - The ID of the file.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`
   * @effects increments the TrackedFile with this owner and this file by 1
   */
  async next({ owner, file }: { owner: User; file: File }): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }

    if (trackedFile.currentIndex >= trackedFile.maxIndex) {
      return { error: `Current index ${trackedFile.currentIndex} is already at or beyond max index ${trackedFile.maxIndex}. Cannot move next.` };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $inc: { currentIndex: 1 } },
    );
    return {};
  }

  /**
   * @action back
   * @param {object} params - The action parameters.
   * @param {User} params.owner - The ID of the user.
   * @param {File} params.file - The ID of the file.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
   * @effects decrements the TrackedFile with this owner and this file by 1
   */
  async back({ owner, file }: { owner: User; file: File }): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }

    if (trackedFile.currentIndex <= 0) {
      return { error: `Current index ${trackedFile.currentIndex} is already at or below 0. Cannot move back.` };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $inc: { currentIndex: -1 } },
    );
    return {};
  }

  /**
   * @action getCurrentItem
   * @param {object} params - The action parameters.
   * @param {User} params.owner - The ID of the user.
   * @param {File} params.file - The ID of the file.
   * @returns {Promise<{ index: number } | { error: string }>} The current index on success, or an error object.
   * @requires this owner and this file exists in the TrackedFiles
   * @effects in the TrackedFile with this owner and this file, return the currentIndex
   */
  async getCurrentItem({ owner, file }: { owner: User; file: File }): Promise<{ index: number } | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }
    return { index: trackedFile.currentIndex };
  }

  /**
   * @action setVisibility
   * @param {object} params - The action parameters.
   * @param {User} params.owner - The ID of the user.
   * @param {File} params.file - The ID of the file.
   * @param {boolean} params.visible - The desired visibility status.
   * @returns {Promise<Empty | { error: string }>} An empty object on success, or an error object.
   * @requires this owner and this file exists in the TrackedFiles
   * @effects in the TrackedFile with this owner and this file, set isVisible to this visible
   */
  async setVisibility({ owner, file, visible }: { owner: User; file: File; visible: boolean }): Promise<Empty | { error: string }> {
    const trackedFile = await this.trackedFiles.findOne({ owner, file });
    if (!trackedFile) {
      return { error: `No tracking found for owner '${owner}' and file '${file}'.` };
    }

    // Validate visible
    if (typeof visible !== "boolean") {
      return { error: `Invalid visible value: ${visible}. Must be a boolean.` };
    }

    await this.trackedFiles.updateOne(
      { _id: trackedFile._id },
      { $set: { isVisible: visible } },
    );
    return {};
  }
}

```
