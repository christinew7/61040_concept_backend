---
timestamp: 'Sun Oct 12 2025 18:38:25 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_183825.66e4371a.md]]'
content_id: 10ad11c20a3cea349035291a5bea8dbfac9407cf92bf75b85147606d848cac37
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
   * @returns what does this return
   *
   * @requires this language1 and language2 isn't already in the set of terms
   * @effects creates a new Term with this language1 and this language2
   */
  async addTerm(language1: string, language2: string) {
    const existingTerm = await this.terms.findOne({language1: language1, language2: language2});
    if (existingTerm) {
      return { error: `This term pair ${language1} -> ${language2} already exists.` };
    }

    const newTerm: TermDoc = {
      _id: freshID(),
      language1,
      language2,
    }
    await this.terms.insertOne(newTerm);
  }


}

```
