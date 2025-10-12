---
timestamp: 'Sun Oct 12 2025 18:54:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_185428.2a41c845.md]]'
content_id: 5c0ab6bbab3044458e2b3b94ef0ea3e5bb007c01483f5115cc53ba56a8670140
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
   * @param params - An object containing language1 and language2.
   * @param params.language1 - a word in one language
   * @param params.language2 - the same word in another language
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this language1 and language2 isn't already in the set of terms
   * @effects creates a new Term with this language1 and this language2
   */
  async addTerm({ language1, language2 }: { language1: string, language2: string }): Promise<{ id: Term } | { error: string }> {
    // Check for existing term pair (case-insensitive search could be added if needed)
    const existingTerm = await this.terms.findOne({language1: language1, language2: language2});
    if (existingTerm) {
      return { error: `This term pair "${language1}" -> "${language2}" already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    }
    await this.terms.insertOne(newTerm);
    return { id: newTerm._id }; // Return as an object conforming to the single argument output rule
  }

  /**
   * @action deleteTerm
   * @param params - An object containing language1 and language2.
   * @param params.language1 - a word in one language
   * @param params.language2 - the same word in another language
   * @returns {Empty | { error: string }} - An empty object on success, or an error message.
   *
   * @requires this language 1 and this language 2 exist in the set of terms
   * @effects deletes this language1 and this language2 from the set of terms
   */
  async deleteTerm( { language1, language2 }: { language1: string, language2: string } ): Promise<Empty | { error: string }> {
    const existingTerm = await this.terms.findOne({ language1, language2});
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.`};
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

   /**
   * @action translateTerm
   * @param params - An object containing the term in language1.
   * @param params.language1 - a word in one language to translate
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

    return { language2: term.language2 };
  }

  /**
   * @action reverseTranslateTerm
   * @param params - An object containing the term in language2.
   * @param params.language2 - a word in the second language to translate
   * @returns {{ language1: string } | { error: string }} - The translated word in language1 on success, or an error message.
   *
   * @requires this language2 exists in the set of Terms
   * @effects returns this language1 associated with this language2
   */
  async reverseTranslateTerm({ language2 }: { language2: string }): Promise<{ language1: string } | { error: string }> {
    // Find the term by language2
    const term = await this.terms.findOne({ language2 });
    if (!term) {
      return { error: `Translation for "${language2}" not found.` };
    }

    return { language1: term.language1 };
  }

  /**
   * @query _getTermById
   * @param id - The ID of the term to retrieve.
   * @returns {TermDoc | null} - The term document or null if not found.
   */
  async _getTermById(id: Term): Promise<TermDoc | null> {
    return this.terms.findOne({ _id: id });
  }

  /**
   * @query _getAllTerms
   * @returns {TermDoc[]} - An array of all term documents.
   */
  async _getAllTerms(): Promise<TermDoc[]> {
    return this.terms.find({}).toArray();
  }

  /**
   * @query _getTermsByLanguage1
   * @param language1 - The word in language1 to search for.
   * @returns {TermDoc[]} - An array of term documents matching language1.
   */
  async _getTermsByLanguage1({ language1 }: { language1: string }): Promise<TermDoc[]> {
    return this.terms.find({ language1 }).toArray();
  }

  /**
   * @query _getTermsByLanguage2
   * @param language2 - The word in language2 to search for.
   * @returns {TermDoc[]} - An array of term documents matching language2.
   */
  async _getTermsByLanguage2({ language2 }: { language2: string }): Promise<TermDoc[]> {
    return this.terms.find({ language2 }).toArray();
  }
}
```
