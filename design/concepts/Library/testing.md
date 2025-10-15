
[@testing-concepts](../../background/testing-concepts.md)

[@implementation](../../../src/concepts/Library/LibraryConcept.ts)

[@Library-testing](../../../src/concepts/Library/LibraryConcept.test.ts)

[@reference-Likert testing](../LikertSurvey/testing.md)
# testing concepts:
**Testing concepts**. Your tests should cover the basic behavior of the concept but should also include some more interesting cases. Your tests should use the Deno testing framework and should be programmatic (that is, determining in the code whether they succeeded or failed, and not requiring a human to interpret console messages). They should also print helpful messages to the console with action inputs and outputs so that a human reader can make sense of the test execution when it runs in the console. Some more details about the test cases you should include:

- **Operational principle**. A sequence of action executions that corresponds to the operational principle, representing the common expected usage of the concept. These sequence is not required to use all the actions; operational principles often do not include a deletion action, for example.
- **Interesting scenarios**. Sequences of action executions that correspond to less common cases: probing interesting corners of the functionality, undoing actions with deletions and cancellations, repeating actions with the same arguments, etc. In some of these scenarios actions may be expected to throw errors.
- **Number required**. For each concept, you should have one test sequence for the operational principle, and 3-5 additional interesting scenarios. Every action should be executed successfully in at least one of the scenarios.
- **No state setup**. Your test cases should not require any setting up of the concept state except by calling concept actions. When you are testing one action at a time, this means that you will want to order your actions carefully (for example, by the operational principle) to avoid having to set up state.
- **Saving test execution output**. Save the test execution output by copy-pasting from the console to a markdown file.

# prompt: can you modify the test cases in library concept soincludes the new optional image functions
# response:

Here's the updated `LibraryConcept.test.ts` file, incorporating tests for the `setImageToFile` and `clearImageFromFile` actions, including their requirements and effects.

I've added new steps within the `Actions: createFile, addItemToFile, modifyItemInFile, removeItemFromFile, deleteFile` test block to cover these new functionalities.

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

Deno.test("Principle: a user creates a library to store their files, can add, retrieve, modify, or delete files within their library, can delete the library if it's no longer needed", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let libraryAlice: ID;
  let file1: ID;

  await t.step("1. Alice creates a library to store her files", async () => {
    console.log(`Trace: Calling create({ owner: ${userAlice} })`);
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
    console.log(`  -> Library created with ID: ${libraryAlice}`);

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
    console.log(`  -> Verified library for ${userAlice} is empty.`);
  });

  await t.step("2. Alice adds one file to her library", async () => {
    console.log(`Trace: Calling createFile({ owner: ${userAlice} })`);
    const createFileResult = await concept.createFile({ owner: userAlice });
    assertNotEquals(
      "error" in createFileResult,
      true,
      `Expected successful file creation, got error: ${
        (createFileResult as { error: string }).error
      }`,
    );
    file1 = (createFileResult as { id: ID }).id;
    assertExists(file1, "File ID should be returned.");
    console.log(`  -> File created with ID: ${file1}`);

    console.log(
      `Trace: Calling addItemToFile({ owner: ${userAlice}, file: ${file1}, item: "hello" })`,
    );
    await concept.addItemToFile({
      owner: userAlice,
      file: file1,
      item: "hello",
    });
    console.log(
      `Trace: Calling addItemToFile({ owner: ${userAlice}, file: ${file1}, item: "this is a file" })`,
    );
    await concept.addItemToFile({
      owner: userAlice,
      file: file1,
      item: "this is a file",
    });
    console.log(`  -> Added two items to file ${file1}.`);

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
    console.log(
      `  -> Verified file ${file1} contains items: ${
        JSON.stringify(files[0].items)
      }.`,
    );
  });

  await t.step("3. Alice modifies her file in her library", async () => {
    console.log(
      `Trace: Calling modifyItemInFile({ owner: ${userAlice}, file: ${file1}, index: 1, newItem: "this is still a file" })`,
    );
    const modifyItemResult = await concept.modifyItemInFile({
      owner: userAlice,
      file: file1,
      index: 1, // "this is a file" is at index 1
      newItem: "this is still a file",
    });
    assertNotEquals(
      "error" in modifyItemResult,
      true,
      `Modifying an item in file should be successful, got error: ${
        (modifyItemResult as { error: string }).error
      }`,
    );
    console.log(
      `  -> Modified item at index 1 in file ${file1} to "this is still a file".`,
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
    assertEquals(files.length, 1, "Library is still length 1.");

    assertArrayIncludes(
      files[0].items,
      ["hello", "this is still a file"],
      "The first file should still have two items",
    );
    console.log(
      `  -> Verified file ${file1} items are: ${
        JSON.stringify(files[0].items)
      }.`,
    );
  });

  await t.step("4. Alice deletes a file; she no longer needs it", async () => {
    console.log(
      `Trace: Calling deleteFile({ owner: ${userAlice}, file: ${file1} })`,
    );
    const deleteFileResult = await concept.deleteFile({
      owner: userAlice,
      file: file1,
    });
    assertNotEquals(
      "error" in deleteFileResult,
      true,
      "File should have been successfully deleted",
    );
    console.log(`  -> File ${file1} deleted.`);

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
    console.log(`  -> Verified library for ${userAlice} is now empty.`);
  });

  await client.close();
});

