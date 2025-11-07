---
timestamp: 'Thu Nov 06 2025 12:42:27 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_124227.a648b3ad.md]]'
content_id: 3881f87c50f75e9b1df33b9eaf14e2bc85627055f465e474e39a2a8df4cf6daf
---

# file: src/concepts/Dictionary/DictionaryConcept.ts

```typescript
/*
 * @concept Dictionary
 * @purpose provide a translation between two specific languages
 * @principle the dictionary maintains a mapping of terms between two languages,
 * a user can request the translation of a term and the dictionary will provide
 * the appriopriate term in the other language
 */

import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

const PREFIX = "Dictionary" + ".";

// Generic types of this concept
type Term = ID; // Term IDs will be generated, not the words themselves

/**
 * @state
 * a set of Terms with
 *  a language1 String (the term in the first language)
 *  a language2 String (the corresponding term in the second language)
 */
interface TermDoc {
  _id: Term;
  language1: string;
  language2: string;
}

/**
 * @concept Dictionary
 * @purpose provide a translation between two specific languages
 */
export default class DictionaryConcept {
  private terms: Collection<TermDoc>;

  constructor(private readonly db: Db) {
    this.terms = this.db.collection<TermDoc>(PREFIX + "terms");
  }

  /**
   * @action addTerm (language1: String, language2: String): (id: Term)
   * @requires this `language1` and `language2` as a pair isn't already in the set of Terms.
   * @effects adds this `language1` and `language2` to the set of Terms.
   */
  async addTerm(
    { language1, language2 }: { language1: string; language2: string },
  ): Promise<{ id: Term } | { error: string }> {
    // Check if the term pair already exists to prevent duplicates
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (existingTerm) {
      return { error: `This term pair "${language1}" -> "${language2}" already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    };

    await this.terms.insertOne(newTerm);
    return { id: newTerm._id };
  }

  /**
   * @action deleteTerm (language1: String, language2: String)
   * @requires this `language1` and `language2` exist as a pair in the set of Terms.
   * @effects deletes this `language1` and `language2` from the set of Terms.
   */
  async deleteTerm(
    { language1, language2 }: { language1: string; language2: string },
  ): Promise<Empty | { error: string }> {
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.` };
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

  /**
   * @action translateTerm (language1: String): (language2: String)
   * @requires this `language1` exists in the set of Terms.
   * @effects returns this `language2` associated with this `language1`.
   */
  async translateTerm(
    { language1 }: { language1: string },
  ): Promise<{ language2: string } | { error: string }> {
    const term = await this.terms.findOne({ language1 });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }
    return { language2: term.language2 };
  }

  /**
   * @query _getAllTerms (): (terms: TermDoc[])
   * @requires true
   * @effects Returns all stored term pairs.
   */
  async _getAllTerms(): Promise<{ terms: TermDoc[] }> {
    const allTerms = await this.terms.find({}).toArray();
    return { terms: allTerms };
  }
}
```

### 2. New Synchronization for Translation

Here is the implementation for the synchronization you described. It will listen for a request containing a `page` of text, process that text to find and translate all known words, and then respond with the fully translated page.

This logic is best handled in the `where` clause, which is designed for complex state lookups and data manipulation before the `then` clause fires.
