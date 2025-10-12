---
timestamp: 'Sun Oct 12 2025 19:02:16 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_190216.4306de4b.md]]'
content_id: 2decd81997155707d82fc44b613a413b010c358621cfd32d8f01ce3a0074c601
---

# response:

You're looking for a specific new action that goes the other way, rather than a refactor! That makes perfect sense for a dictionary where you might want to translate both ways.

Here's the new action `translateTermFromLanguage2` added to your `DictionaryConcept` class:

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

type Term = ID;

/**
 * a set of Terms with
 *  a language 1 String
 *  a language 2 String
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
   * @action addTerm
   * @param language1 - a word in one language
   * @param language2 - the same word in another language
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this language1 and language2 isn't already in the set of terms
   * @effects creates a new Term with this language1 and this language2
   */
  async addTerm(
    { language1, language2 }: { language1: string; language2: string },
  ): Promise<{ id: Term } | { error: string }> {
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (existingTerm) {
      return { error: `This term pair ${language1} -> ${language2} already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    };
    await this.terms.insertOne(newTerm);
    // Return the ID of the new term as part of an object, as per spec
    return { id: newTerm._id };
  }

  /**
   * @action deleteTerm
   * @param language1 - a word in one language
   * @param language2 - the same word in another language
   * @returns {Empty | { error: string }} - An empty object on success, or an error message.
   *
   * @requires this language 1 and this language 2 exist in the set of terms
   * @effects deletes this language1 and this language2 from the set of terms
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
   * @action translateTerm
   * @param language1 - a word in one language to translate
   * @returns {{ language2: string } | { error: string }} - The translated word in language2 on success, or an error message.
   *
   * @requires this language1 exists in the set of Terms
   * @effects returns this language2 associated with this language1
   */
  async translateTerm(
    { language1 }: { language1: string },
  ): Promise<{ language2: string } | { error: string }> {
    // Find the term by language1
    const term = await this.terms.findOne({ language1 });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }

    return { language2: term.language2 };
  }

  /**
   * @action translateTermFromLanguage2
   * @param language2 - a word in the second language to translate
   * @returns {{ language1: string } | { error: string }} - The translated word in language1 on success, or an error message.
   *
   * @requires this language2 exists in the set of Terms
   * @effects returns this language1 associated with this language2
   */
  async translateTermFromLanguage2(
    { language2 }: { language2: string },
  ): Promise<{ language1: string } | { error: string }> {
    // Find the term by language2
    const term = await this.terms.findOne({ language2 });
    if (!term) {
      return { error: `Translation for "${language2}" not found.` };
    }

    return { language1: term.language1 };
  }
}
```

**Key changes:**

1. **`translateTermFromLanguage2` action:** A new method has been added.
2. **Parameters:** It takes a single argument object `{ language2: string }`.
3. **Logic:** It queries the `terms` collection using `findOne({ language2: inputLanguage2 })`.
4. **Return Value:** On success, it returns `{ language1: foundTerm.language1 }`. On failure (term not found), it returns `{ error: "Translation for X not found." }`.
5. **Documentation:** JSDoc comments specify its purpose, parameters, return value, requirements, and effects.

*(Self-correction: I also noticed that `addTerm` was returning just the ID directly, not an object `{ id: Term }` as specified by "output a single argument: both of these are a dictionary/JSON object". I've corrected that in the updated code block for consistency.)*