Deno.test("Action: duplicates (create and file operations)", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  await t.step("1. Duplicate library is not allowed", async () => {
    console.log(`Trace: Calling create({ owner: ${userBob} })`);
    await concept.create({ owner: userBob });
    console.log(`  -> Library created for ${userBob}.`);

    console.log(`Trace: Calling create({ owner: ${userBob} }) (duplicate)`);
    const duplicateCreateResult = await concept.create({ owner: userBob });
    assertEquals(
      "error" in duplicateCreateResult,
      true,
      "There is an error in creating another library because Bob already has an existing library",
    );
    assertEquals(
      (duplicateCreateResult as { error: string }).error,
      `User ${userBob} already has a library.`,
    );
    console.log(
      `  -> Verified duplicate library creation for ${userBob} fails with error: ${
        (duplicateCreateResult as { error: string }).error
      }`,
    );
  });

  let fileBob1: ID;
  await t.step("2. Can create multiple files, even empty ones", async () => {
    console.log(`Trace: Calling createFile({ owner: ${userBob} })`);
    const createFile1Result = await concept.createFile({ owner: userBob });
    assertNotEquals(
      "error" in createFile1Result,
      true,
      `Expected file creation 1 to succeed, got error: ${
        (createFile1Result as { error: string }).error
      }`,
    );
    fileBob1 = (createFile1Result as { id: ID }).id;
    console.log(`  -> File 1 created with ID: ${fileBob1}`);

    console.log(`Trace: Calling createFile({ owner: ${userBob} })`);
    const createFile2Result = await concept.createFile({ owner: userBob });
    assertNotEquals(
      "error" in createFile2Result,
      true,
      `Expected file creation 2 to succeed, got error: ${
        (createFile2Result as { error: string }).error
      }`,
    );
    const fileBob2 = (createFile2Result as { id: ID }).id;
    console.log(`  -> File 2 created with ID: ${fileBob2}`);

    assertNotEquals(
      fileBob1,
      fileBob2,
      "Two calls to createFile should return different file IDs.",
    );

    const allFiles = await concept._getAllFiles({ owner: userBob });
    assertEquals(
      (allFiles as { files: FileDoc[] }).files.length,
      2,
      "Bob should now have two empty files.",
    );
    console.log(
      `  -> Verified ${userBob} now has two files (${fileBob1}, ${fileBob2}).`,
    );
  });

  await t.step("3. addItemToFile allows duplicate item strings", async () => {
    console.log(
      `Trace: Calling addItemToFile({ owner: ${userBob}, file: ${fileBob1}, item: "document content" })`,
    );
    await concept.addItemToFile({
      owner: userBob,
      file: fileBob1,
      item: "document content",
    });
    console.log(
      `Trace: Calling addItemToFile({ owner: ${userBob}, file: ${fileBob1}, item: "document content" }) (duplicate)`,
    );
    await concept.addItemToFile({
      owner: userBob,
      file: fileBob1,
      item: "document content",
    }); // Duplicate item string
    console.log(`  -> Added duplicate item strings to file ${fileBob1}.`);

    const allFiles = await concept._getAllFiles({ owner: userBob });
    const targetFile = (allFiles as { files: FileDoc[] }).files.find((f) =>
      f._id === fileBob1
    );
    assertExists(targetFile);
    assertEquals(
      targetFile.items,
      ["document content", "document content"],
      "File should contain duplicate item strings.",
    );
    console.log(
      `  -> Verified file ${fileBob1} contains: ${
        JSON.stringify(targetFile.items)
      }.`,
    );
  });

  await client.close();
});

