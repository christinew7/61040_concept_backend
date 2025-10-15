---
timestamp: 'Tue Oct 14 2025 11:49:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_114900.0deddcea.md]]'
content_id: 64a30a7c8d742013377d13e72a12ddc3e9dcf9c9927a7ebfb9dd9318dbfabcdb
---

# file: src/concepts/Library/LibraryConcept.test.ts

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
    assertEquals(allFiles.files.length, 0, "New library should be empty.");
  });

  await client.close();
});

/**
  const [db, client] = await testDb();
  const concept = new concept(db);



  await client.close();
 */

```
