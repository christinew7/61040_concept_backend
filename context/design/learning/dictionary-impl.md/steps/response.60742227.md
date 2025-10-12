---
timestamp: 'Sun Oct 12 2025 18:58:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_185839.d23af2c0.md]]'
content_id: 607422274486dd77d5d2d6783ebb65d746e3f991effd9a75f97ee393dcdb12b7
---

# response:

To refactor the `translateTerm` action so it can translate from either `language1` or `language2`, we need to modify its input to explicitly state which language the provided term belongs to. This allows the action to dynamically query the correct field and return the value from the opposing language field.

The updated `translateTerm` will take two parameters within its single input dictionary:

1. `term`: The word to be translated.
2. `fromLanguage`: A string literal `'language1'` or `'language2'` to specify the source language of the `term`.

Based on `fromLanguage`, we can then determine the `queryField` (where to search for the `term`) and the `returnField` (from where to retrieve the translation).

Here's the refactored code:

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
  async addTerm({ language1, language2 }: { language1: string; language2: string }): Promise<{ id: Term } | { error: string }> {
    const existingTerm = await this.terms.findOne({ language1: language1, language2: language2 });
    if (existingTerm) {
      return { error: `This term pair "${language1}" -> "${language2}" already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    };
    await this.terms.insertOne(newTerm);
    return { id: newTerm._id }; // Return as an object for consistency with action output spec
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
  async deleteTerm({ language1, language2 }: { language1: string; language2: string }): Promise<Empty | { error: string }> {
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.` };
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

  /**
   * @action translateTerm
   * @param term - the word to translate
   * @param fromLanguage - specifies which language the input `term` is in ('language1' or 'language2')
   * @returns {{ translatedTerm: string } | { error: string }} - The translated word on success, or an error message.
   *
   * @requires the `term` must exist in the specified `fromLanguage` in the set of Terms
   * @effects returns the corresponding term from the other language
   */
  async translateTerm(
    { term, fromLanguage }: { term: string; fromLanguage: 'language1' | 'language2' }
  ): Promise<{ translatedTerm: string } | { error: string }> {
    let queryField: 'language1' | 'language2';
    let returnField: 'language1' | 'language2';

    if (fromLanguage === 'language1') {
      queryField = 'language1';
      returnField = 'language2';
    } else if (fromLanguage === 'language2') {
      queryField = 'language2';
      returnField = 'language1';
    } else {
      // This case should ideally be caught by TypeScript during development,
      // but serves as a runtime guard for robustness against unexpected input.
      return { error: `Invalid 'fromLanguage' specified. Must be 'language1' or 'language2'.` };
    }

    const foundTermDoc = await this.terms.findOne({ [queryField]: term });

    if (!foundTermDoc) {
      return { error: `Translation for "${term}" from "${fromLanguage}" not found.` };
    }

    // Safely access the dynamically determined return field
    const translatedValue = foundTermDoc[returnField];

    // Although TypeScript enforces string for TermDoc fields, an extra check doesn't hurt.
    if (typeof translatedValue === 'string') {
      return { translatedTerm: translatedValue };
    } else {
      return { error: `Internal error: Translated term found but invalid type for '${returnField}'.` };
    }
  }

  // Example of a query method (not part of the original problem, but good for completeness)
  /**
   * @_listAllTerms
   * @returns {TermDoc[]} - An array of all stored term documents.
   *
   * @effects returns all term pairs in the dictionary
   */
  async _listAllTerms(): Promise<TermDoc[]> {
    return await this.terms.find({}).toArray();
  }
}
```
