---
timestamp: 'Mon Oct 13 2025 20:48:09 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_204809.eb426b65.md]]'
content_id: 8b546e104c61b4bffa0672fe86d3aaa7660fd645ccca1d3e9e1941436dfbca58
---

# file: src/concepts/Library/LibraryConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertArrayIncludes } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LibraryConcept from "./LibraryConcept.ts";

// Define some generic User and File IDs for testing
const userAlice = "user:Alice" as ID;
const userBob = "user:Bob" as ID;
const nonExistentUser = "user:NonExistent" as ID;

Deno.test("Principle: A user manages their library and files", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    let libraryAlice: ID;
    let file1: ID;
    let file2: ID;

    await t.step("1. Alice creates a library to store her files", async () => {
      const result = await libraryConcept.create({ owner: userAlice });
      assertNotEquals("error" in result, true, `Expected successful library creation for ${userAlice}, got error: ${(result as { error: string }).error}`);
      libraryAlice = (result as { library: ID }).library;
      assertExists(libraryAlice, "Library ID should be returned.");

      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      assertNotEquals("error" in allFiles, true, `Expected successful query for files, got error: ${(allFiles as { error: string }).error}`);
      assertEquals(allFiles.files.length, 0, "New library should be empty.");
    });

    await t.step("2. Alice can add files within her library", async () => {
      const items1 = ["report.pdf", "data.csv"];
      const addResult1 = await libraryConcept.addFile({ owner: userAlice, items: items1 });
      assertEquals("error" in addResult1, false, `Expected successful file addition, got error: ${(addResult1 as { error: string }).error}`);

      const items2 = ["image.jpg"];
      const addResult2 = await libraryConcept.addFile({ owner: userAlice, items: items2 });
      assertEquals("error" in addResult2, false, `Expected successful file addition, got error: ${(addResult2 as { error: string }).error}`);

      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals(allFiles.files.length, 2, "Library should now contain two files.");
      file1 = allFiles.files.find(f => f.items[0] === "report.pdf")!._id;
      file2 = allFiles.files.find(f => f.items[0] === "image.jpg")!._id;
      assertExists(file1, "File 1 ID should be found.");
      assertExists(file2, "File 2 ID should be found.");
    });

    await t.step("3. Alice can retrieve files within her library", async () => {
      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      assertNotEquals("error" in allFiles, true);
      assertEquals(allFiles.files.length, 2, "Should retrieve all two files.");
      assertArrayIncludes(allFiles.files.map(f => f.items[0]), ["report.pdf", "image.jpg"], "Retrieved files should match added files.");
    });

    await t.step("4. Alice can modify files within her library", async () => {
      const newItems = ["updated_report.docx", "new_data.xlsx"];
      const modifyResult = await libraryConcept.modifyFile({ owner: userAlice, file: file1, items: newItems });
      assertEquals("error" in modifyResult, false, `Expected successful file modification, got error: ${(modifyResult as { error: string }).error}`);

      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      const modifiedFile = allFiles.files.find(f => f._id === file1);
      assertExists(modifiedFile, "Modified file should still exist.");
      assertEquals(modifiedFile?.items, newItems, "File items should be updated.");
    });

    await t.step("5. Alice can delete files within her library", async () => {
      const deleteResult = await libraryConcept.deleteFile({ owner: userAlice, file: file2 });
      assertEquals("error" in deleteResult, false, `Expected successful file deletion, got error: ${(deleteResult as { error: string }).error}`);

      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals(allFiles.files.length, 1, "Library should now contain one file.");
      assertEquals(allFiles.files[0]._id, file1, "Only file1 should remain.");
    });

    await t.step("6. Alice can delete the library if it's no longer needed", async () => {
      const deleteLibraryResult = await libraryConcept.delete({ owner: userAlice });
      assertEquals("error" in deleteLibraryResult, false, `Expected successful library deletion, got error: ${(deleteLibraryResult as { error: string }).error}`);

      const filesAfterDeletion = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals("error" in filesAfterDeletion, true, "Querying files for a deleted library should result in an error.");
      assertEquals((filesAfterDeletion as { error: string }).error, `User ${userAlice} does not have a library.`, "Error message should indicate library not found.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: create - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    await t.step("Requires: owner doesn't already have a Library (success)", async () => {
      const result = await libraryConcept.create({ owner: userAlice });
      assertNotEquals("error" in result, true, `Expected successful creation, got error: ${(result as { error: string }).error}`);
      assertExists((result as { library: ID }).library, "Library ID should be returned.");
    });

    await t.step("Requires: owner doesn't already have a Library (failure)", async () => {
      const result = await libraryConcept.create({ owner: userAlice }); // Try to create again
      assertEquals("error" in result, true, "Expected error when creating a library for an owner who already has one.");
      assertEquals((result as { error: string }).error, `User ${userAlice} already has a library.`);
    });

    await t.step("Effects: creates a new Library with owner and empty files", async () => {
      const result = await libraryConcept.create({ owner: userBob });
      assertNotEquals("error" in result, true);
      const libraryBob = (result as { library: ID }).library;
      assertExists(libraryBob);

      const retrievedLibrary = await libraryConcept["libraries"].findOne({ _id: libraryBob }); // Access private collection for direct verification
      assertExists(retrievedLibrary, "Library document should exist in the collection.");
      assertEquals(retrievedLibrary?.owner, userBob, "Library owner should be correct.");

      const allFiles = await libraryConcept._getAllFiles({ owner: userBob });
      assertNotEquals("error" in allFiles, true);
      assertEquals(allFiles.files.length, 0, "New library should have an empty set of files.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: delete - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    // Setup: Create a library with some files for userAlice
    const createResult = await libraryConcept.create({ owner: userAlice });
    const libraryAlice = (createResult as { library: ID }).library;
    await libraryConcept.addFile({ owner: userAlice, items: ["doc1.txt"] });
    await libraryConcept.addFile({ owner: userAlice, items: ["doc2.pdf"] });

    await t.step("Requires: owner has a Library (failure)", async () => {
      const result = await libraryConcept.delete({ owner: nonExistentUser });
      assertEquals("error" in result, true, "Expected error when deleting a library for a non-existent user.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} does not have a library to delete.`);
    });

    await t.step("Effects: deletes owner's Library and all associated Files (success)", async () => {
      const allFilesBeforeDelete = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals(allFilesBeforeDelete.files.length, 2, "Should have 2 files before deletion.");

      const deleteResult = await libraryConcept.delete({ owner: userAlice });
      assertEquals("error" in deleteResult, false, `Expected successful deletion, got error: ${(deleteResult as { error: string }).error}`);

      const libraryAfterDelete = await libraryConcept["libraries"].findOne({ _id: libraryAlice });
      assertEquals(libraryAfterDelete, null, "Library document should no longer exist.");

      const filesAfterDelete = await libraryConcept["files"].find({ library: libraryAlice }).toArray(); // Direct check on files collection
      assertEquals(filesAfterDelete.length, 0, "All associated files should be deleted.");

      const queryAfterDelete = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals("error" in queryAfterDelete, true, "Querying files for deleted library should fail.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addFile - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    // Setup: Create a library for userAlice
    await libraryConcept.create({ owner: userAlice });

    await t.step("Requires: owner has a Library (failure)", async () => {
      const result = await libraryConcept.addFile({ owner: nonExistentUser, items: ["test.txt"] });
      assertEquals("error" in result, true, "Expected error when adding file to non-existent library.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} does not have a library.`);
    });

    await t.step("Effects: creates a File and adds to owner's Library (success)", async () => {
      const items = ["doc.md"];
      const addResult = await libraryConcept.addFile({ owner: userAlice, items });
      assertEquals("error" in addResult, false, `Expected successful file addition, got error: ${(addResult as { error: string }).error}`);

      const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals(allFiles.files.length, 1, "Library should have 1 file.");
      assertEquals(allFiles.files[0].items, items, "Added file items should match.");
      assertExists(allFiles.files[0].dateAdded, "File should have a dateAdded.");
    });

    await t.step("Requires: File with these items doesn't already exist (failure)", async () => {
      const items = ["doc.md"]; // Duplicate items
      const addResult = await libraryConcept.addFile({ owner: userAlice, items });
      assertEquals("error" in addResult, true, "Expected error when adding a file with duplicate items.");
      assertEquals((addResult as { error: string }).error, `A file with these items already exists in the library for user ${userAlice}.`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: modifyFile - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    // Setup: Create a library and two files for userAlice
    await libraryConcept.create({ owner: userAlice });
    await libraryConcept.addFile({ owner: userAlice, items: ["original.txt"] });
    await libraryConcept.addFile({ owner: userAlice, items: ["another.pdf"] });
    const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
    const fileToModify = allFiles.files.find(f => f.items[0] === "original.txt")!._id;
    const anotherFile = allFiles.files.find(f => f.items[0] === "another.pdf")!._id;

    await t.step("Requires: owner has a Library (failure)", async () => {
      const result = await libraryConcept.modifyFile({ owner: nonExistentUser, file: fileToModify, items: ["new.txt"] });
      assertEquals("error" in result, true, "Expected error when modifying file for non-existent library.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} does not have a library.`);
    });

    await t.step("Requires: this file is in this owner's Library (failure - non-existent file)", async () => {
      const nonExistentFile = "file:fake" as ID;
      const result = await libraryConcept.modifyFile({ owner: userAlice, file: nonExistentFile, items: ["new.txt"] });
      assertEquals("error" in result, true, "Expected error when modifying a non-existent file.");
      assertEquals((result as { error: string }).error, `File ${nonExistentFile} not found in library for user ${userAlice}.`);
    });

    await t.step("Requires: this file is in this owner's Library (failure - other user's file)", async () => {
      // Setup Bob's library and file
      await libraryConcept.create({ owner: userBob });
      await libraryConcept.addFile({ owner: userBob, items: ["bob_doc.txt"] });
      const bobFiles = await libraryConcept._getAllFiles({ owner: userBob });
      const bobsFile = bobFiles.files[0]._id;

      const result = await libraryConcept.modifyFile({ owner: userAlice, file: bobsFile, items: ["stolen_doc.txt"] });
      assertEquals("error" in result, true, "Expected error when Alice tries to modify Bob's file.");
      assertEquals((result as { error: string }).error, `File ${bobsFile} not found in library for user ${userAlice}.`);
    });

    await t.step("Requires: new items don't duplicate another existing file (failure)", async () => {
      const newItems = ["another.pdf"]; // These items already exist for 'anotherFile'
      const result = await libraryConcept.modifyFile({ owner: userAlice, file: fileToModify, items: newItems });
      assertEquals("error" in result, true, "Expected error when modifying to duplicate existing file items.");
      assertEquals((result as { error: string }).error, `A different file with these items already exists in the library for user ${userAlice}.`);
    });

    await t.step("Effects: changes this file's items (success)", async () => {
      const newItems = ["updated.txt"];
      const modifyResult = await libraryConcept.modifyFile({ owner: userAlice, file: fileToModify, items: newItems });
      assertEquals("error" in modifyResult, false, `Expected successful modification, got error: ${(modifyResult as { error: string }).error}`);

      const updatedFiles = await libraryConcept._getAllFiles({ owner: userAlice });
      const modifiedDoc = updatedFiles.files.find(f => f._id === fileToModify);
      assertEquals(modifiedDoc?.items, newItems, "File items should be updated.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteFile - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    // Setup: Create a library and a file for userAlice
    await libraryConcept.create({ owner: userAlice });
    await libraryConcept.addFile({ owner: userAlice, items: ["file_to_delete.txt"] });
    const allFiles = await libraryConcept._getAllFiles({ owner: userAlice });
    const fileToDelete = allFiles.files[0]._id;

    await t.step("Requires: owner has a Library (failure)", async () => {
      const result = await libraryConcept.deleteFile({ owner: nonExistentUser, file: fileToDelete });
      assertEquals("error" in result, true, "Expected error when deleting file for non-existent library.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} does not have a library.`);
    });

    await t.step("Requires: this file is in this owner's Library (failure - non-existent file)", async () => {
      const nonExistentFile = "file:fake" as ID;
      const result = await libraryConcept.deleteFile({ owner: userAlice, file: nonExistentFile });
      assertEquals("error" in result, true, "Expected error when deleting a non-existent file.");
      assertEquals((result as { error: string }).error, `File ${nonExistentFile} not found in library for user ${userAlice}.`);
    });

    await t.step("Requires: this file is in this owner's Library (failure - other user's file)", async () => {
      // Setup Bob's library and file
      await libraryConcept.create({ owner: userBob });
      await libraryConcept.addFile({ owner: userBob, items: ["bob_secret.txt"] });
      const bobFiles = await libraryConcept._getAllFiles({ owner: userBob });
      const bobsFile = bobFiles.files[0]._id;

      const result = await libraryConcept.deleteFile({ owner: userAlice, file: bobsFile });
      assertEquals("error" in result, true, "Expected error when Alice tries to delete Bob's file.");
      assertEquals((result as { error: string }).error, `File ${bobsFile} not found in library for user ${userAlice}.`);
    });

    await t.step("Effects: deletes this file from this owner's Library (success)", async () => {
      const deleteResult = await libraryConcept.deleteFile({ owner: userAlice, file: fileToDelete });
      assertEquals("error" in deleteResult, false, `Expected successful file deletion, got error: ${(deleteResult as { error: string }).error}`);

      const filesAfterDelete = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals(filesAfterDelete.files.length, 0, "Library should be empty after file deletion.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getAllFiles - requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    await t.step("Requires: this owner has a Library (failure)", async () => {
      const result = await libraryConcept._getAllFiles({ owner: nonExistentUser });
      assertEquals("error" in result, true, "Expected error when querying files for non-existent library.");
      assertEquals((result as { error: string }).error, `User ${nonExistentUser} does not have a library.`);
    });

    await t.step("Effects: returns all Files in this owner's Library (empty library)", async () => {
      await libraryConcept.create({ owner: userAlice });
      const result = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals("error" in result, false);
      assertEquals(result.files.length, 0, "Should return an empty array for a new, empty library.");
    });

    await t.step("Effects: returns all Files in this owner's Library (with files)", async () => {
      await libraryConcept.addFile({ owner: userAlice, items: ["img.png"] });
      await libraryConcept.addFile({ owner: userAlice, items: ["video.mp4"] });
      const result = await libraryConcept._getAllFiles({ owner: userAlice });
      assertEquals("error" in result, false);
      assertEquals(result.files.length, 2, "Should return all two files.");
      assertArrayIncludes(result.files.map(f => f.items[0]), ["img.png", "video.mp4"]);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Scenario: Multiple users manage their independent libraries", async (t) => {
  const [db, client] = await testDb();
  const libraryConcept = new LibraryConcept(db);

  try {
    // Alice's actions
    await libraryConcept.create({ owner: userAlice });
    await libraryConcept.addFile({ owner: userAlice, items: ["alice_doc.txt"] });
    const aliceFilesBefore = await libraryConcept._getAllFiles({ owner: userAlice });
    assertEquals(aliceFilesBefore.files.length, 1, "Alice should have 1 file.");

    // Bob's actions
    await libraryConcept.create({ owner: userBob });
    await libraryConcept.addFile({ owner: userBob, items: ["bob_report.pdf"] });
    await libraryConcept.addFile({ owner: userBob, items: ["bob_image.jpg"] });
    const bobFilesBefore = await libraryConcept._getAllFiles({ owner: userBob });
    assertEquals(bobFilesBefore.files.length, 2, "Bob should have 2 files.");

    // Verify Alice's library is unchanged after Bob's actions
    const aliceFilesAfter = await libraryConcept._getAllFiles({ owner: userAlice });
    assertEquals(aliceFilesAfter.files.length, 1, "Alice's library should remain unchanged.");
    assertEquals(aliceFilesAfter.files[0].items[0], "alice_doc.txt");

    // Alice modifies her file
    const aliceFileId = aliceFilesAfter.files[0]._id;
    await libraryConcept.modifyFile({ owner: userAlice, file: aliceFileId, items: ["alice_updated_doc.txt"] });
    const aliceFilesUpdated = await libraryConcept._getAllFiles({ owner: userAlice });
    assertEquals(aliceFilesUpdated.files[0].items[0], "alice_updated_doc.txt", "Alice's file should be updated.");

    // Bob deletes one of his files
    const bobFileToDelete = bobFilesBefore.files.find(f => f.items[0] === "bob_report.pdf")!._id;
    await libraryConcept.deleteFile({ owner: userBob, file: bobFileToDelete });
    const bobFilesAfterDelete = await libraryConcept._getAllFiles({ owner: userBob });
    assertEquals(bobFilesAfterDelete.files.length, 1, "Bob should have 1 file after deletion.");
    assertEquals(bobFilesAfterDelete.files[0].items[0], "bob_image.jpg");

    // Final check that Alice's library is still isolated
    const aliceFinalFiles = await libraryConcept._getAllFiles({ owner: userAlice });
    assertEquals(aliceFinalFiles.files.length, 1, "Alice's library should still be isolated.");
    assertEquals(aliceFinalFiles.files[0].items[0], "alice_updated_doc.txt");
  } finally {
    await client.close();
  }
});
```

***