Deno.test("Action: delete and deleteFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let libraryAlice: ID;
  console.log(`Trace: Calling create({ owner: ${userAlice} })`);
  const createAliceLibResult = await concept.create({ owner: userAlice });
  assertNotEquals("error" in createAliceLibResult, true);
  libraryAlice = (createAliceLibResult as { library: ID }).library;
  console.log(`  -> Library created for ${userAlice}: ${libraryAlice}`);

  let libraryBob: ID;
  console.log(`Trace: Calling create({ owner: ${userBob} })`);
  const createBobLibResult = await concept.create({ owner: userBob });
  assertNotEquals("error" in createBobLibResult, true);
  libraryBob = (createBobLibResult as { library: ID }).library;
  console.log(`  -> Library created for ${userBob}: ${libraryBob}`);

  console.log(`Trace: Calling createFile({ owner: ${userAlice} })`);
  const testFileAlice1Result = await concept.createFile({ owner: userAlice });
  assertNotEquals("error" in testFileAlice1Result, true);
  const testFileAlice1Id = (testFileAlice1Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userAlice,
    file: testFileAlice1Id,
    item: "doc1.txt",
  });
  console.log(`  -> File ${testFileAlice1Id} added to ${userAlice}'s library.`);

  console.log(`Trace: Calling createFile({ owner: ${userAlice} })`);
  const testFileAlice2Result = await concept.createFile({ owner: userAlice });
  assertNotEquals("error" in testFileAlice2Result, true);
  const testFileAlice2Id = (testFileAlice2Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userAlice,
    file: testFileAlice2Id,
    item: "doc2.pdf",
  });
  console.log(`  -> File ${testFileAlice2Id} added to ${userAlice}'s library.`);

  console.log(`Trace: Calling createFile({ owner: ${userBob} })`);
  const testFileBob1Result = await concept.createFile({ owner: userBob });
  assertNotEquals("error" in testFileBob1Result, true);
  const testFileBob1Id = (testFileBob1Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userBob,
    file: testFileBob1Id,
    item: "doc3",
  });
  console.log(`  -> File ${testFileBob1Id} added to ${userBob}'s library.`);

  await t.step(
    "1. Cannot delete a library for a nonexistent owner",
    async () => {
      console.log(
        `Trace: Calling delete({ owner: ${nonExistentUser} }) (expect error)`,
      );
      const deleteNonexistentResult = await concept.delete({
        owner: nonExistentUser,
      });
      assertEquals(
        "error" in deleteNonexistentResult,
        true,
        "There cannot be a successful deletion for an owner with no library",
      );
      assertEquals(
        (deleteNonexistentResult as { error: string }).error,
        `User ${nonExistentUser} does not have a library to delete.`,
      );
      console.log(
        `  -> Verified delete for nonexistent user fails with error: ${
          (deleteNonexistentResult as { error: string }).error
        }`,
      );
    },
  );

  await t.step(
    "2. Cannot delete an existing file under a nonexisting owner",
    async () => {
      console.log(
        `Trace: Calling deleteFile({ owner: ${nonExistentUser}, file: ${testFileAlice1Id} }) (expect error)`,
      );
      const deleteFileResult = await concept.deleteFile({
        owner: nonExistentUser,
        file: testFileAlice1Id,
      });
      assertEquals(
        "error" in deleteFileResult,
        true,
        "File cannot be deleted if the owner does not exist",
      );
      assertEquals(
        (deleteFileResult as { error: string }).error,
        `User ${nonExistentUser} does not have a library.`,
      );
      console.log(
        `  -> Verified deleteFile for nonexistent user fails with error: ${
          (deleteFileResult as { error: string }).error
        }`,
      );
    },
  );

  await t.step(
    "3. Cannot delete an existing file under an existing user, but doesn't belong in their library",
    async () => {
      console.log(
        `Trace: Calling deleteFile({ owner: ${userBob}, file: ${testFileAlice1Id} }) (expect error)`,
      );
      const deleteFileResult = await concept.deleteFile({
        owner: userBob,
        file: testFileAlice1Id,
      });
      assertEquals(
        "error" in deleteFileResult,
        true,
        "File cannot be deleted if the owner's library doesn't have the file item'",
      );
      assertEquals(
        (deleteFileResult as { error: string }).error,
        `File ${testFileAlice1Id} not found in library for user ${userBob}.`,
      );
      console.log(
        `  -> Verified deleteFile of ${testFileAlice1Id} by ${userBob} fails as file not in library: ${
          (deleteFileResult as { error: string }).error
        }`,
      );
    },
  );
  await client.close();
});

