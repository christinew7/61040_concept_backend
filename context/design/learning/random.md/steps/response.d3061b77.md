---
timestamp: 'Tue Oct 14 2025 12:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_120512.d998bf53.md]]'
content_id: d3061b77631f77c4340edebf41b0c17ba3ebb8176b9c92ccebfc9ce98bc3d62b
---

# response:

The error message `Argument of type 'FileDoc' is not assignable to parameter of type 'ArrayLikeArg<string>'` on the line `assertArrayIncludes(files.items[0], "hello", ...)` indicates that the first argument passed to `assertArrayIncludes` is a `FileDoc` object, but it expects an array-like object (something with a `length` property, like a `string[]`).

Based on the test setup:

1. `const { files } = allFiles as { files: FileDoc[] };` means `files` is an array of `FileDoc` objects.
2. The `addFile` action is called with `items: ["hello", "this is a file"]`, suggesting that a `FileDoc` object contains an `items` property which is an array of strings.

Therefore:

* `files[0]` would be the first `FileDoc` object.
* `files[0].items` would be the array of strings `["hello", "this is a file"]` within that `FileDoc`.

The original code `files.items[0]` is attempting to access an `items` property directly on the `files` array (which doesn't exist) or assumes `files` is a single object containing `items`.

**Correction:**
Change `files.items[0]` to `files[0].items`.

```typescript
import {
  assertArrayIncludes,
  assertEquals,
  assertExists,
  assertNotEquals,
} from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LibraryConcept from "./LibraryConcept.ts";

// using just to index into the files and set it as a FileDocument
import { FileDoc } from "./LibraryConcept.ts";

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const nonExistentUser = "user:NonExistent" as ID;

// a user creates a library to store their files
//  * the user can add, retrieve, modify, or delete files within their library
//  * and they can delete the library if it's no longer needed
Deno.test("Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let libraryAlice: ID;
  let file1: ID;
  let file2: ID;

  await t.step("1. Alice creates a library to store her files", async () => {
    const result = await concept.create({ owner: userAlice });
    assertNotEquals(
      "error" in result,
      true,
      `Expected successful library creation for ${userAlice}, got error: ${
        (result as { error: string }).error
      }`,
    );
    libraryAlice = (result as { library: ID }).library;
    assertExists(libraryAlice, "Library ID should be returned.");

    const allFiles = await concept._getAllFiles({ owner: userAlice });
    assertNotEquals(
      "error" in allFiles,
      true,
      `Expected successful query for files, got error: ${
        (allFiles as { error: string }).error
      }`,
    );
    const { files } = allFiles as { files: FileDoc[] };
    assertEquals(files.length, 0, "New library should be empty.");
  });

  await t.step("2. Alice adds one file to her library", async () => {
    const addFileResult = await concept.addFile({
      owner: userAlice,
      items: ["hello", "this is a file"],
    });
    assertNotEquals(
      "error" in addFileResult,
      true,
      "Adding a file (nonduplicate) should be successful",
    );
    const allFiles = await concept._getAllFiles({ owner: userAlice });
    assertNotEquals(
      "error" in allFiles,
      true,
      `Expected successful query for files, got error: ${
        (allFiles as { error: string }).error
      }`,
    );
    const { files } = allFiles as { files: FileDoc[] };
    assertEquals(files.length, 1, "New library is now length 1.");

    // Fix: access the 'items' property of the first FileDoc object
    assertArrayIncludes(
      files[0].items, // Changed from files.items[0] to files[0].items
      ["hello"], // assertArrayIncludes expects an array of items to check for, or a single item.
      "The first file item array includes `hello`",
    );
  });

  await client.close();
});
```
