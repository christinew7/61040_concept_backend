
[@testing-concepts](../../background/testing-concepts.md)

[@implementation](../../../src/concepts/Dictionary/DictionaryConcept.ts)

[@testing](../../../src/concepts/Dictionary/DictionaryConcept.test.ts)

[@Likert testing](../LikertSurvey/testing.md)
# testing concepts:
**Testing concepts**. Your tests should cover the basic behavior of the concept but should also include some more interesting cases. Your tests should use the Deno testing framework and should be programmatic (that is, determining in the code whether they succeeded or failed, and not requiring a human to interpret console messages). They should also print helpful messages to the console with action inputs and outputs so that a human reader can make sense of the test execution when it runs in the console. Some more details about the test cases you should include:

- **Operational principle**. A sequence of action executions that corresponds to the operational principle, representing the common expected usage of the concept. These sequence is not required to use all the actions; operational principles often do not include a deletion action, for example.
- **Interesting scenarios**. Sequences of action executions that correspond to less common cases: probing interesting corners of the functionality, undoing actions with deletions and cancellations, repeating actions with the same arguments, etc. In some of these scenarios actions may be expected to throw errors.
- **Number required**. For each concept, you should have one test sequence for the operational principle, and 3-5 additional interesting scenarios. Every action should be executed successfully in at least one of the scenarios.
- **No state setup**. Your test cases should not require any setting up of the concept state except by calling concept actions. When you are testing one action at a time, this means that you will want to order your actions carefully (for example, by the operational principle) to avoid having to set up state.
- **Saving test execution output**. Save the test execution output by copy-pasting from the console to a markdown file.

# prompt: can you add how to use ID in the test cases for dictionary concept and check for those
# response:

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";

import DictionaryConcept from "./DictionaryConcept.ts";

// LANGUAGE1 = US
// LANGUAGE2 = UK
Deno.test(
  "Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language",
  async (t) => {
    const [db, client] = await testDb();
    const concept = new DictionaryConcept(db);

    let createdTermId: ID; // Declare a variable to hold the ID returned by addTerm

    await t.step("1. Add one crochet translation term and verify its ID", async () => {
      const addTermResult = await concept.addTerm({
        language1: "double crochet",
        language2: "treble crochet",
      });
      assertNotEquals(
        "error" in addTermResult,
        true,
        "addTerm should succeed without error.",
      );
      const { id } = addTermResult as { id: ID };
      assertExists(id, "A term ID should be returned on successful addition.");
      assertEquals(typeof id, "string", "The returned term ID should be a string type.");
      createdTermId = id; // Store the ID for potential future reference
      console.log(`Principle test: Added term with ID: ${createdTermId}`);
    });

    await t.step(
      "2. User requests translation from US to UK term for this term",
      async () => {
        const translateTermResult = await concept.translateTermFromL1({
          language1: "double crochet",
        });
        assertNotEquals(
          "error" in translateTermResult,
          true,
          "translateTermFromL1 should succeed without error.",
        );
        assertEquals(
          "error" in translateTermResult,
          false,
          "translateTermFromL1 should succeed and not return an error.",
        );
        const { language2 } = translateTermResult as { language2: string };
        assertEquals(
          language2,
          "treble crochet",
          "The translation should be `treble crochet`",
        );
        console.log(`Principle test: Translated 'double crochet' to '${language2}'`);
      },
    );
    await client.close();
  },
);

Deno.test("Action: addTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  let initialTermId: ID; // To hold the ID of the first added term

  await t.step("0. Successfully add a term and verify its ID", async () => {
    const addTermResult = await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals("error" in addTermResult, false, "addTerm should succeed for the initial term.");
    const { id } = addTermResult as { id: ID };
    assertExists(id, "An ID should be returned for the new term.");
    assertEquals(typeof id, "string", "The returned ID should be a string.");
    initialTermId = id;
    console.log(`addTerm test: Added initial term with ID: ${initialTermId}`);
  });

  await t.step("1. Cannot add duplicate terms", async () => {
    const addDuplicateTermResult = await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in addDuplicateTermResult,
      true,
      "Adding duplicate terms should return an error.",
    );
    assertEquals(
      (addDuplicateTermResult as { error: string }).error,
      "This term pair single crochet -> double crochet already exists.",
      "Error message should specifically indicate the duplicate term pair.",
    );
    console.log(`addTerm test: Attempted to add duplicate term, received error: ${JSON.stringify(addDuplicateTermResult)}`);
  });

  await t.step("2. Can still access the original term", async () => {
    const translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    assertEquals("error" in translateTermResult, false, "Original term should still be translatable.");
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(
      language2,
      "double crochet",
      "The translation for 'single crochet' should still be 'double crochet'.",
    );
    console.log(`addTerm test: Translated 'single crochet' to '${language2}', confirming original term is intact.`);
  });
  await client.close();
});

