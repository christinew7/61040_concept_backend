---
timestamp: 'Sun Oct 12 2025 18:38:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_183842.638a6230.md]]'
content_id: d358625af852eba2353bdcb1d8b7c06a1bdecba7588825d4428f104f4300bdbe
---

# response:

You've hit on a crucial design decision for API actions! Let's break down whether `addTerm` should return the ID, considering the provided rules and general best practices.

## Recommendation: Return the ID

It is generally a good practice to return the ID of a newly created resource in "add" or "create" actions. This provides immediate value and utility to the caller.

## Benefits of returning the ID (`{ id: Term }`)

1. **Immediate Confirmation and Reference:** The caller gets immediate confirmation that the term was successfully added and receives its unique identifier. This ID can then be used for subsequent operations (e.g., querying for the term, linking it to another concept, updating it).
2. **Reduced Subsequent Queries:** Without the ID, a caller wanting to refer to the newly created term would have to perform another query (e.g., `_getTermByLanguages(language1, language2)`) which adds latency and complexity.
3. **Client-Side State Management:** In a frontend application, the ID is essential for updating the UI state (e.g., adding the new term to a list without a full page refresh) or navigating to a detail page for that term.
4. **Consistency with CRUD Patterns:** Many database operations and RESTful API conventions for creation (`POST`) return the ID or the full resource representation of the newly created item.
5. **Adherence to "single argument out" rule:** By returning `{ id: newTerm._id }` on success, you consistently return a dictionary, just as you return `{ error: "message" }` on failure. This aligns perfectly with the rule "Every action... output a single argument: both of these are a dictionary/JSON object with primitive values". The ID (`Term`) is a `string` (primitive value).

## Why you might *not* return the ID (or return `Empty`)

1. **Strict Command-Query Separation (CQRS):** In some very strict CQRS architectures, "commands" (actions) are only allowed to perform side effects and return minimal or no data (`Empty`). Their primary goal is to change state, not provide data. Data retrieval is exclusively handled by "queries." However, returning an ID is often considered an acceptable compromise even in CQRS for the benefits listed above, as it's a direct identifier of the *effect* of the command.
2. **Caller Indifference:** If you are absolutely certain that the caller will *never* need the ID immediately after creation, then returning `Empty` might seem simpler. However, this is rarely the case in practical applications, and it's better to provide the data proactively.
3. **Instruction Interpretation:** Your current interpretation for returning `Empty` for "actions that don't want to return anything" is correct. The question is whether returning the ID means the action "wants to return something." Given the utility, it's generally beneficial for "create" actions to want to return the ID.

## Updated `addTerm` Implementation

Given the benefits and how it aligns with the specified rules, it's best to return the ID. You also need to adjust the input to be a single argument (a dictionary) as per the rules.

```typescript
/*
 * @concept Dictionary
 * @purpose provide a translation between two specific languages
 * @principle the dictionary maintains a mapping of terms between two languages,
 * a user can request the translation of a term and the dictionary will provide
 * the appriopriate term in the other language
 */

import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts"; // Removed Empty as it's not strictly used for success now
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
   * @param {Object} args - The input arguments for the action.
   * @param {string} args.language1 - a word in one language
   * @param {string} args.language2 - the same word in another language
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this language1 and language2 isn't already in the set of terms
   * @effects creates a new Term with this language1 and this language2
   */
  async addTerm({ language1, language2 }: { language1: string; language2: string }): Promise<{ id: Term } | { error: string }> {
    // Check if the term pair already exists
    const existingTerm = await this.terms.findOne({
      language1: language1,
      language2: language2,
    });

    if (existingTerm) {
      return { error: `This term pair "${language1}" -> "${language2}" already exists.` };
    }

    // Create a new term document
    const newTerm: TermDoc = {
      _id: freshID(), // Generate a fresh ID
      language1,
      language2,
    };

    // Insert the new term into the collection
    await this.terms.insertOne(newTerm);

    // Return the ID of the newly created term
    return { id: newTerm._id };
  }
}
```