Deno.test("Actions: createFile, addItemToFile, modifyItemInFile, removeItemFromFile, deleteFile, setImageToFile, clearImageFromFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let aliceLibrary: ID;
  let aliceFile1: ID;
  let aliceFile2: ID;
  const testImageURL = "https://example.com/test_image.jpg";

  await t.step("Setup: Alice creates a library and two files", async () => {
    console.log(`Setup: Calling create({ owner: ${userAlice} })`);
    const createLibResult = await concept.create({ owner: userAlice });
    assertNotEquals("error" in createLibResult, true);
    aliceLibrary = (createLibResult as { library: ID }).library;
    console.log(`  -> Library created for ${userAlice}: ${aliceLibrary}`);

    console.log(`Setup: Calling createFile({ owner: ${userAlice} })`);
    const createFile1Result = await concept.createFile({ owner: userAlice });
    assertNotEquals("error" in createFile1Result, true);
    aliceFile1 = (createFile1Result as { id: ID }).id;
    console.log(`  -> File 1 created for ${userAlice}: ${aliceFile1}`);
    await concept.addItemToFile({
      owner: userAlice,
      file: aliceFile1,
      item: "item_a",
    });
    await concept.addItemToFile({
      owner: userAlice,
      file: aliceFile1,
      item: "item_b",
    });
    console.log(`  -> Added items "item_a", "item_b" to file ${aliceFile1}.`);

    console.log(`Setup: Calling createFile({ owner: ${userAlice} })`);
    const createFile2Result = await concept.createFile({ owner: userAlice });
    assertNotEquals("error" in createFile2Result, true);
    aliceFile2 = (createFile2Result as { id: ID }).id;
    console.log(`  -> File 2 created for ${userAlice}: ${aliceFile2}`);
    await concept.addItemToFile({
      owner: userAlice,
      file: aliceFile2,
      item: "item_c",
    });
    console.log(`  -> Added item "item_c" to file ${aliceFile2}.`);

    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    assertEquals(files.files.length, 2);
    assertEquals(
      files.files.find((f) => f._id === aliceFile1)?.items,
      ["item_a", "item_b"],
    );
    assertEquals(
      files.files.find((f) => f._id === aliceFile2)?.items,
      ["item_c"],
    );
    console.log(`  -> Verified Alice has 2 files with correct initial items.`);
  });

  await t.step("1. addItemToFile: adds an item to a file", async () => {
    console.log(
      `Trace: Calling addItemToFile({ owner: ${userAlice}, file: ${aliceFile1}, item: "item_d" })`,
    );
    await concept.addItemToFile({
      owner: userAlice,
      file: aliceFile1,
      item: "item_d",
    });
    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(
      file.items,
      ["item_a", "item_b", "item_d"],
      "item_d should be added to file1.",
    );
    console.log(
      `  -> Verified file ${aliceFile1} now has items: ${
        JSON.stringify(file.items)
      }.`,
    );
  });

  await t.step("2. addItemToFile: requires existing library/file", async () => {
    console.log(
      `Trace: Calling addItemToFile({ owner: ${nonExistentUser}, file: ${aliceFile1}, item: "test" }) (expect error)`,
    );
    const resultNoLibrary = await concept.addItemToFile({
      owner: nonExistentUser,
      file: aliceFile1,
      item: "test",
    });
    assertEquals(
      "error" in resultNoLibrary,
      true,
      "Should fail if owner has no library.",
    );
    assertEquals(
      (resultNoLibrary as { error: string }).error,
      `User ${nonExistentUser} does not have a library.`,
    );
    console.log(
      `  -> Verified addItemToFile fails for non-existent user: ${
        (resultNoLibrary as { error: string }).error
      }`,
    );

    console.log(
      `Trace: Calling addItemToFile({ owner: ${userAlice}, file: "file:fake", item: "test" }) (expect error)`,
    );
    const resultNoFile = await concept.addItemToFile({
      owner: userAlice,
      file: "file:fake" as ID,
      item: "test",
    });
    assertEquals(
      "error" in resultNoFile,
      true,
      "Should fail if file does not exist in library.",
    );
    assertEquals(
      (resultNoFile as { error: string }).error,
      `File file:fake not found in library for user ${userAlice}.`,
    );
    console.log(
      `  -> Verified addItemToFile fails for non-existent file in library: ${
        (resultNoFile as { error: string }).error
      }`,
    );
  });

  await t.step(
    "3. modifyItemInFile: replaces an item at a specific index",
    async () => {
      console.log(
        `Trace: Calling modifyItemInFile({ owner: ${userAlice}, file: ${aliceFile1}, index: 1, newItem: "item_b_modified" })`,
      );
      await concept.modifyItemInFile({
        owner: userAlice,
        file: aliceFile1,
        index: 1,
        newItem: "item_b_modified",
      });
      const files = (await concept._getAllFiles({ owner: userAlice })) as {
        files: FileDoc[];
      };
      const file = files.files.find((f) => f._id === aliceFile1);
      assertExists(file);
      assertEquals(
        file.items,
        ["item_a", "item_b_modified", "item_d"],
        "item_b should be modified.",
      );
      console.log(
        `  -> Verified file ${aliceFile1} items are now: ${
          JSON.stringify(file.items)
        }.`,
      );
    },
  );

  await t.step(
    "4. modifyItemInFile: requires existing library/file and valid index",
    async () => {
      console.log(
        `Trace: Calling modifyItemInFile({ owner: ${nonExistentUser}, file: ${aliceFile1}, index: 0, newItem: "test" }) (expect error)`,
      );
      const resultNoLibrary = await concept.modifyItemInFile({
        owner: nonExistentUser,
        file: aliceFile1,
        index: 0,
        newItem: "test",
      });
      assertEquals(
        "error" in resultNoLibrary,
        true,
        "Should fail if owner has no library.",
      );
      assertEquals(
        (resultNoLibrary as { error: string }).error,
        `User ${nonExistentUser} does not have a library.`,
      );
      console.log(
        `  -> Verified modifyItemInFile fails for non-existent user: ${
          (resultNoLibrary as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling modifyItemInFile({ owner: ${userAlice}, file: "file:fake", index: 0, newItem: "test" }) (expect error)`,
      );
      const resultNoFile = await concept.modifyItemInFile({
        owner: userAlice,
        file: "file:fake" as ID,
        index: 0,
        newItem: "test",
      });
      assertEquals(
        "error" in resultNoFile,
        true,
        "Should fail if file does not exist in library.",
      );
      assertEquals(
        (resultNoFile as { error: string }).error,
        `File file:fake not found in library for user ${userAlice}.`,
      );
      console.log(
        `  -> Verified modifyItemInFile fails for non-existent file in library: ${
          (resultNoFile as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling modifyItemInFile({ owner: ${userAlice}, file: ${aliceFile1}, index: -1, newItem: "test" }) (expect error)`,
      );
      const resultInvalidIndexNegative = await concept.modifyItemInFile({
        owner: userAlice,
        file: aliceFile1,
        index: -1,
        newItem: "test",
      });
      assertEquals(
        "error" in resultInvalidIndexNegative,
        true,
        "Should fail for negative index.",
      );
      assertEquals(
        (resultInvalidIndexNegative as { error: string }).error,
        `Index -1 is out of bounds for file ${aliceFile1}.`,
      );
      console.log(
        `  -> Verified modifyItemInFile fails for negative index: ${
          (resultInvalidIndexNegative as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling modifyItemInFile({ owner: ${userAlice}, file: ${aliceFile1}, index: 100, newItem: "test" }) (expect error)`,
      );
      const resultInvalidIndexTooHigh = await concept.modifyItemInFile({
        owner: userAlice,
        file: aliceFile1,
        index: 100,
        newItem: "test",
      });
      assertEquals(
        "error" in resultInvalidIndexTooHigh,
        true,
        "Should fail for index out of bounds.",
      );
      assertEquals(
        (resultInvalidIndexTooHigh as { error: string }).error,
        `Index 100 is out of bounds for file ${aliceFile1}.`,
      );
      console.log(
        `  -> Verified modifyItemInFile fails for out-of-bounds index: ${
          (resultInvalidIndexTooHigh as { error: string }).error
        }`,
      );
    },
  );

  await t.step(
    "5. removeItemFromFile: removes an item at a specific index",
    async () => {
      console.log(
        `Trace: Calling removeItemFromFile({ owner: ${userAlice}, file: ${aliceFile1}, index: 0 })`,
      );
      await concept.removeItemFromFile({
        owner: userAlice,
        file: aliceFile1,
        index: 0,
      }); // Remove "item_a"
      const files = (await concept._getAllFiles({ owner: userAlice })) as {
        files: FileDoc[];
      };
      const file = files.files.find((f) => f._id === aliceFile1);
      assertExists(file);
      assertEquals(
        file.items,
        ["item_b_modified", "item_d"],
        "item_a should be removed.",
      );
      console.log(
        `  -> Verified file ${aliceFile1} items are now: ${
          JSON.stringify(file.items)
        }.`,
      );
    },
  );

  await t.step(
    "6. removeItemFromFile: requires existing library/file and valid index",
    async () => {
      console.log(
        `Trace: Calling removeItemFromFile({ owner: ${nonExistentUser}, file: ${aliceFile1}, index: 0 }) (expect error)`,
      );
      const resultNoLibrary = await concept.removeItemFromFile({
        owner: nonExistentUser,
        file: aliceFile1,
        index: 0,
      });
      assertEquals(
        "error" in resultNoLibrary,
        true,
        "Should fail if owner has no library.",
      );
      assertEquals(
        (resultNoLibrary as { error: string }).error,
        `User ${nonExistentUser} does not have a library.`,
      );
      console.log(
        `  -> Verified removeItemFromFile fails for non-existent user: ${
          (resultNoLibrary as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling removeItemFromFile({ owner: ${userAlice}, file: "file:fake", index: 0 }) (expect error)`,
      );
      const resultNoFile = await concept.removeItemFromFile({
        owner: userAlice,
        file: "file:fake" as ID,
        index: 0,
      });
      assertEquals(
        "error" in resultNoFile,
        true,
        "Should fail if file does not exist in library.",
      );
      assertEquals(
        (resultNoFile as { error: string }).error,
        `File file:fake not found in library for user ${userAlice}.`,
      );
      console.log(
        `  -> Verified removeItemFromFile fails for non-existent file in library: ${
          (resultNoFile as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling removeItemFromFile({ owner: ${userAlice}, file: ${aliceFile1}, index: -1 }) (expect error)`,
      );
      const resultInvalidIndexNegative = await concept.removeItemFromFile({
        owner: userAlice,
        file: aliceFile1,
        index: -1,
      });
      assertEquals(
        "error" in resultInvalidIndexNegative,
        true,
        "Should fail for negative index.",
      );
      assertEquals(
        (resultInvalidIndexNegative as { error: string }).error,
        `Index -1 is out of bounds for file ${aliceFile1}.`,
      );
      console.log(
        `  -> Verified removeItemFromFile fails for negative index: ${
          (resultInvalidIndexNegative as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling removeItemFromFile({ owner: ${userAlice}, file: ${aliceFile1}, index: 100 }) (expect error)`,
      );
      const resultInvalidIndexTooHigh = await concept.removeItemFromFile({
        owner: userAlice,
        file: aliceFile1,
        index: 100,
      });
      assertEquals(
        "error" in resultInvalidIndexTooHigh,
        true,
        "Should fail for index out of bounds.",
      );
      assertEquals(
        (resultInvalidIndexTooHigh as { error: string }).error,
        `Index 100 is out of bounds for file ${aliceFile1}.`,
      );
      console.log(
        `  -> Verified removeItemFromFile fails for out-of-bounds index: ${
          (resultInvalidIndexTooHigh as { error: string }).error
        }`,
      );
    },
  );

  await t.step("7. setImageToFile: sets an image for a file", async () => {
    console.log(
      `Trace: Calling setImageToFile({ owner: ${userAlice}, file: ${aliceFile1}, image: "${testImageURL}" })`,
    );
    const setImageResult = await concept.setImageToFile({
      owner: userAlice,
      file: aliceFile1,
      image: testImageURL,
    });
    assertNotEquals(
      "error" in setImageResult,
      true,
      `Setting image should be successful, got error: ${
        (setImageResult as { error: string }).error
      }`,
    );
    console.log(`  -> Image set for file ${aliceFile1} to "${testImageURL}".`);

    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(file.image, testImageURL, "File image should be set.");
    console.log(`  -> Verified file ${aliceFile1} has image: "${file.image}".`);
  });

  await t.step(
    "8. setImageToFile: requires existing library/file",
    async () => {
      console.log(
        `Trace: Calling setImageToFile({ owner: ${nonExistentUser}, file: ${aliceFile1}, image: "${testImageURL}" }) (expect error)`,
      );
      const resultNoLibrary = await concept.setImageToFile({
        owner: nonExistentUser,
        file: aliceFile1,
        image: testImageURL,
      });
      assertEquals(
        "error" in resultNoLibrary,
        true,
        "Should fail if owner has no library.",
      );
      assertEquals(
        (resultNoLibrary as { error: string }).error,
        `User ${nonExistentUser} does not have a library.`,
      );
      console.log(
        `  -> Verified setImageToFile fails for non-existent user: ${
          (resultNoLibrary as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling setImageToFile({ owner: ${userAlice}, file: "file:fake", image: "${testImageURL}" }) (expect error)`,
      );
      const resultNoFile = await concept.setImageToFile({
        owner: userAlice,
        file: "file:fake" as ID,
        image: testImageURL,
      });
      assertEquals(
        "error" in resultNoFile,
        true,
        "Should fail if file does not exist in library.",
      );
      assertEquals(
        (resultNoFile as { error: string }).error,
        `File file:fake not found in library for user ${userAlice}.`,
      );
      console.log(
        `  -> Verified setImageToFile fails for non-existent file in library: ${
          (resultNoFile as { error: string }).error
        }`,
      );
    },
  );

  await t.step("9. clearImageFromFile: clears the image for a file", async () => {
    console.log(
      `Trace: Calling clearImageFromFile({ owner: ${userAlice}, file: ${aliceFile1} })`,
    );
    const clearImageResult = await concept.clearImageFromFile({
      owner: userAlice,
      file: aliceFile1,
    });
    assertNotEquals(
      "error" in clearImageResult,
      true,
      `Clearing image should be successful, got error: ${
        (clearImageResult as { error: string }).error
      }`,
    );
    console.log(`  -> Image cleared for file ${aliceFile1}.`);

    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(file.image, null, "File image should be null after clearing.");
    console.log(`  -> Verified file ${aliceFile1} has image: ${file.image}.`);
  });

  await t.step(
    "10. clearImageFromFile: requires existing library/file",
    async () => {
      console.log(
        `Trace: Calling clearImageFromFile({ owner: ${nonExistentUser}, file: ${aliceFile1} }) (expect error)`,
      );
      const resultNoLibrary = await concept.clearImageFromFile({
        owner: nonExistentUser,
        file: aliceFile1,
      });
      assertEquals(
        "error" in resultNoLibrary,
        true,
        "Should fail if owner has no library.",
      );
      assertEquals(
        (resultNoLibrary as { error: string }).error,
        `User ${nonExistentUser} does not have a library.`,
      );
      console.log(
        `  -> Verified clearImageFromFile fails for non-existent user: ${
          (resultNoLibrary as { error: string }).error
        }`,
      );

      console.log(
        `Trace: Calling clearImageFromFile({ owner: ${userAlice}, file: "file:fake" }) (expect error)`,
      );
      const resultNoFile = await concept.clearImageFromFile({
        owner: userAlice,
        file: "file:fake" as ID,
      });
      assertEquals(
        "error" in resultNoFile,
        true,
        "Should fail if file does not exist in library.",
      );
      assertEquals(
        (resultNoFile as { error: string }).error,
        `File file:fake not found in library for user ${userAlice}.`,
      );
      console.log(
        `  -> Verified clearImageFromFile fails for non-existent file in library: ${
          (resultNoFile as { error: string }).error
        }`,
      );
    },
  );

  await client.close();
});

