---
timestamp: 'Thu Nov 06 2025 18:59:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185929.4a980c7b.md]]'
content_id: 014443441b8a5cb6067bb6e3117631e78dc7cc632de1580eebbc83a3f1e41ab5
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
type Term = ID;

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
   * @action addTerm (language1: String, language2: String): (id: Term)
   *
   * **requires** this `language1` and `language2` as a pair isn't already in the set of Terms.
   * **effects** adds this `language1` and this `language2` to the set of Terms.
   */
  async addTerm(
    { language1, language2 }: { language1: string; language2: string },
  ): Promise<{ id: Term } | { error: string }> {
    const l1 = language1.toLowerCase();
    const l2 = language2.toLowerCase();

    // Check if the term pair already exists to prevent duplicates
    const existingTerm = await this.terms.findOne({
      language1: l1,
      language2: l2,
    });
    if (existingTerm) {
      return {
        error: `This term pair "${language1}" -> "${language2}" already exists.`,
      };
    }

    // Create a new term document with a fresh ID
    const newTerm: TermDoc = {
      _id: freshID(),
      language1: l1,
      language2: l2,
    };

    // Insert the new term into the collection
    await this.terms.insertOne(newTerm);

    // Return the ID of the new term within an object
    return { id: newTerm._id };
  }

  /**
   * @action deleteTerm (language1: String, language2: String)
   *
   * **requires** this `language1` and this `language2` exist as a pair in the set of Terms.
   * **effects** deletes this `language1` and this `language2` from the set of Terms.
   */
  async deleteTerm(
    { language1, language2 }: { language1: string; language2: string },
  ): Promise<Empty | { error: string }> {
    // Find the term to be deleted
    const existingTerm = await this.terms.findOne({
      language1: language1.toLowerCase(),
      language2: language2.toLowerCase(),
    });
    if (!existingTerm) {
      return {
        error: `Term pair "${language1}" -> "${language2}" not found.`,
      };
    }

    // Delete the term from the collection using its unique ID
    await this.terms.deleteOne({ _id: existingTerm._id });
    return {}; // Return empty object on success
  }

  /**
   * @action translateTermFromL1 (language1: String): (language2: String)
   *
   * **requires** this `language1` exists in the set of Terms.
   * **effects** returns this `language2` associated with this `language1`.
   */
  async translateTermFromL1(
    { language1 }: { language1: string },
  ): Promise<{ language2: string } | { error: string }> {
    // Find the term by language1
    const term = await this.terms.findOne({
      language1: language1.toLowerCase(),
    });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }

    return { language2: term.language2 };
  }

  /**
   * @action translateTermFromL2 (language2: String): (language1: String)
   *
   * **requires** this `language2` exists in the set of Terms.
   * **effects** returns this `language1` associated with this `language2`.
   */
  async translateTermFromL2(
    { language2 }: { language2: string },
  ): Promise<{ language1: string } | { error: string }> {
    // Find the term by language2
    const term = await this.terms.findOne({
      language2: language2.toLowerCase(),
    });
    if (!term) {
      return { error: `Translation for "${language2}" not found.` };
    }

    return { language1: term.language1 };
  }

  /**
   * @query _getAllTerms
   * @returns {TermDoc[]} - An array of all term documents in the dictionary.
   * @effects Returns all stored term pairs.
   */
  async _getAllTerms(): Promise<TermDoc[]> {
    return await this.terms.find({}).toArray();
  }
}
```

### 2. Fixing the `_getUsername` and `_getUserByUsername` Syncs

The error `Missing binding: Symbol(username)` is a classic sign that a variable needed in the `then` clause was not successfully bound in the `when` or `where` clauses. Let's analyze and fix the syncs.

#### Problem with `GetUsernameRequest`

1. **`when` clause:** The pattern `{ path: "...", session, username }` is incorrect. The point of this request is to *find out* the username, so it won't be part of the incoming request body. The request should only need a `session`.
2. **`where` clause:** The logic was overly complex and mixed `frames.query` with direct async calls. The idiomatic way is to chain `frames.query` calls, which automatically handles binding variables to the frames for the `then` clause. Also, the `Sessioning._getUser` query returns a parameter named `user`, not `userId`. You need to map this correctly.

#### Problem with `GetUserRequest`

1. **`when` clause:** The request is to get a user *by username*, so the `username` to search for must be part of the request body. The original `when` clause was missing it.
2. **`where` clause:** The logic was confused. It was trying to get a `username` from the session frame (which doesn't exist) instead of using the `username` from the initial request. It should first authorize the session and then use the `username` from the request to query the `PasswordAuthentication` concept.

Here is the corrected `auth.sync.ts` file with detailed explanations in the comments.
