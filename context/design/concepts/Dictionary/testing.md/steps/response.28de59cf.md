---
timestamp: 'Mon Oct 13 2025 20:32:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_203215.7adce549.md]]'
content_id: 28de59cfdeaf06ed3916194c4bf86b749f524d1df0d098b7df8606a41cde8423
---

# response:

Here are some additional interesting test cases for the `DictionaryConcept`, focusing on aspects like multiple translations, deletion interactions, and case sensitivity, which are important for robust behavior and understanding the concept's exact semantics.

These tests would be added to `src/concepts/Dictionary/DictionaryConcept.test.ts`.

```typescript
import { assertEquals, assertNotEquals, assert } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DictionaryConcept from "./DictionaryConcept.ts";

// Re-using constants from existing tests for consistency
// LANGUAGE1 = US
// LANGUAGE2 = UK

// ... existing tests ...

Deno.test("Action: addTerm and translateTerm - handling multiple target translations for a source word", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Add 'apple' -> 'pomme'", async () => {
      const result = await concept.addTerm({ language1: "apple", language2: "pomme" });
      assertNotEquals("error" in result, true, "Adding 'apple' -> 'pomme' should succeed.");
    });

    await t.step("2. Add 'apple' -> 'manzana' (different language2)", async () => {
      // This should succeed as the pair (language1, language2) is unique, even if language1 is the same
      const result = await concept.addTerm({ language1: "apple", language2: "manzana" });
      assertNotEquals("error" in result, true, "Adding 'apple' -> 'manzana' should succeed as the pair is distinct.");
    });

    await t.step("3. Translate 'apple' from L1: Expect one translation (specific one depends on DB order)", async () => {
      const translateResult = await concept.translateTermFromL1({ language1: "apple" });
      assertEquals("error" in translateResult, false, "Translation for 'apple' should be found.");
      const { language2 } = translateResult as { language2: string };
      // The concept's `translateTermFromL1` uses `findOne`, so it will return
      // *a single* matching translation. We verify it's one of the expected ones.
      assert(language2 === "pomme" || language2 === "manzana", `Expected 'pomme' or 'manzana', got '${language2}'`);
    });

    await t.step("4. Add 'grape' -> 'uva'", async () => {
      const result = await concept.addTerm({ language1: "grape", language2: "uva" });
      assertNotEquals("error" in result, true, "Adding 'grape' -> 'uva' should succeed.");
    });

    await t.step("5. Add 'raisin' -> 'uva' (different language1)", async () => {
      // This should succeed as the pair (language1, language2) is unique, even if language2 is the same
      const result = await concept.addTerm({ language1: "raisin", language2: "uva" });
      assertNotEquals("error" in result, true, "Adding 'raisin' -> 'uva' should succeed as the pair is distinct.");
    });

    await t.step("6. Translate 'uva' from L2: Expect one translation (specific one depends on DB order)", async () => {
      const translateResult = await concept.translateTermFromL2({ language2: "uva" });
      assertEquals("error" in translateResult, false, "Translation for 'uva' should be found.");
      const { language1 } = translateResult as { language1: string };
      // Similar to L1, `translateTermFromL2` uses `findOne`.
      assert(language1 === "grape" || language1 === "raisin", `Expected 'grape' or 'raisin', got '${language1}'`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteTerm behavior with multiple target translations", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    // Setup: Add multiple translations for "car"
    await concept.addTerm({ language1: "car", language2: "auto" }); // French
    await concept.addTerm({ language1: "car", language2: "coche" }); // Spanish
    await concept.addTerm({ language1: "car", language2: "Wagen" }); // German

    await t.step("1. Successfully delete one of the multiple translations for 'car'", async () => {
      const deleteResult = await concept.deleteTerm({ language1: "car", language2: "auto" });
      assertEquals("error" in deleteResult, false, "Deleting 'car' -> 'auto' should succeed.");
    });

    await t.step("2. Verify other translations for 'car' are still present", async () => {
      // Translate from L1, should still find one of the remaining translations
      const translateResult = await concept.translateTermFromL1({ language1: "car" });
      assertEquals("error" in translateResult, false, "Translation for 'car' should still be found.");
      const { language2 } = translateResult as { language2: string };
      assert(language2 === "coche" || language2 === "Wagen", `'car' should translate to 'coche' or 'Wagen', got '${language2}'`);
      assertNotEquals(language2, "auto", "The deleted 'auto' translation should no longer be returned.");
    });

    await t.step("3. Verify the deleted specific L1->L2 translation is no longer accessible via L2", async () => {
      const translateResult = await concept.translateTermFromL2({ language2: "auto" });
      assertEquals("error" in translateResult, true, "Translating 'auto' from L2 should now fail as its L1->L2 pair was deleted.");
      assertEquals((translateResult as { error: string }).error, `Translation for "auto" not found.`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: Case sensitivity of terms for add, translate, and delete", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Add a term with mixed case", async () => {
      const result = await concept.addTerm({ language1: "Hello", language2: "Bonjour" });
      assertNotEquals("error" in result, true, "Adding 'Hello' -> 'Bonjour' should succeed.");
    });

    await t.step("2. Translate the term using its exact case (L1)", async () => {
      const translateResult = await concept.translateTermFromL1({ language1: "Hello" });
      assertEquals("error" in translateResult, false, "Translating 'Hello' (exact case) should succeed.");
      assertEquals((translateResult as { language2: string }).language2, "Bonjour");
    });

    await t.step("3. Attempt to translate the term using different case (L1) - should fail", async () => {
      const translateResult = await concept.translateTermFromL1({ language1: "hello" }); // lowercase
      assertEquals("error" in translateResult, true, "Translating 'hello' (different case) should fail due to case-sensitivity.");
      assertEquals((translateResult as { error: string }).error, `Translation for "hello" not found.`);
    });

    await t.step("4. Translate the term using its exact case (L2)", async () => {
      const translateResult = await concept.translateTermFromL2({ language2: "Bonjour" });
      assertEquals("error" in translateResult, false, "Translating 'Bonjour' (exact case) should succeed.");
      assertEquals((translateResult as { language1: string }).language1, "Hello");
    });

    await t.step("5. Attempt to translate the term using different case (L2) - should fail", async () => {
      const translateResult = await concept.translateTermFromL2({ language2: "bonjour" }); // lowercase
      assertEquals("error" in translateResult, true, "Translating 'bonjour' (different case) should fail due to case-sensitivity.");
      assertEquals((translateResult as { error: string }).error, `Translation for "bonjour" not found.`);
    });

    await t.step("6. Delete the term using its exact case", async () => {
      const deleteResult = await concept.deleteTerm({ language1: "Hello", language2: "Bonjour" });
      assertEquals("error" in deleteResult, false, "Deleting 'Hello' -> 'Bonjour' (exact case) should succeed.");
    });

    await t.step("7. Attempt to translate the deleted term (exact case) - should fail", async () => {
      const translateResult = await concept.translateTermFromL1({ language1: "Hello" });
      assertEquals("error" in translateResult, true, "Translating 'Hello' should now fail after deletion.");
    });
  } finally {
    await client.close();
  }
});
```
