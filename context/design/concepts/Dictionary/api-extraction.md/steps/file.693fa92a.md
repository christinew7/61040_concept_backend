---
timestamp: 'Sat Oct 18 2025 11:11:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_111126.afaac227.md]]'
content_id: 693fa92a9e9643a27e5727e568f756fea5aec5c9456f8841e8c7982fbe613cf6
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
    language1 = language1.toLowerCase();
    language2 = language2.toLowerCase();
    const existingTerm = await this.terms.findOne({
      language1: language1,
      language2: language2,
    });
    if (existingTerm) {
      return {
        error: `This term pair ${language1} -> ${language2} already exists.`,
      };
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
    language1 = language1.toLowerCase();
    language2 = language2.toLowerCase();
    const existingTerm = await this.terms.findOne({ language1, language2 });
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.` };
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

  /**
   * @action translateTermFromL1
   * @param language1 - a word in language1 to translate
   * @returns {{ language2: string } | { error: string }} - The translated word in language2 on success, or an error message.
   *
   * @requires this language1 exists in the set of Terms
   * @effects returns this language2 associated with this language1
   */
  async translateTermFromL1(
    { language1 }: { language1: string },
  ): Promise<{ language2: string } | { error: string }> {
    language1 = language1.toLowerCase();
    const term = await this.terms.findOne({ language1 });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }

    return { language2: term.language2 };
  }

  /**
   * @action translateTermFromL2
   * @param language2 - a word in language2 to translate
   * @returns {{ language1: string } | { error: string }} - The translated word in language1 on success, or an error message.
   *
   * @requires this language2 exists in the set of Terms
   * @effects returns this language1 associated with this language2
   */
  async translateTermFromL2(
    { language2 }: { language2: string },
  ): Promise<{ language1: string } | { error: string }> {
    language2 = language2.toLowerCase();
    const term = await this.terms.findOne({ language2 });
    if (!term) {
      return { error: `Translation for "${language2}" not found.` };
    }
    return { language1: term.language1 };
  }
}

```
