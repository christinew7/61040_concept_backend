---
timestamp: 'Mon Oct 13 2025 19:44:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_194436.1c67021c.md]]'
content_id: 400b1cb0f288ee30acf0d72f83e2c1bed7c3b793a22bfc410e6c36ed0c003e29
---

# file: src/concepts/Dictionary/DictionaryConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DictionaryConcept from "./DictionaryConcept.ts";
import { ClientRequest } from "node:http";

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


```
