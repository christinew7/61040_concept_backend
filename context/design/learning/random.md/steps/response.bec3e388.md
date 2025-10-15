---
timestamp: 'Wed Oct 15 2025 11:58:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_115838.6565dadc.md]]'
content_id: bec3e388cc0c8d469fcb0acd7bac59edd6f0c223875d6fe33ab41ae1a932f82f
---

# response:

This error output indicates two distinct but related issues in your Deno test setup, primarily stemming from how you're managing the database client (`client`) across your test blocks.

Let's break down each error:

***

### 1. `error: Started test step while another test step with sanitizers was running:`

* **What it means:** Deno's test runner, when using `t.step`, expects each step to complete fully before the next one starts, especially when resources (like database connections, file handles, network connections) are involved. "Sanitizers" are Deno's mechanisms to ensure that all resources opened by a test step are properly closed. If a test step doesn't close its resources, or if a new step starts while the previous one is still in the process of cleanup or has an outstanding asynchronous operation, Deno will flag this as a problem.

* **Why it's happening here:**
  The traceback shows:
  `Action: duplicate library and duplicate files ... 2. Duplicate file is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:159:5`
  `error: Started test step while another test step with sanitizers was running: * Action: duplicate library and duplicate files ... 1. Duplicate library is not allowed`

  This means that `t.step("2. Duplicate file is not allowed", ...)` began executing while `t.step("1. Duplicate library is not allowed", ...)` had not yet fully completed its execution and/or resource cleanup. This is often a symptom of an unhandled promise rejection or a resource (like your `client`) being unexpectedly closed or left in an indeterminate state, causing the first step to fail in a way that Deno can't properly track its completion.

***

### 2. `error: MongoExpiredSessionError: Use of expired sessions is not permitted`

* **What it means:** This error comes directly from the MongoDB driver. It signifies that an attempt was made to perform a database operation (specifically `concept.create` which calls `Collection.findOne`) using a MongoDB client session that is no longer active or has been explicitly closed. MongoDB operations require an active session to communicate with the database.

* **Why it's happening here:**
  The traceback shows:
  `Action: duplicate library and duplicate files ... 1. Duplicate library is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:149:5`
  `... at async LibraryConcept.create (file:///.../LibraryConcept.ts:68:29)`
  `at async file:///.../LibraryConcept.test.ts:150:5` (which corresponds to `await concept.create({ owner: userBob });` within the first `t.step` of the second `Deno.test` block)

  This is the *primary* error. The `MongoExpiredSessionError` is occurring *within* `t.step("1. Duplicate library is not allowed", ...)` of your second `Deno.test` block.

  **The most likely cause is that your `client` object for the second `Deno.test` block is being closed prematurely or was already closed by a previous test.**

  Look at your test structure:

  ```typescript
  Deno.test("Principle: ...", async (t) => {
    const [db, client] = await testDb();
    const concept = new LibraryConcept(db);
    // ... steps ...
    await client.close(); // <-- This closes the client for THIS test block
  });

  Deno.test("Action: duplicate library and duplicate files", async (t) => {
    const [db, client] = await testDb(); // <-- New client opened here
    const concept = new LibraryConcept(db);

    t.step("1. Duplicate library is not allowed", async () => {
      await concept.create({ owner: userBob }); // <-- ERROR HAPPENS HERE
      const duplicateCreateResult = await concept.create({ owner: userBob });
      // ...
    });
    // ... other steps ...
    // await client.close(); // <-- This was commented out in your provided code
  });
  ```

  The `MongoExpiredSessionError` implies that *before* `await concept.create({ owner: userBob });` executes in the second test block, the `client` it's trying to use is already expired.

  **Possible Scenarios:**

  1. **Missing `client.close()`:** You correctly added `await client.close()` to the first `Deno.test` block. However, in the second `Deno.test` block, the `await client.close()` at the end is commented out (`// await client.close();`). While this *shouldn't* cause an *expired* session immediately (it would cause a resource leak *later*), it points to an inconsistency.
  2. **Shared State/Improper Cleanup between `Deno.test` blocks (less likely given `testDb`):** Although `testDb()` is supposed to provide a fresh instance, if there's any global state or if `testDb()` itself isn't perfectly isolating clients, it *could* be an issue. However, `testDb()` returning a new `[db, client]` for each test block is the correct pattern.
  3. **Error Propagation and Implicit Cleanup:** If an error occurs early in the second `Deno.test` block (perhaps even before `t.step("1. ...")` really gets going, or if the `testDb()` setup fails silently), it might cause the entire `Deno.test` block to abort, and Deno's test runner might try to clean up resources, inadvertently closing the client before the `create` call.

  **The combination of the two errors:** The `MongoExpiredSessionError` likely occurs first, causing `t.step("1. ...")` to fail. Because it failed in an unexpected way (resource issue), Deno's test runner then complains that `t.step("2. ...")` started while `t.step("1. ...")` was still "running" (or, more accurately, still being processed for cleanup after its failure).

