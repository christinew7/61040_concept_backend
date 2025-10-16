---
timestamp: 'Thu Oct 16 2025 15:18:03 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_151803.1d697268.md]]'
content_id: f54ecfa91e00b214fb70f4394edc26fc51c6975ea9f12b2d1499ee1445c780a0
---

# response:

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

  await t.step("2. Alice creates one file and adds items to it", async () => {
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

    await concept.addItemToFile({ owner: userAlice, file: file1, item: "hello" });
    await concept.addItemToFile({
      owner: userAlice,
      file: file1,
      item: "this is a file",
    });

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
    assertEquals(files[0]._id, file1, "The returned file ID should match.");

    assertArrayIncludes(
      files[0].items,
      ["hello", "this is a file"],
      "The first file should have two items",
    );
  });

  await t.step("3. Alice modifies an item in her file in her library", async () => {
    // Modify the second item in the file
    const modifyItemResult = await concept.modifyItemInFile({
      owner: userAlice,
      file: file1,
      index: 1, // "this is a file" is at index 1
      newItem: "this is still a file modified",
    });
    assertNotEquals(
      "error" in modifyItemResult,
      true,
      `Modifying an item in file should be successful, got error: ${
        (modifyItemResult as { error: string }).error
      }`,
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

    assertEquals(
      files[0].items,
      ["hello", "this is still a file modified"],
      "The file's items should be updated.",
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

  await client.close();
});

Deno.test("Action: create and file operations with duplicates/multiple", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);
  let bobLibrary: ID;

  await t.step("1. Duplicate library is not allowed", async () => {
    const createResult = await concept.create({ owner: userBob });
    assertNotEquals(
      "error" in createResult,
      true,
      `Expected initial library creation for Bob to succeed, got error: ${
        (createResult as { error: string }).error
      }`,
    );
    bobLibrary = (createResult as { library: ID }).library;

    const duplicateCreateResult = await concept.create({ owner: userBob });
    assertEquals(
      "error" in duplicateCreateResult,
      true,
      "Should not allow creating a second library for the same owner.",
    );
    assertEquals(
      (duplicateCreateResult as { error: string }).error,
      `User ${userBob} already has a library.`,
    );
  });

  let fileBob1: ID;
  await t.step("2. Can create multiple files, even empty ones", async () => {
    const createFile1Result = await concept.createFile({ owner: userBob });
    assertNotEquals(
      "error" in createFile1Result,
      true,
      `Expected file creation 1 to succeed, got error: ${
        (createFile1Result as { error: string }).error
      }`,
    );
    fileBob1 = (createFile1Result as { id: ID }).id;

    const createFile2Result = await concept.createFile({ owner: userBob });
    assertNotEquals(
      "error" in createFile2Result,
      true,
      `Expected file creation 2 to succeed, got error: ${
        (createFile2Result as { error: string }).error
      }`,
    );
    const fileBob2 = (createFile2Result as { id: ID }).id;

    assertNotEquals(fileBob1, fileBob2, "Two calls to createFile should return different file IDs.");

    const allFiles = await concept._getAllFiles({ owner: userBob });
    assertEquals(
      (allFiles as { files: FileDoc[] }).files.length,
      2,
      "Bob should now have two empty files.",
    );
  });

  await t.step("3. addItemToFile allows duplicate item strings", async () => {
    await concept.addItemToFile({
      owner: userBob,
      file: fileBob1,
      item: "document content",
    });
    await concept.addItemToFile({
      owner: userBob,
      file: fileBob1,
      item: "document content",
    }); // Duplicate item string

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
  });

  await client.close();
});

Deno.test("Action: delete and deleteFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let libraryAlice: ID;
  const createAliceLibResult = await concept.create({ owner: userAlice });
  assertNotEquals("error" in createAliceLibResult, true);
  libraryAlice = (createAliceLibResult as { library: ID }).library;

  let libraryBob: ID;
  const createBobLibResult = await concept.create({ owner: userBob });
  assertNotEquals("error" in createBobLibResult, true);
  libraryBob = (createBobLibResult as { library: ID }).library;

  const testFileAlice1Result = await concept.createFile({ owner: userAlice });
  assertNotEquals("error" in testFileAlice1Result, true);
  const testFileAlice1Id = (testFileAlice1Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userAlice,
    file: testFileAlice1Id,
    item: "doc1.txt",
  });

  const testFileAlice2Result = await concept.createFile({ owner: userAlice });
  assertNotEquals("error" in testFileAlice2Result, true);
  const testFileAlice2Id = (testFileAlice2Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userAlice,
    file: testFileAlice2Id,
    item: "doc2.pdf",
  });

  const testFileBob1Result = await concept.createFile({ owner: userBob });
  assertNotEquals("error" in testFileBob1Result, true);
  const testFileBob1Id = (testFileBob1Result as { id: ID }).id;
  await concept.addItemToFile({
    owner: userBob,
    file: testFileBob1Id,
    item: "doc3",
  });

  await t.step(
    "1. Cannot delete a library for a nonexistent owner",
    async () => {
      const deleteNonexistentResult = await concept.delete({
        owner: nonExistentUser,
      });
      assertEquals(
        "error" in deleteNonexistentResult,
        true,
        "There cannot be a successful deletion for an owner with no library",
      );
    },
  );

  await t.step(
    "2. Cannot delete an existing file under a nonexisting owner",
    async () => {
      const deleteFileResult = await concept.deleteFile({
        owner: nonExistentUser,
        file: testFileAlice1Id,
      });
      assertEquals(
        "error" in deleteFileResult,
        true,
        "File cannot be deleted if the owner does not exist",
      );
    },
  );

  await t.step(
    "3. Cannot delete an existing file under an existing user, but doesn't belong in their library",
    async () => {
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
    },
  );
  await client.close();
});

