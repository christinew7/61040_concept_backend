[@implementing-concepts](../../background/implementing-concepts.md)

[@Dictionary-concept](../../../src/concepts/Dictionary/DictionaryConcept.ts)

[@Dictionary](Dictionary.md)
# prompt: can you help me fix the new dictionary concept and make sure it only takes in one argument? 

# response:

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
   * @action addTerm
   * @param {Object} args - The input arguments for adding a term.
   * @param {string} args.language1 - A word in one language.
   * @param {string} args.language2 - The same word in another language.
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this `language1` and `language2` as a pair isn't already in the set of Terms.
   * @effects adds this `language1` and this `language2` to the set of Terms.
   */
  async addTerm({ language1, language2 }: { language1: string; language2: string }): Promise<{ id: Term } | { error: string }> {
    // Check if the term pair already exists to prevent duplicates
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (existingTerm) {
      return { error: `This term pair "${language1}" -> "${language2}" already exists.` };
    }

    // Create a new term document with a fresh ID
    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    };

    // Insert the new term into the collection
    await this.terms.insertOne(newTerm);

    // Return the ID of the new term within an object
    return { id: newTerm._id };
  }

  /**
   * @action deleteTerm
   * @param {Object} args - The input arguments for deleting a term.
   * @param {string} args.language1 - A word in one language.
   * @param {string} args.language2 - The same word in another language.
   * @returns {Empty | { error: string }} - An empty object on success, or an error message.
   *
   * @requires this `language1` and this `language2` exist as a pair in the set of Terms.
   * @effects deletes this `language1` and this `language2` from the set of Terms.
   */
  async deleteTerm({ language1, language2 }: { language1: string; language2: string }): Promise<Empty | { error: string }> {
    // Find the term to be deleted
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.` };
    }

    // Delete the term from the collection using its unique ID
    await this.terms.deleteOne({ _id: existingTerm._id });
    return {}; // Return empty object on success
  }

   /**
   * @action translateTerm
   * @param {Object} args - The input arguments for translating a term.
   * @param {string} args.language1 - A word in one language to translate.
   * @returns {{ language2: string } | { error: string }} - The translated word in `language2` on success, or an error message.
   *
   * @requires this `language1` exists in the set of Terms.
   * @effects returns this `language2` associated with this `language1`.
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
   * @query _getAllTerms
   * @returns {TermDoc[]} - An array of all term documents in the dictionary.
   * @effects Returns all stored term pairs.
   */
  async _getAllTerms(): Promise<TermDoc[]> {
    return await this.terms.find({}).toArray();
  }

  /**
   * @query _getTermById
   * @param {Object} args - The input arguments.
   * @param {ID} args.id - The ID of the term to retrieve.
   * @returns {TermDoc | null} - The term document if found, otherwise null.
   * @effects Returns a specific term document by its ID.
   */
  async _getTermById({ id }: { id: ID }): Promise<TermDoc | null> {
    return await this.terms.findOne({ _id: id });
  }
}
```