***

### Solution and Best Practices:

The most robust way to handle client connections in Deno tests is to use a `try...finally` block within *each* `Deno.test` block to ensure `client.close()` is always called, regardless of whether the test passes or fails.

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

  try { // Ensure client is closed even if test fails
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
      file1 = (addFileResult as { id: ID }).id;
      assertExists(file1, "File ID should be returned.");

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

      assertArrayIncludes(
        files[0].items,
        ["hello", "this is a file"],
        "The first file should have two items",
      );
    });

    await t.step("3. Alice modifies her file in her library", async () => {
      const modifyFileResult = await concept.modifyFile({
        owner: userAlice,
        file: file1,
        items: ["hello", "this is still a file"],
      });
      assertNotEquals(
        "error" in modifyFileResult,
        true,
        "Modifying a file should be successful",
      );
      file1 = (modifyFileResult as { id: ID }).id;
      assertExists(file1, "File ID should be returned.");

      const allFiles = await concept._getAllFiles({ owner: userAlice });
      assertNotEquals(
        "error" in allFiles,
        true,
        `Expected successful query for files, got error: ${
          (allFiles as { error: string }).error
        }`,
      );
      const { files } = allFiles as { files: FileDoc[] };
      assertEquals(files.length, 1, "Library is still length 1.");

      assertArrayIncludes(
        files[0].items,
        ["hello", "this is still a file"],
        "The first file should still have two items",
      );
    });

    await t.step("4. Alice deletes a file; she no longer needs it", async () => {
      const deleteFileResult = await concept.deleteFile({
        owner: userAlice,
        file: file1,
      });
      assertNotEquals(
        "error" in deleteFileResult,
        true,
        "File should have been successfully deleted",
      );
      const allFiles = await concept._getAllFiles({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in allFiles,
        true,
        "There should be no error receiving the file",
      );
      const { files } = allFiles as { files: FileDoc[] };
      assertEquals(
        files.length,
        0,
        "Library should have no files and be length 0",
      );
    });
  } finally {
    await client.close(); // ALWAYS close the client for THIS test block
  }
});

Deno.test("Action: duplicate library and duplicate files", async (t) => {
  const [db, client] = await testDb(); // This gets a new client
  const concept = new LibraryConcept(db);

  try { // Ensure client is closed even if test fails
    await t.step("1. Duplicate library is not allowed", async () => {
      // Bob creates his first library successfully
      const createResult = await concept.create({ owner: userBob });
      assertNotEquals(
        "error" in createResult,
        true,
        "Bob should be able to create his first library.",
      );
      const libraryBob = (createResult as { library: ID }).library;
      assertExists(libraryBob, "Library ID should be returned.");

      // Attempt to create a duplicate library
      const duplicateCreateResult = await concept.create({ owner: userBob });
      assertEquals(
        "error" in duplicateCreateResult,
        true,
        "There is an error in creating another library because Bob already has an existing library",
      );
    });

    await t.step("2. Duplicate file is not allowed", async () => {
      // Add a file
      const addFileResult = await concept.addFile({
        owner: userBob,
        items: ["this", "is", "not", "true."],
      });
      assertNotEquals(
        "error" in addFileResult,
        true,
        "Adding the first file should be successful",
      );

      // Attempt to add a duplicate file
      const duplicateAddResult = await concept.addFile({
        owner: userBob,
        items: ["this", "is", "not", "true."],
      });
      assertEquals(
        "error" in duplicateAddResult,
        true,
        "There should be an error when trying to add the exact same file",
      );
    });
  } finally {
    await client.close(); // ALWAYS close the client for THIS test block
  }
});

```

**Summary of Changes and Rationale:**

1. **`try...finally` block for `client.close()`:** This is the most critical change. By wrapping your test logic in `try` and calling `await client.close()` in the `finally` block, you guarantee that the MongoDB client connection is closed after the test, regardless of whether any `t.step` fails or throws an unhandled error. This prevents resource leaks and, more importantly, ensures that future tests (or subsequent `t.step`s) don't try to use an already closed or invalid client.
2. **Consistency across `Deno.test` blocks:** Now, both `Deno.test` blocks properly manage their own `client` lifecycle. Each `Deno.test` should be entirely self-contained in terms of resources it manages.
3. **Corrected step 1 in the second test:** I've added an assertion for the *successful* creation of Bob's first library before asserting the failure of the *duplicate* creation. This ensures that the state is correctly set up for testing the duplicate scenario.

With these changes, you should see more reliable test execution and clearer error messages if actual conceptual issues arise, rather than infrastructure issues.