Deno.test("Actions: createFile, addItemToFile, modifyItemInFile, removeItemFromFile, deleteFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  let aliceLibrary: ID;
  let aliceFile1: ID;
  let aliceFile2: ID;

  await t.step("Setup: Alice creates a library and two files", async () => {
    const createLibResult = await concept.create({ owner: userAlice });
    assertNotEquals("error" in createLibResult, true);
    aliceLibrary = (createLibResult as { library: ID }).library;

    const createFile1Result = await concept.createFile({ owner: userAlice });
    assertNotEquals("error" in createFile1Result, true);
    aliceFile1 = (createFile1Result as { id: ID }).id;
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

    const createFile2Result = await concept.createFile({ owner: userAlice });
    assertNotEquals("error" in createFile2Result, true);
    aliceFile2 = (createFile2Result as { id: ID }).id;
    await concept.addItemToFile({
      owner: userAlice,
      file: aliceFile2,
      item: "item_c",
    });

    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    assertEquals(files.length, 2);
    assertEquals(
      files.find((f) => f._id === aliceFile1)?.items,
      ["item_a", "item_b"],
    );
    assertEquals(
      files.find((f) => f._id === aliceFile2)?.items,
      ["item_c"],
    );
  });

  await t.step("1. addItemToFile: adds an item to a file", async () => {
    await concept.addItemToFile({ owner: userAlice, file: aliceFile1, item: "item_d" });
    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(file.items, ["item_a", "item_b", "item_d"], "item_d should be added to file1.");
  });

  await t.step("2. addItemToFile: requires existing library/file", async () => {
    const resultNoLibrary = await concept.addItemToFile({
      owner: nonExistentUser,
      file: aliceFile1,
      item: "test",
    });
    assertEquals("error" in resultNoLibrary, true, "Should fail if owner has no library.");
    assertEquals(
      (resultNoLibrary as { error: string }).error,
      `User ${nonExistentUser} does not have a library.`,
    );

    const resultNoFile = await concept.addItemToFile({
      owner: userAlice,
      file: "file:fake" as ID,
      item: "test",
    });
    assertEquals("error" in resultNoFile, true, "Should fail if file does not exist in library.");
    assertEquals(
      (resultNoFile as { error: string }).error,
      `File file:fake not found in library for user ${userAlice}.`,
    );
  });

  await t.step("3. modifyItemInFile: replaces an item at a specific index", async () => {
    await concept.modifyItemInFile({
      owner: userAlice,
      file: aliceFile1,
      index: 1,
      newItem: "item_b_modified",
    });
    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(
      file.items,
      ["item_a", "item_b_modified", "item_d"],
      "item_b should be modified.",
    );
  });

  await t.step("4. modifyItemInFile: requires existing library/file and valid index", async () => {
    const resultNoLibrary = await concept.modifyItemInFile({
      owner: nonExistentUser,
      file: aliceFile1,
      index: 0,
      newItem: "test",
    });
    assertEquals("error" in resultNoLibrary, true, "Should fail if owner has no library.");
    assertEquals(
      (resultNoLibrary as { error: string }).error,
      `User ${nonExistentUser} does not have a library.`,
    );

    const resultNoFile = await concept.modifyItemInFile({
      owner: userAlice,
      file: "file:fake" as ID,
      index: 0,
      newItem: "test",
    });
    assertEquals("error" in resultNoFile, true, "Should fail if file does not exist in library.");
    assertEquals(
      (resultNoFile as { error: string }).error,
      `File file:fake not found in library for user ${userAlice}.`,
    );

    const resultInvalidIndexNegative = await concept.modifyItemInFile({
      owner: userAlice,
      file: aliceFile1,
      index: -1,
      newItem: "test",
    });
    assertEquals("error" in resultInvalidIndexNegative, true, "Should fail for negative index.");
    assertEquals(
      (resultInvalidIndexNegative as { error: string }).error,
      `Index -1 is out of bounds for file ${aliceFile1}.`,
    );

    const resultInvalidIndexTooHigh = await concept.modifyItemInFile({
      owner: userAlice,
      file: aliceFile1,
      index: 100,
      newItem: "test",
    });
    assertEquals("error" in resultInvalidIndexTooHigh, true, "Should fail for index out of bounds.");
    assertEquals(
      (resultInvalidIndexTooHigh as { error: string }).error,
      `Index 100 is out of bounds for file ${aliceFile1}.`,
    );
  });

  await t.step("5. removeItemFromFile: removes an item at a specific index", async () => {
    await concept.removeItemFromFile({ owner: userAlice, file: aliceFile1, index: 0 }); // Remove "item_a"
    const files = (await concept._getAllFiles({ owner: userAlice })) as {
      files: FileDoc[];
    };
    const file = files.find((f) => f._id === aliceFile1);
    assertExists(file);
    assertEquals(
      file.items,
      ["item_b_modified", "item_d"],
      "item_a should be removed.",
    );
  });

  await t.step("6. removeItemFromFile: requires existing library/file and valid index", async () => {
    const resultNoLibrary = await concept.removeItemFromFile({
      owner: nonExistentUser,
      file: aliceFile1,
      index: 0,
    });
    assertEquals("error" in resultNoLibrary, true, "Should fail if owner has no library.");
    assertEquals(
      (resultNoLibrary as { error: string }).error,
      `User ${nonExistentUser} does not have a library.`,
    );

    const resultNoFile = await concept.removeItemFromFile({
      owner: userAlice,
      file: "file:fake" as ID,
      index: 0,
    });
    assertEquals("error" in resultNoFile, true, "Should fail if file does not exist in library.");
    assertEquals(
      (resultNoFile as { error: string }).error,
      `File file:fake not found in library for user ${userAlice}.`,
    );

    const resultInvalidIndexNegative = await concept.removeItemFromFile({
      owner: userAlice,
      file: aliceFile1,
      index: -1,
    });
    assertEquals("error" in resultInvalidIndexNegative, true, "Should fail for negative index.");
    assertEquals(
      (resultInvalidIndexNegative as { error: string }).error,
      `Index -1 is out of bounds for file ${aliceFile1}.`,
    );

    const resultInvalidIndexTooHigh = await concept.removeItemFromFile({
      owner: userAlice,
      file: aliceFile1,
      index: 100,
    });
    assertEquals("error" in resultInvalidIndexTooHigh, true, "Should fail for index out of bounds.");
    assertEquals(
      (resultInvalidIndexTooHigh as { error: string }).error,
      `Index 100 is out of bounds for file ${aliceFile1}.`,
    );
  });

  await client.close();
});

