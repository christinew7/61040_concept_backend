---
timestamp: 'Thu Oct 16 2025 15:12:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_151227.29eae03f.md]]'
content_id: 36520a38ae21f7b1397061bb9ffe46ef9836a22b82fd36ce8dc068b6bc82a16f
---

# file: src/concepts/Library/LibraryConcept.ts

```typescript
/**
 * @concept Library [User]
 * @purpose manage collection of files for users
 * @principle a user creates a library to store their files;
 * the user can add, retrieve, modify, or delete files within their library;
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
 *   a content String (formerly items List<String>)
 *   a dateAdded DateTime
 */
export interface FileDoc {
  _id: File;
  library: Library;
  content: string; // Changed from items: string[]
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
   * @action createFile (formerly addFile)
   * @requires this owner has a Library, and a File with this content doesn't already exist in this owner's Library
   * @effects creates a File with the given content and the current DateTime, and adds this File to this owner's Library
   */
  async createFile( // Renamed from addFile
    { owner, content }: { owner: User; content: string }, // Changed items: string[] to content: string
  ): Promise<{ file: File } | { error: string }> { // Changed id: File to file: File
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    // Check for existing file with this content
    const existingFile = await this.files.findOne({
      library: ownerLibrary._id,
      content, // Check content instead of items
    });

    if (existingFile) {
      return {
        error:
          `A file with this content already exists in the library for user ${owner}.`,
      };
    }

    const newFile: FileDoc = {
      _id: freshID(),
      library: ownerLibrary._id,
      content, // Use content
      dateAdded: new Date(),
    };
    await this.files.insertOne(newFile);

    return { file: newFile._id }; // Return file ID
  }

  /**
   * @action modifyFileContent (formerly modifyFile)
   * @requires this owner has a Library, this file is in this owner's Library, and a different File with newContent doesn't already exist in this owner's Library
   * @effects replaces the content of this file with newContent
   */
  async modifyFileContent( // Renamed from modifyFile
    { owner, file, newContent }: { owner: User; file: File; newContent: string }, // Changed items: string[] to newContent: string
  ): Promise<{ file: File } | { error: string }> { // Changed id: File to file: File
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

    // Precondition check: A different File with newContent must not already exist in the library
    const existingFileWithNewContent = await this.files.findOne({
      _id: { $ne: file }, // Exclude the current file
      library: ownerLibrary._id,
      content: newContent, // Check for content match
    });
    if (existingFileWithNewContent) {
      return {
        error:
          `A different file with this content already exists in the library for user ${owner}.`,
      };
    }

    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $set: { content: newContent } }, // Update content field
    );

    return { file }; // Return file ID
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
   * @effects returns all Files in this owner's Library (full FileDoc objects)
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
