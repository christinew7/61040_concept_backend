[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@Library](Library.md)

[@Library implementation](../../../src/concepts/Library/LibraryConcept.ts)

# context:
- **Composite objects**. Make sure that all of the arguments and results of your actions are either primitive values (strings, numbers, etc) or object identifiers (actually document identifiers in MongoDB). Composite objects should be used only inside concept implementations and never exposed.

# prompt: can you help me update my implementation to include the image files

# response:

Okay, let's update your `LibraryConcept.ts` implementation to include the `image` field for `File` objects, as specified in your concept design.

Here are the changes:

1.  **Updated `FileDoc` interface**: Added `image?: string | null;` to represent the optional image.
2.  **Updated `createFile` action**: Initialized the `image` field to `null` (or omitted, which implicitly makes it `undefined` in TS, but `null` is often preferred for explicit "no value" in databases) in newly created files. I'll use `null` for explicitness.
3.  **Implemented `setImageToFile` action**: Adds the logic to set the `image` for a given file.
4.  **Implemented `clearImageFromFile` action**: Adds the logic to clear (set to `null`) the `image` for a given file.

```typescript
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
 *   an image String (optional)
 *   a dateAdded DateTime
 */
export interface FileDoc {
  _id: File;
  library: Library;
  items: string[];
  image?: string | null; // Added image field, optional and can be null
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
   * @effects creates a File with the current DateTime and an empty items, and no image, and adds this File to this owner's Library
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
      image: null, // No image initially, as per spec
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
   * @action setImageToFile
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects sets the image field of this file to image
   */
  async setImageToFile(
    { owner, file, image }: { owner: User; file: File; image: string },
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
      { $set: { image: image } },
    );

    return {};
  }

  /**
   * @action clearImageFromFile
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects clears the image field of this file (sets to null)
   */
  async clearImageFromFile(
    { owner, file }: { owner: User; file: File },
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
      { $set: { image: null } }, // Set image to null to clear it
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

  /**
   * @query _getFileString
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects returns the items list of the specified file as a JSON string
   */
  async _getFileString(
    { owner, file }: { owner: User; file: File },
  ): Promise<{ fileString: string } | { error: string }> {
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return { error: `User ${owner} does not have a library.` };
    }

    const fileInDoc = await this.files.findOne({
      library: ownerLibrary._id,
      _id: file,
    });
    if (!fileInDoc) {
      return { error: `File ${file} not found in the user ${owner}'s library` };
    }
    const items = fileInDoc.items;
    return { fileString: JSON.stringify(items) };
  }
}
```
