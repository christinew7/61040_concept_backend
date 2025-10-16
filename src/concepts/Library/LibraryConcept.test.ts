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

  await client.close();
});

Deno.test("Action: duplicates (create and addFile)", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  await t.step("1. Duplicate library is not allowed", async () => {
    await concept.create({ owner: userBob });
    const duplicateCreateResult = await concept.create({ owner: userBob });
    assertEquals(
      "error" in duplicateCreateResult,
      true,
      "There is an error in creating another library because Bob already has an existing library",
    );
  });

  await t.step("2. Duplicate file is not allowed", async () => {
    await concept.addFile({
      owner: userBob,
      items: ["this", "is", "not", "true."],
    });
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

  await client.close();
});

Deno.test("Action: delete and deleteFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  await concept.create({ owner: userAlice });
  await concept.create({ owner: userBob });
  const testFile = await concept.addFile({
    owner: userAlice,
    items: ["doc1.txt"],
  });
  const testFileId = (testFile as { id: ID }).id;
  await concept.addFile({ owner: userAlice, items: ["doc2.pdf"] });
  await concept.addFile({ owner: userBob, items: ["doc3"] });

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
        file: testFileId,
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
        file: testFileId,
      });
      assertEquals(
        "error" in deleteFileResult,
        true,
        "File cannot be deleted if the owner's library doesn't have the file item'",
      );
    },
  );
  await client.close();
});

Deno.test("Action: addFile and modifyFile", async (t) => {
  const [db, client] = await testDb();
  const concept = new LibraryConcept(db);

  await concept.create({ owner: userAlice });
  const testFile = await concept.addFile({
    owner: userAlice,
    items: ["doc1.txt"],
  });
  const testFileId = (testFile as { id: ID }).id;
  await concept.addFile({ owner: userAlice, items: ["doc2.pdf"] });

  await t.step("1. Can modify file with no real changes", async () => {
    const modifyResult = await concept.modifyFile({
      owner: userAlice,
      file: testFileId,
      items: ["doc1.txt"],
    });
    assertNotEquals(
      "error" in modifyResult,
      true,
      "Should still be able to modify file even if there is no change",
    );
  });
  await t.step("2. Can add a file with slight changes", async () => {
    const addResult = await concept.addFile({
      owner: userAlice,
      items: ["doc1.txt "],
    });
    assertNotEquals(
      "error" in addResult,
      true,
      "Should still be able to modify file even if there is no change",
    );
  });

  await client.close();
});

Deno.test("Multiple users manage their independent libraries", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  let aliceLibraryId: ID;
  let aliceFileId: ID; // To store the ID of Alice's file
  let bobReportPdfFileId: ID; // To store the ID of Bob's 'bob_report.pdf'
  let bobImageJpgFileId: ID; // To store the ID of Bob's 'bob_image.jpg'

  await t.step("1. Alice creates a library", async () => {
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

    const addAliceFileResult = await libraryConcept.addFile({
      owner: userAlice,
      items: ["alice_doc.txt"],
    });
    assertNotEquals(
      "error" in addAliceFileResult,
      true,
      `Expected successful file addition for Alice.`,
    );
    aliceFileId = (addAliceFileResult as { id: ID }).id; // Assign to outer scope variable

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
      aliceFilesBefore[0].items[0],
      "alice_doc.txt",
      "Alice's file content should be correct.",
    );
  });

  await t.step("2. Bob creates a library and adds some files", async () => {
    // Bob's actions
    const createBobLibResult = await libraryConcept.create({ owner: userBob });
    assertNotEquals(
      "error" in createBobLibResult,
      true,
      `Expected successful library creation for Bob.`,
    );

    const addBobFile1Result = await libraryConcept.addFile({
      owner: userBob,
      items: ["bob_report.pdf"],
    });
    assertNotEquals(
      "error" in addBobFile1Result,
      true,
      `Expected successful file addition for Bob (bob_report.pdf).`,
    );
    bobReportPdfFileId = (addBobFile1Result as { id: ID }).id; // Assign to outer scope variable

    const addBobFile2Result = await libraryConcept.addFile({
      owner: userBob,
      items: ["bob_image.jpg"],
    });
    assertNotEquals(
      "error" in addBobFile2Result,
      true,
      `Expected successful file addition for Bob (bob_image.jpg).`,
    );
    bobImageJpgFileId = (addBobFile2Result as { id: ID }).id; // Assign to outer scope variable

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
      bobFilesBefore.find((f) => f._id === bobReportPdfFileId),
      "bob_report.pdf should be present.",
    );
    assertExists(
      bobFilesBefore.find((f) => f._id === bobImageJpgFileId),
      "bob_image.jpg should be present.",
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

  await t.step("3. Alice modifies her file after Bob", async () => {
    // Use the `aliceFileId` declared at the top of the test function
    const modifyAliceFileResult = await libraryConcept.modifyFile({
      owner: userAlice,
      file: aliceFileId,
      items: ["alice_updated_doc.txt"],
    });
    assertNotEquals(
      "error" in modifyAliceFileResult,
      true,
      "Expected successful modification of Alice's file.",
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