Deno.test("Action: deleteTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await t.step("1. Successfully delete existing term", async () => {
    const addResult = await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals("error" in addResult, false, "addTerm should succeed for deletion test setup.");
    const addedId = (addResult as {id: ID}).id;
    console.log(`deleteTerm test: Added term with ID ${addedId} for deletion.`);

    // Double check the translation went through
    let translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    assertEquals("error" in translateTermResult, false, "Term should be translatable before deletion.");
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(
      language2,
      "double crochet",
      "The translation should be `double crochet` before deletion.",
    );
    console.log(`deleteTerm test: Verified translation before deletion: 'single crochet' -> '${language2}'`);


    const deleteTermResult = await concept.deleteTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in deleteTermResult,
      false,
      "deleteTerm should succeed and not return an error.",
    );
    console.log(`deleteTerm test: Successfully deleted term 'single crochet' -> 'double crochet'.`);

    translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    assertEquals(
      "error" in translateTermResult,
      true,
      "The term shouldn't exist in the dictionary anymore after deletion.",
    );
    assertEquals(
        (translateTermResult as { error: string }).error,
        `Translation for "single crochet" not found.`,
        "Error message should indicate 'translation not found' after deletion."
    );
    console.log(`deleteTerm test: Verified term is no longer translatable after deletion.`);
  });

  await t.step("2. Cannot delete an already deleted term", async () => {
    const deleteTermResult = await concept.deleteTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in deleteTermResult,
      true,
      "deleteTerm cannot delete a nonexistent term.",
    );
    assertEquals(
        (deleteTermResult as { error: string }).error,
        `Term pair "single crochet" -> "double crochet" not found.`,
        "Error message should indicate 'term pair not found' when trying to delete again."
    );
    console.log(`deleteTerm test: Attempted to delete nonexistent term, received error: ${JSON.stringify(deleteTermResult)}`);
  });

  await t.step("3. Add back a deleted term", async () => {
    const addTermResult = await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in addTermResult,
      false,
      "addTerm can readd a deleted term.",
    );
    const reAddedId = (addTermResult as {id: ID}).id;
    assertExists(reAddedId, "A new ID should be generated for the re-added term.");
    assertNotEquals(reAddedId, undefined, "Re-added term should have an ID."); // More specific check
    console.log(`deleteTerm test: Re-added term 'single crochet' -> 'double crochet' with new ID: ${reAddedId}.`);

    const translateTermResult = await concept.translateTermFromL1(
        { language1: "single crochet" },
    );
    assertEquals("error" in translateTermResult, false, "Re-added term should be translatable.");
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(language2, "double crochet", "Translation should work for re-added term.");
    console.log(`deleteTerm test: Verified translation for re-added term.`);
  });

  await client.close();
});

