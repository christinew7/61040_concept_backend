---
timestamp: 'Tue Oct 14 2025 11:38:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_113800.7e46eb47.md]]'
content_id: 481ae60b2cc9f142381012e3f671b2df66ef10b74185b95dd9791d1dd3be6164
---

# file: src/concepts/Dictionary/DictionaryConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";

import DictionaryConcept from "./DictionaryConcept.ts";
import { ClientRequest } from "node:http";
import { assert } from "node:console";

// LANGUAGE1 = US
// LANGUAGE2 = UK
Deno.test(
  "Principle: the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language",
  async (t) => {
    const [db, client] = await testDb();
    const concept = new DictionaryConcept(db);

    await t.step("1. Add one crochet translation term", async () => {
      const addTermResult = await concept.addTerm({
        language1: "double crochet",
        language2: "treble crochet",
      });
      assertNotEquals(
        "error" in addTermResult,
        true,
        "addTerm should succeed.",
      );
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
          "addTerm should succeed.",
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
      },
    );
    await client.close();
  },
);

Deno.test("Action: addTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await t.step("1. Cannot add duplicate terms", async () => {
    await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    const addDuplicateTermResult = await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in addDuplicateTermResult,
      true,
      "There is an error in adding duplicate terms",
    );
  });

  await t.step("2. Can still access the original term", async () => {
    const translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(
      language2,
      "double crochet",
      "The translation should be `double crochet`",
    );
  });
  await client.close();
});

Deno.test("Action: deleteTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await t.step("1. Successfully delete existing term", async () => {
    await concept.addTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    // Double check the translation went through
    let translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    const { language2 } = translateTermResult as { language2: string };
    assertEquals(
      language2,
      "double crochet",
      "The translation should be `double crochet`",
    );

    const deleteTermResult = await concept.deleteTerm({
      language1: "single crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in deleteTermResult,
      false,
      "deleteTerm should succeed and not return an error.",
    );

    translateTermResult = await concept.translateTermFromL1(
      { language1: "single crochet" },
    );
    assertEquals(
      "error" in translateTermResult,
      true,
      "The term shouldn't exist in the dictionary anymore",
    );
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
  });

  await client.close();
});

Deno.test("Action: translateTerm - both ways", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await concept.addTerm({
    language1: "single crochet",
    language2: "double crochet",
  });

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
  });

  await t.step(
    "3. Cannot translate from language1 using language2",
    async () => {
      const translateTermResult = await concept.translateTermFromL1({
        language1: "double crochet",
      });
      assertEquals(
        "error" in translateTermResult,
        true,
        "The term should not be able to be translated",
      );
    },
  );

  await t.step(
    "4. Cannot translate from language2 using language1",
    async () => {
      const translateTermResult = await concept.translateTermFromL2({
        language2: "single crochet",
      });
      assertEquals(
        "error" in translateTermResult,
        true,
        "The term should not be able to be translated",
      );
    },
  );
  await client.close();
});

Deno.test("Action: case insensitivity for addTerm, deleteTerm, and translateTerm", async (t) => {
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await concept.addTerm({
    language1: "single crochet",
    language2: "double crochet",
  });
  await t.step("1. Cannot add term with different case", async () => {
    const diffCaseAddResult = await concept.addTerm({
      language1: "Single Crochet",
      language2: "double crochet",
    });
    assertEquals(
      "error" in diffCaseAddResult,
      true,
      "Cannot add a term with uppercase instead of all lowercase",
    );
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
        "The term should be able to be translated from language1",
      );
      const { language2 } = diffCaseTranslateResult as { language2: string };
      assertEquals(language2, "double crochet");
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
        "The term should be able to be translated from language2",
      );
      const { language1 } = diffCaseTranslateResult as { language1: string };
      assertEquals(language1, "single crochet");
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
      "deleteTerm should succeed and not return an error.",
    );
  });
  await client.close();
});

/**
  const [db, client] = await testDb();
  const concept = new DictionaryConcept(db);

  await client.close();
 */

```