Deno.test("Multiple users manage their independent libraries", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  let aliceLibraryId: ID;
  let aliceFileId: ID;
  let bobReportPdfFileId: ID;
  let bobImageJpgFileId: ID;

  await t.step("1. Alice creates a library and adds a file with an item", async () => {
    // Alice's actions
    const createAliceLibResult = await libraryConcept.create({
      owner: userAlice,
    });
    assertNotEquals(
      "error" in createAliceLibResult,
      true,
      `Expected successful library creation for Alice.`,
    );
    aliceLibraryId = (createAliceLibResult as { library: ID }).library;

    const createAliceFileResult = await libraryConcept.createFile({
      owner: userAlice,
    });
    assertNotEquals(
      "error" in createAliceFileResult,
      true,
      `Expected successful file creation for Alice.`,
    );
    aliceFileId = (createAliceFileResult as { id: ID }).id;

    await libraryConcept.addItemToFile({
      owner: userAlice,
      file: aliceFileId,
      item: "alice_doc.txt",
    });

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
  });

  await t.step("2. Bob creates a library and adds some files with items", async () => {
    // Bob's actions
    const createBobLibResult = await libraryConcept.create({ owner: userBob });
    assertNotEquals(
      "error" in createBobLibResult,
      true,
      `Expected successful library creation for Bob.`,
    );

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
      bobFilesBefore.find((f) => f._id === bobReportPdfFileId && f.items[0] === "bob_report.pdf"),
      "bob_report.pdf should be present with correct content.",
    );
    assertExists(
      bobFilesBefore.find((f) => f._id === bobImageJpgFileId && f.items[0] === "bob_image.jpg"),
      "bob_image.jpg should be present with correct content.",
    );

    // Verify Alice's library is unchanged after Bob's actions
    const aliceFilesAfterBobActionsResult = await libraryConcept._getAllFiles({
      owner: userAlice,
    });
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
  });

  await t.step("3. Alice modifies an item in her file after Bob", async () => {
    // Use the `aliceFileId` declared at the top of the test function
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
  });

  await t.step("4. Bob deletes one of his files", async () => {
    // Use `bobReportPdfFileId` declared at the top of the test function
    const deleteBobFileResult = await libraryConcept.deleteFile({
      owner: userBob,
      file: bobReportPdfFileId,
    });
    assertNotEquals(
      "error" in deleteBobFileResult,
      true,
      "Expected successful deletion of Bob's file.",
    );

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

    // Final check that Alice's library is still isolated
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
  });
  await client.close();
});
```
