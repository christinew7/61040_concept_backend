[@implementing-concepts](../background/implementing-concepts.md)

[@Dictionary-concept](../../src/concepts/Dictionary/DictionaryConcept.ts)

# question: is there a better way to name the action translateTermFromLanguage2, what are good names for these instead? 
# response:

The current names `translateTerm` and `translateTermFromLanguage2` can be improved for clarity and symmetry. `translateTerm` is slightly ambiguous about the source and target languages, while `translateTermFromLanguage2` is explicit but a bit verbose.

Considering the `Dictionary` concept's purpose is to provide translation *between* two languages, and given the generic `language1` and `language2` identifiers, it's best to have names that clearly indicate the direction of translation.

Here are a few options, with the recommendation being to use the "Input-focused" approach for conciseness and clarity:

### 1. **Input-focused (Recommended)**

This approach names the action based on which language you are providing as input to be translated.

*   **Original:** `translateTerm({ language1: string })`
    *   **New Name:** `getTranslationOfL1` or `translateFromLanguage1`
    *   **Reasoning:** You are providing a term in `language1` and asking for its translation. `getTranslationOfL1` clearly states the input, and the return type (`{ language2: string }`) implicitly reveals the output. `translateFromLanguage1` is also very explicit.

*   **Original:** `translateTermFromLanguage2({ language2: string })`
    *   **New Name:** `getTranslationOfL2` or `translateFromLanguage2`
    *   **Reasoning:** Symmetrically, you are providing a term in `language2` and asking for its translation.

**Recommended Choice:** `getTranslationOfL1` and `getTranslationOfL2` due to their conciseness and clear identification of the input language.

### 2. **Explicit Direction (Verbose but Unambiguous)**

This approach explicitly states both the source and target languages in the method name.

*   **Original:** `translateTerm({ language1: string })`
    *   **New Name:** `translateL1ToL2` or `translateFromL1ToL2`
    *   **Reasoning:** Explicitly defines the translation flow from `language1` to `language2`.

*   **Original:** `translateTermFromLanguage2({ language2: string })`
    *   **New Name:** `translateL2ToL1` or `translateFromL2ToL1`
    *   **Reasoning:** Explicitly defines the translation flow from `language2` to `language1`.

### 3. **Primary Direction and Inverse (Relies on Convention)**

If `language1 -> language2` is considered the primary or "forward" translation direction (which `addTerm` might suggest by its parameter order), you could use this.

*   **Original:** `translateTerm({ language1: string })`
    *   **New Name:** `translate`
    *   **Reasoning:** Implies `language1` is the source and `language2` is the target by default.

*   **Original:** `translateTermFromLanguage2({ language2: string })`
    *   **New Name:** `translateReverse` or `translateInverse`
    *   **Reasoning:** Clearly indicates translation in the opposite direction of the primary `translate` method.

**Recommendation Summary:**

I recommend the **Input-focused** approach for its balance of clarity and conciseness.

Let's update the code with `getTranslationOfL1` and `getTranslationOfL2`:

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
    return { id: newTerm._id};
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
    const existingTerm = await this.terms.findOne({ language1, language2});
    if (!existingTerm) {
      return { error: `Term pair "${language1}" -> "${language2}" not found.`};
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

   /**
   * @action getTranslationOfL1
   * @param language1 - a word in the first language to translate FROM.
   * @returns {{ language2: string } | { error: string }} - The translated word in the second language on success, or an error message.
   *
   * @requires a mapping for this language1 term exists in the dictionary.
   * @effects retrieves and returns the corresponding language2 term.
   */
    async getTranslationOfL1({ language1 }: { language1: string }): Promise<{ language2: string } | { error: string }> {
    // Find the term by language1
    const term = await this.terms.findOne({ language1 });
    if (!term) {
      return { error: `Translation for "${language1}" not found.` };
    }

    return { language2: term.language2 };
  }

  /**
   * @action getTranslationOfL2
   * @param language2 - a word in the second language to translate FROM.
   * @returns {{ language1: string } | { error: string }} - The translated word in the first language on success, or an error message.
   *
   * @requires a mapping for this language2 term exists in the dictionary.
   * @effects retrieves and returns the corresponding language1 term.
   */
  async getTranslationOfL2(
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