Deno.test("Multiple users manage their independent libraries", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  let aliceLibraryId: ID;
  let aliceFileId: ID;
  let bobReportPdfFileId: ID;
  let bobImageJpgFileId: ID;

  await t.step(
    "1. Alice creates a library and adds a file with an item",
    async () => {
      console.log(`Trace: Alice creates library`);
      const createAliceLibResult = await libraryConcept.create({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in createAliceLibResult,
        true,
        `Expected successful library creation for Alice.`,
      );
      aliceLibraryId = (createAliceLibResult as { library: ID }).library;
      console.log(`  -> Alice's library created: ${aliceLibraryId}`);

      console.log(`Trace: Alice creates file`);
      const createAliceFileResult = await libraryConcept.createFile({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in createAliceFileResult,
        true,
        `Expected successful file creation for Alice.`,
      );
      aliceFileId = (createAliceFileResult as { id: ID }).id;
      console.log(`  -> Alice's file created: ${aliceFileId}`);

      console.log(`Trace: Alice adds item to her file`);
      await libraryConcept.addItemToFile({
        owner: userAlice,
        file: aliceFileId,
        item: "alice_doc.txt",
      });
      console.log(`  -> Item "alice_doc.txt" added to file ${aliceFileId}.`);

      const aliceFilesBeforeResult = await libraryConcept._getAllFiles({
        owner: userAlice,
      });
      assertNotEquals(
        "error" in aliceFilesBeforeResult,
        true,
        `Expected successful query for files for Alice, got error: ${
          (aliceFilesBeforeResult as { error: string }).error
        }`,
      );
      const { files: aliceFilesBefore } = aliceFilesBeforeResult as {
        files: FileDoc[];
      };
      assertEquals(aliceFilesBefore.length, 1, "Alice should have 1 file.");
      assertEquals(
        aliceFilesBefore[0]._id,
        aliceFileId,
        "Alice's file ID should match the stored ID.",
      );
      assertEquals(
        aliceFilesBefore[0].items,
        ["alice_doc.txt"],
        "Alice's file content should be correct.",
      );
      console.log(`  -> Verified Alice has 1 file with correct content.`);
    },
  );

  await t.step(
    "2. Bob creates a library and adds some files with items",
    async () => {
      console.log(`Trace: Bob creates library`);
      const createBobLibResult = await libraryConcept.create({
        owner: userBob,
      });
      assertNotEquals(
        "error" in createBobLibResult,
        true,
        `Expected successful library creation for Bob.`,
      );
      console.log(`  -> Bob's library created.`);

      console.log(`Trace: Bob creates file 1 and adds item`);
      const createBobFile1Result = await libraryConcept.createFile({
        owner: userBob,
      });
      assertNotEquals(
        "error" in createBobFile1Result,
        true,
        `Expected successful file creation for Bob (bob_report.pdf).`,
      );
      bobReportPdfFileId = (createBobFile1Result as { id: ID }).id;
      await libraryConcept.addItemToFile({
        owner: userBob,
        file: bobReportPdfFileId,
        item: "bob_report.pdf",
      });
      console.log(
        `  -> Bob's file ${bobReportPdfFileId} created with "bob_report.pdf".`,
      );

      console.log(`Trace: Bob creates file 2 and adds item`);
      const createBobFile2Result = await libraryConcept.createFile({
        owner: userBob,
      });
      assertNotEquals(
        "error" in createBobFile2Result,
        true,
        `Expected successful file creation for Bob (bob_image.jpg).`,
      );
      bobImageJpgFileId = (createBobFile2Result as { id: ID }).id;
      await libraryConcept.addItemToFile({
        owner: userBob,
        file: bobImageJpgFileId,
        item: "bob_image.jpg",
      });
      console.log(
        `  -> Bob's file ${bobImageJpgFileId} created with "bob_image.jpg".`,
      );

      const bobFilesBeforeResult = await libraryConcept._getAllFiles({
        owner: userBob,
      });
      assertNotEquals(
        "error" in bobFilesBeforeResult,
        true,
        `Expected successful query for files for Bob.`,
      );
      const { files: bobFilesBefore } = bobFilesBeforeResult as {
        files: FileDoc[];
      };
      assertEquals(bobFilesBefore.length, 2, "Bob should have 2 files.");
      assertExists(
        bobFilesBefore.find((f) =>
          f._id === bobReportPdfFileId && f.items[0] === "bob_report.pdf"
        ),
        "bob_report.pdf should be present with correct content.",
      );
      assertExists(
        bobFilesBefore.find((f) =>
          f._id === bobImageJpgFileId && f.items[0] === "bob_image.jpg"
        ),
        "bob_image.jpg should be present with correct content.",
      );
      console.log(`  -> Verified Bob has 2 files with correct content.`);

      // Verify Alice's library is unchanged after Bob's actions
      console.log(`Trace: Verifying Alice's library is unchanged`);
      const aliceFilesAfterBobActionsResult = await libraryConcept._getAllFiles(
        {
          owner: userAlice,
        },
      );
      assertNotEquals(
        "error" in aliceFilesAfterBobActionsResult,
        true,
        `Expected successful query for Alice's files after Bob's actions.`,
      );
      const { files: aliceFilesAfterBobActions } =
        aliceFilesAfterBobActionsResult as {
          files: FileDoc[];
        };

      assertEquals(
        aliceFilesAfterBobActions.length,
        1,
        "Alice's library should remain unchanged.",
      );
      assertEquals(aliceFilesAfterBobActions[0].items[0], "alice_doc.txt");
      assertEquals(
        aliceFilesAfterBobActions[0]._id,
        aliceFileId,
        "Alice's file ID should still be the same after Bob's actions.",
      );
      console.log(`  -> Verified Alice's library remains isolated.`);
    },
  );

  await t.step("3. Alice modifies an item in her file after Bob", async () => {
    console.log(`Trace: Alice modifies item in her file`);
    const modifyAliceFileItemResult = await libraryConcept.modifyItemInFile({
      owner: userAlice,
      file: aliceFileId,
      index: 0,
      newItem: "alice_updated_doc.txt",
    });
    assertNotEquals(
      "error" in modifyAliceFileItemResult,
      true,
      "Expected successful modification of Alice's file item.",
    );
    console.log(
      `  -> Alice updated item in file ${aliceFileId} to "alice_updated_doc.txt".`,
    );

    const aliceFilesUpdatedResult = await libraryConcept._getAllFiles({
      owner: userAlice,
    });
    assertNotEquals(
      "error" in aliceFilesUpdatedResult,
      true,
      `Expected successful query for Alice's files after her modification.`,
    );
    const { files: aliceFilesUpdated } = aliceFilesUpdatedResult as {
      files: FileDoc[];
    };
    assertEquals(
      aliceFilesUpdated.length,
      1,
      "Alice's library should still have 1 file.",
    );
    assertEquals(
      aliceFilesUpdated[0].items[0],
      "alice_updated_doc.txt",
      "Alice's file should be updated.",
    );
    assertEquals(
      aliceFilesUpdated[0]._id,
      aliceFileId,
      "Alice's file ID should remain the same after modification.",
    );
    console.log(`  -> Verified Alice's file is updated correctly.`);
  });

  await t.step("4. Bob deletes one of his files", async () => {
    console.log(`Trace: Bob deletes file ${bobReportPdfFileId}`);
    const deleteBobFileResult = await libraryConcept.deleteFile({
      owner: userBob,
      file: bobReportPdfFileId,
    });
    assertNotEquals(
      "error" in deleteBobFileResult,
      true,
      "Expected successful deletion of Bob's file.",
    );
    console.log(`  -> Bob's file ${bobReportPdfFileId} deleted.`);

    const bobFilesAfterDeleteResult = await libraryConcept._getAllFiles({
      owner: userBob,
    });
    assertNotEquals(
      "error" in bobFilesAfterDeleteResult,
      true,
      `Expected successful query for Bob's files after deletion.`,
    );
    const { files: bobFilesAfterDelete } = bobFilesAfterDeleteResult as {
      files: FileDoc[];
    };
    assertEquals(
      bobFilesAfterDelete.length,
      1,
      "Bob should have 1 file after deletion.",
    );
    assertEquals(bobFilesAfterDelete[0].items[0], "bob_image.jpg");
    assertEquals(
      bobFilesAfterDelete[0]._id,
      bobImageJpgFileId,
      "The remaining file should be bob_image.jpg.",
    );
    console.log(
      `  -> Verified Bob has 1 file remaining: ${bobImageJpgFileId}.`,
    );

    // Final check that Alice's library is still isolated
    console.log(`Trace: Final verification of Alice's library isolation`);
    const aliceFinalFilesResult = await libraryConcept._getAllFiles({
      owner: userAlice,
    });
    assertNotEquals(
      "error" in aliceFinalFilesResult,
      true,
      `Expected successful query for Alice's files after Bob's deletion.`,
    );
    const { files: aliceFinalFiles } = aliceFinalFilesResult as {
      files: FileDoc[];
    };
    assertEquals(
      aliceFinalFiles.length,
      1,
      "Alice's library should still be isolated.",
    );
    assertEquals(aliceFinalFiles[0].items[0], "alice_updated_doc.txt");
    assertEquals(
      aliceFinalFiles[0]._id,
      aliceFileId,
      "Alice's file ID should still be the same.",
    );
    console.log(`  -> Verified Alice's library is still isolated.`);
  });
  await client.close();
});
```
