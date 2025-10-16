---
timestamp: 'Thu Oct 16 2025 14:49:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_144953.ec1c016f.md]]'
content_id: 69e54d42693b5d9145c5520d074a908abcd5add6ecc23072bcea5b3a786dea0e
---

# file: src/concepts/Library/LibraryConcept.ts (Updated)

```typescript
/**
 * @concept Library [User]
 * @purpose manage a collection of files, where each file can contain multiple string items, for users.
 * @principle a user creates a library to store their files; they can create new files (initially with one item),
 * add more items to existing files, modify specific items within a file, or remove items from a file;
 * they can also delete entire files or the whole library if no longer needed.
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
 * @purpose manage a collection of files, where each file can contain multiple string items, for users.
 * @principle a user creates a library to store their files; they can create new files (initially with one item),
 * add more items to existing files, modify specific items within a file, or remove items from a file;
 * they can also delete entire files or the whole library if no longer needed.
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
   * @effects creates a new Library with this owner
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
   * @requires this owner has a Library, and a File with [initialItem] as its items does not already exist in this owner's Library
   * @effects creates a new File with [initialItem] as its content and the current Date, and adds this File to this owner's Library
   */
  async createFile(
    { owner, initialItem }: { owner: User; initialItem: string },
  ): Promise<{ file: File } | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    // Check if a file with exactly this single initial item already exists
    const existingFile = await this.files.findOne({
      library: ownerLibrary._id,
      items: [initialItem], // Exact match for the single-item array
    });
    if (existingFile) {
      return {
        error:
          `A file with '${initialItem}' already exists in the library for user ${owner}.`,
      };
    }

    const newFile: FileDoc = {
      _id: freshID(),
      library: ownerLibrary._id,
      items: [initialItem], // Initialize with a single item
      dateAdded: new Date(),
    };
    await this.files.insertOne(newFile);

    return { file: newFile._id };
  }

  /**
   * @action addItemToFile
   * @requires this owner has a Library, and this file is in this owner's Library, and the item is not already present in the file's items list
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

    // Precondition: item is not already present in the file's items list
    if (targetFile.items.includes(item)) {
      return {
        error: `Item '${item}' already exists in file ${file} for user ${owner}.`,
      };
    }

    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $push: { items: item } },
    );

    return {};
  }

  /**
   * @action modifyItemInFile
   * @requires this owner has a Library, this file is in this owner's Library, index is a valid index for file.items, and newItem is not already present in the file's items list (excluding the item at index)
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

    // Precondition: index is a valid index
    if (index < 0 || index >= targetFile.items.length) {
      return { error: `Index ${index} is out of bounds for file ${file}.` };
    }

    // Precondition: newItem is not already present in the file's items list (excluding the item at index)
    const existingItemsWithoutCurrent = [...targetFile.items];
    existingItemsWithoutCurrent.splice(index, 1); // Remove item at index for check
    if (existingItemsWithoutCurrent.includes(newItem)) {
      return {
        error:
          `Item '${newItem}' already exists in file ${file} (at a different index).`,
      };
    }

    // Use MongoDB's positional operator to update a specific element in the array
    const fieldToUpdate = `items.${index}`;
    await this.files.updateOne(
      { _id: file, library: ownerLibrary._id },
      { $set: { [fieldToUpdate]: newItem } },
    );

    return {};
  }

  /**
   * @action removeItemFromFile
   * @requires this owner has a Library, this file is in this owner's Library, and index is a valid index for file.items
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

    // Precondition: index is a valid index
    if (index < 0 || index >= targetFile.items.length) {
      return { error: `Index ${index} is out of bounds for file ${file}.` };
    }

    // Use $unset to clear the element, then $pull to remove nulls, maintaining order
    // Alternatively, fetch, modify array in memory, then replace, which is safer if order is critical
    const newItems = [...targetFile.items];
    newItems.splice(index, 1); // Remove the item at the specific index

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
