---
timestamp: 'Sun Oct 12 2025 18:48:05 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_184805.3b12956e.md]]'
content_id: d99aeba5b984730c1746770a8fad2b3f936b016c92f1065a4bbf6e9a3209faf0
---

# response:

Here's the completed `DictionaryConcept.ts` implementation, adhering to all the specified requirements and guidelines.

```typescript
// file: src/concepts/Dictionary/DictionaryConcept.ts

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

// Declare collection prefix, use concept name
const PREFIX = "Dictionary" + ".";

// Generic types of this concept
type Term = ID;

/**
 * a set of Terms with
 *  a language1 String
 *  a language2 String
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
   * @param input - An object containing `language1` and `language2`.
   * @param input.language1 - a word in one language
   * @param input.language2 - the same word in another language
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this language1 and language2 as a set isn't already in the set of Terms
   * @effects adds this language1 and this language2 to the set of Terms
   */
  async addTerm({ language1, language2 }: { language1: string; language2: string }): Promise<{ id: Term } | { error: string }> {
    // Check if the term pair already exists
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    };
    await this.terms.insertOne(newTerm);
    return { id: newTerm._id }; // Return as an object with 'id' key
  }

  /**
   * @action deleteTerm
   * @param input - An object containing `language1` and `language2`.
   * @param input.language1 - a word in one language
   * @param input.language2 - the same word in another language
   * @returns {Empty | { error: string }} - An empty object on success, or an error message.
   *
   * @requires this language1 and this language2 exist in the set of Terms
   * @effects deletes this language1 and this language2 from the set of Terms
   */
  async deleteTerm({ language1, language2 }: { language1: string; language2: string }): Promise<Empty | { error: string }> {
    // Check if the term pair exists
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.` };
    }

    // Delete the term
    await this.terms.deleteOne({ _id: existingTerm._id });
    return {}; // Return empty object on success
  }

  /**
   * @action translateTerm
   * @param input - An object containing `language1`.
   * @param input.language1 - a word in one language to translate
   * @returns {{ language2: string } | { error: string }} - The translated word in language2 on success, or an error message.
   *
   * @requires this language1 exists in the set of Terms
   * @effects returns this language2 associated with this language1
   */
  async translateTerm({ language1 }: { language1: string }): Promise<{ language2: string } | { error: string }> {
    // Find the term by language1
    const term = await this.terms.findOne({ language1 });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }

    return { language2: term.language2 }; // Return the translated term as an object
  }
}
```
