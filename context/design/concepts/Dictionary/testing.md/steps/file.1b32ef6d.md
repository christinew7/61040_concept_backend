---
timestamp: 'Mon Oct 13 2025 19:38:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_193829.bafa8d83.md]]'
content_id: 1b32ef6deec4cbd01fe86b4acf3b31535e4a9a6e034a9a8f6e21d4d2ccfdd153
---

# file: src/concepts/Dictionary/DictionaryConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DictionaryConcept from "./DictionaryConcept.ts";

Deno.test("Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Add a term pair to the dictionary", async () => {
      const addTermResult = await concept.addTerm({
        language1: "hello",
        language2: "bonjour",
      });
      assertEquals("error" in addTermResult, false, `addTerm should succeed: ${JSON.stringify(addTermResult)}`);
      assertExists((addTermResult as { id: ID }).id, "The added term should have an ID.");
      console.log(`Added term: ${JSON.stringify(addTermResult)}`);
    });

    await t.step("2. Request translation from language1 to language2", async () => {
      const translateResult = await concept.translateTermFromL1({ language1: "hello" });
      assertEquals("error" in translateResult, false, `Translation from L1 should succeed: ${JSON.stringify(translateResult)}`);
      assertEquals((translateResult as { language2: string }).language2, "bonjour", "Should correctly translate 'hello' to 'bonjour'.");
      console.log(`Translated 'hello' to: ${JSON.stringify(translateResult)}`);
    });

    await t.step("3. Request translation from language2 to language1", async () => {
      const translateResult = await concept.translateTermFromL2({ language2: "bonjour" });
      assertEquals("error" in translateResult, false, `Translation from L2 should succeed: ${JSON.stringify(translateResult)}`);
      assertEquals((translateResult as { language1: string }).language1, "hello", "Should correctly translate 'bonjour' to 'hello'.");
      console.log(`Translated 'bonjour' to: ${JSON.stringify(translateResult)}`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addTerm requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Successfully add a new term", async () => {
      const result = await concept.addTerm({ language1: "cat", language2: "chat" });
      assertEquals("error" in result, false, `Adding 'cat'->'chat' should succeed: ${JSON.stringify(result)}`);
      assertExists((result as { id: ID }).id);

      // Verify effect: can translate the new term
      const translated = await concept.translateTermFromL1({ language1: "cat" });
      assertEquals("error" in translated, false);
      assertEquals((translated as { language2: string }).language2, "chat");
      console.log(`Successfully added 'cat'->'chat' and verified translation.`);
    });

    await t.step("2. Cannot add an already existing term (requires)", async () => {
      await concept.addTerm({ language1: "dog", language2: "chien" }); // Add first
      console.log(`Added 'dog'->'chien' initially.`);

      const result = await concept.addTerm({ language1: "dog", language2: "chien" }); // Attempt to add again
      assertEquals("error" in result, true, `Adding 'dog'->'chien' again should fail: ${JSON.stringify(result)}`);
      assertEquals((result as { error: string }).error, "This term pair dog -> chien already exists.", "Error message should match.");
      console.log(`Attempted to add 'dog'->'chien' again, got expected error: ${JSON.stringify(result)}`);
    });

    await t.step("3. Can add terms with same words but different pairs", async () => {
      await concept.addTerm({ language1: "house", language2: "maison" }); // Add 1
      const result = await concept.addTerm({ language1: "house", language2: "casa" }); // Add 2 (different L2)
      assertEquals("error" in result, false, `Adding 'house'->'casa' should succeed: ${JSON.stringify(result)}`);
      console.log(`Added 'house'->'maison' and 'house'->'casa' successfully.`);

      const trans1 = await concept.translateTermFromL1({ language1: "house" });
      assertEquals("error" in trans1, false, "Should find at least one translation for 'house'.");
      // Note: order is not guaranteed, but one should be found. The current concept finds the first.
      console.log(`Translation for 'house' found: ${JSON.stringify(trans1)}`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteTerm requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Successfully delete an existing term", async () => {
      await concept.addTerm({ language1: "book", language2: "livre" });
      console.log(`Added 'book'->'livre'.`);

      const deleteResult = await concept.deleteTerm({ language1: "book", language2: "livre" });
      assertEquals("error" in deleteResult, false, `Deleting 'book'->'livre' should succeed: ${JSON.stringify(deleteResult)}`);
      assertEquals(Object.keys(deleteResult).length, 0, "Delete should return an empty object on success.");
      console.log(`Successfully deleted 'book'->'livre'.`);

      // Verify effect: term is no longer translatable
      const translated = await concept.translateTermFromL1({ language1: "book" });
      assertEquals("error" in translated, true, "Translating deleted term should now fail.");
      assertEquals((translated as { error: string }).error, `Translation for "book" not found.`, "Error message should match.");
      console.log(`Verified 'book' is no longer translatable: ${JSON.stringify(translated)}`);
    });

    await t.step("2. Cannot delete a non-existent term (requires)", async () => {
      const deleteResult = await concept.deleteTerm({ language1: "nonexistent", language2: "notfound" });
      assertEquals("error" in deleteResult, true, `Deleting a non-existent term should fail: ${JSON.stringify(deleteResult)}`);
      assertEquals((deleteResult as { error: string }).error, `Term pair "nonexistent" -> "notfound" not found.`, "Error message should match.");
      console.log(`Attempted to delete non-existent term, got expected error: ${JSON.stringify(deleteResult)}`);
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: translateTermFromL1/L2 requirements and effects", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  try {
    await t.step("1. Setup: add terms for translation", async () => {
      await concept.addTerm({ language1: "apple", language2: "pomme" });
      await concept.addTerm({ language1: "water", language2: "eau" });
      console.log(`Added 'apple'->'pomme' and 'water'->'eau'.`);
    });

    await t.step("2. Successfully translate from L1", async () => {
      const result = await concept.translateTermFromL1({ language1: "apple" });
      assertEquals("error" in result, false, `Translating 'apple' should succeed: ${JSON.stringify(result)}`);
      assertEquals((result as { language2: string }).language2, "pomme");
      console.log(`Translated 'apple' to 'pomme'.`);
    });

    await t.step("3. Successfully translate from L2", async () => {
      const result = await concept.translateTermFromL2({ language2: "eau" });
      assertEquals("error" in result, false, `Translating 'eau' should succeed: ${JSON.stringify(result)}`);
      assertEquals((result as { language1: string }).language1, "water");
      console.log(`Translated 'eau' to 'water'.`);
    });

    await t.step("4. Fail to translate non-existent term from L1 (requires)", async () => {
      const result = await concept.translateTermFromL1({ language1: "grape" });
      assertEquals("error" in result, true, `Translating non-existent 'grape' should fail: ${JSON.stringify(result)}`);
      assertEquals((result as { error: string }).error, `Translation for "grape" not found.`, "Error message should match.");
      console.log(`Attempted to translate non-existent 'grape', got expected error: ${JSON.stringify(result)}`);
    });

    await t.step("5. Fail to translate non-existent term from L2 (requires)", async () => {
      const result = await concept.translateTermFromL2({ language2: "raisin" });
      assertEquals("error" in result, true, `Translating non-existent 'raisin' should fail: ${JSON.stringify(result)}`);
      assertEquals((result as { error: string }).error, `Translation for "raisin" not found.`, "Error message should match.");
      console.log(`Attempted to translate non-existent 'raisin', got expected error: ${JSON.stringify(result)}`);
    });
  } finally {
    await client.close();
  }
});
```
