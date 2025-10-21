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
  type: "language" | "abbreviation";
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
   * @param type - the type of translation the term will be
   * @param language1 - a word in one language
   * @param language2 - the same word in another language
   * @returns {{ id: Term } | { error: string }} - The ID of the newly added term on success, or an error message.
   *
   * @requires this language1 and language2 isn't already in the set of terms
   * @effects creates a new Term with this language1 and this language2
   */
  async addTerm(
    { type, language1, language2 }: {
      type: string;
      language1: string;
      language2: string;
    },
  ): Promise<{ id: Term } | { error: string }> {
    const normalizedType = type.toLowerCase();
    // validate allowed types
    if (normalizedType !== "language" && normalizedType !== "abbreviation") {
      return {
        error:
          `Invalid term type "${type}". Allowed: "language" | "abbreviation".`,
      };
    }
    language1 = language1.toLowerCase();
    language2 = language2.toLowerCase();
    const existingTerm = await this.terms.findOne({
      type: normalizedType,
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
      type: normalizedType as "language" | "abbreviation",
      language1,
      language2,
    };
    await this.terms.insertOne(newTerm);
    return { id: newTerm._id };
  }

  /**
   * @action deleteTerm
   * @param type - the type of translation the term is
   * @param language1 - a word in one language
   * @param language2 - the same word in another language
   * @returns {Empty | { error: string }} - An empty object on success, or an error message.
   *
   * @requires this language 1 and this language 2 exist in the set of terms
   * @effects deletes this language1 and this language2 from the set of terms
   */
  async deleteTerm(
    { type, language1, language2 }: {
      type: string;
      language1: string;
      language2: string;
    },
  ): Promise<Empty | { error: string }> {
    const normalizedType = type.toLowerCase();
    language1 = language1.toLowerCase();
    language2 = language2.toLowerCase();
    const existingTerm = await this.terms.findOne({
      type: normalizedType as "language" | "abbreviation",
      language1,
      language2,
    });
    if (!existingTerm) {
      return {
        error:
          `Term pair with type "${type}", "${language1}" -> "${language2}" not found.`,
      };
    }

    await this.terms.deleteOne({ _id: existingTerm._id });
    return {};
  }

  /**
   * @action translateTermFromL1
   * @param type - the type of translation to look up
   * @param language1 - a word in language1 to translate
   * @returns {{ language2: string } | { error: string }} - The translated word in language2 on success, or an error message.
   *
   * @requires this language1 exists in the set of Terms
   * @effects returns this language2 associated with this language1
   */
  async translateTermFromL1(
    { type, language1 }: { type: string; language1: string },
  ): Promise<{ language2: string } | { error: string }> {
    const normalizedType = type.toLowerCase();
    language1 = language1.toLowerCase();
    const term = await this.terms.findOne({
      type: normalizedType as "language" | "abbreviation",
      language1,
    });
    if (!term) {
      return {
        error:
          `Translation for type "${type}", "${language1}" not found.`,
      };
    }

    return { language2: term.language2 };
  }

  /**
   * @action translateTermFromL2
   * @param type - the type of translation to look up
   * @param language2 - a word in language2 to translate
   * @returns {{ language1: string } | { error: string }} - The translated word in language1 on success, or an error message.
   *
   * @requires this language2 exists in the set of Terms
   * @effects returns this language1 associated with this language2
   */
  async translateTermFromL2(
    { type, language2 }: { type: string; language2: string },
  ): Promise<{ language1: string } | { error: string }> {
    const normalizedType = type.toLowerCase();
    language2 = language2.toLowerCase();
    const term = await this.terms.findOne({
      type: normalizedType as "language" | "abbreviation",
      language2,
    });
    if (!term) {
      return {
        error:
          `Translation for type "${type}", "${language2}" not found.`,
      };
    }
    return { language1: term.language1 };
  }
}