Deno.test("Action: translateTerm - both ways", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  const addResult = await concept.addTerm({
    language1: "single crochet",
    language2: "double crochet",
  });
  assertEquals("error" in addResult, false, "Setup: addTerm should succeed.");
  const addedId = (addResult as {id: ID}).id;
  console.log(`translateTerm test: Added term with ID ${addedId} for translation tests.`);

  await t.step("1. Can translate from language1", async () => {
    const translateTermResult = await concept.translateTermFromL1({
      language1: "single crochet",
    });
    assertEquals(
      "error" in translateTermResult,
      false,
      "The term should be able to be translated from language1",
    );
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(language2, "double crochet");
    console.log(`translateTerm test: Translated 'single crochet' -> '${language2}'.`);
  });

  await t.step("2. Can translate from language2", async () => {
    const translateTermResult = await concept.translateTermFromL2({
      language2: "double crochet",
    });
    assertEquals(
      "error" in translateTermResult,
      false,
      "The term should be able to be translated from language2",
    );
    const { language1 } = translateTermResult as { language1: string };
    assertEquals(language1, "single crochet");
    console.log(`translateTerm test: Translated 'double crochet' -> '${language1}'.`);
  });

  await t.step(
    "3. Cannot translate from language1 using language2 (non-existent in L1)",
    async () => {
      const translateTermResult = await concept.translateTermFromL1({
        language1: "double crochet", // This is an L2 term, not an L1 term in the dictionary
      });
      assertEquals(
        "error" in translateTermResult,
        true,
        "Translating an L2 term via L1 method should return an error if it's not also an L1 term.",
      );
      assertEquals(
          (translateTermResult as { error: string }).error,
          `Translation for "double crochet" not found.`,
          "Error message should indicate term not found for L1 translation."
      );
      console.log(`translateTerm test: Attempted L1 translation with L2 term, received error: ${JSON.stringify(translateTermResult)}`);
    },
  );

  await t.step(
    "4. Cannot translate from language2 using language1 (non-existent in L2)",
    async () => {
      const translateTermResult = await concept.translateTermFromL2({
        language2: "single crochet", // This is an L1 term, not an L2 term in the dictionary
      });
      assertEquals(
        "error" in translateTermResult,
        true,
        "Translating an L1 term via L2 method should return an error if it's not also an L2 term.",
      );
      assertEquals(
          (translateTermResult as { error: string }).error,
          `Translation for "single crochet" not found.`,
          "Error message should indicate term not found for L2 translation."
      );
      console.log(`translateTerm test: Attempted L2 translation with L1 term, received error: ${JSON.stringify(translateTermResult)}`);
    },
  );
  await client.close();
});

Deno.test("Action: case insensitivity for addTerm, deleteTerm, and translateTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  const addResult = await concept.addTerm({
    language1: "single crochet",
    language2: "double crochet",
  });
  assertEquals("error" in addResult, false, "Setup: addTerm should succeed.");
  const addedId = (addResult as {id: ID}).id;
  console.log(`Case insensitivity test: Added term with ID ${addedId}.`);


  await t.step("1. Cannot add term with different case (duplicate check is case-insensitive)", async () => {
    const diffCaseAddResult = await concept.addTerm({
      language1: "Single Crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in diffCaseAddResult,
      true,
      "Cannot add a term with different casing if it's considered a duplicate.",
    );
    assertEquals(
        (diffCaseAddResult as { error: string }).error,
        "This term pair single crochet -> double crochet already exists.",
        "Error message should indicate duplicate term despite case difference."
    );
    console.log(`Case insensitivity test: Attempted to add duplicate (case-different) term, received error: ${JSON.stringify(diffCaseAddResult)}`);
  });

  await t.step(
    "2. Can translate from language 1 with different case",
    async () => {
      const diffCaseTranslateResult = await concept.translateTermFromL1({
        language1: "sIngle croChet",
      });
      assertEquals(
        "error" in diffCaseTranslateResult,
        false,
        "The term should be able to be translated from language1 regardless of input casing.",
      );
      const { language2 } = diffCaseTranslateResult as { language2: string };
      assertEquals(language2, "double crochet");
      console.log(`Case insensitivity test: Translated 'sIngle croChet' to '${language2}'.`);
    },
  );

  await t.step(
    "3. Can translate from language 2 with different case",
    async () => {
      const diffCaseTranslateResult = await concept.translateTermFromL2({
        language2: "Double Crochet",
      });
      assertEquals(
        "error" in diffCaseTranslateResult,
        false,
        "The term should be able to be translated from language2 regardless of input casing.",
      );
      const { language1 } = diffCaseTranslateResult as { language1: string };
      assertEquals(language1, "single crochet");
      console.log(`Case insensitivity test: Translated 'Double Crochet' to '${language1}'.`);
    },
  );

  await t.step("4. Can delete term with different case", async () => {
    const deleteTermResult = await concept.deleteTerm({
      language1: "SINGLE CROCHET",
      language2: "Double crochet",
    });
    assertEquals(
      "error" in deleteTermResult,
      false,
      "deleteTerm should succeed regardless of input casing.",
    );
    console.log(`Case insensitivity test: Successfully deleted term using different casing.`);

    // Verify it's actually deleted
    const translateResultAfterDelete = await concept.translateTermFromL1({ language1: "single crochet" });
    assertEquals("error" in translateResultAfterDelete, true, "Term should be gone after case-insensitive deletion.");
    console.log(`Case insensitivity test: Verified term is no longer translatable after case-insensitive deletion.`);
  });
  await client.close();
});
```
