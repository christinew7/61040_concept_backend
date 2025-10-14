---
timestamp: 'Mon Oct 13 2025 19:44:55 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_194455.c166256d.md]]'
content_id: 1ecaf612fc0b220701abc95a75368617015df8ab4f2d11a1027568f82a0059e6
---

# response:

Here are some interesting scenarios for the `DictionaryConcept` to add as test cases, covering various requirements, effects, and edge cases beyond the operational principle:

### 1. Attempt to add a duplicate term pair

* **Scenario**: Verify that `addTerm` prevents the creation of identical language1-language2 pairs.
* **Actions**:
  1. `addTerm({ language1: "hello", language2: "bonjour" })` (Success)
  2. `addTerm({ language1: "hello", language2: "bonjour" })` (Expected to return an error)
* **Expected Outcome**: The second `addTerm` call should return an error indicating the term pair already exists, and the total number of terms should still be one.

### 2. Successfully delete an existing term and verify its removal

* **Scenario**: Demonstrate that `deleteTerm` correctly removes a term and that subsequent translation attempts for that term fail.
* **Actions**:
  1. `addTerm({ language1: "goodbye", language2: "au revoir" })` (Success)
  2. `translateTermFromL1({ language1: "goodbye" })` (Expected to return "au revoir")
  3. `deleteTerm({ language1: "goodbye", language2: "au revoir" })` (Success)
  4. `translateTermFromL1({ language1: "goodbye" })` (Expected to return an error)
* **Expected Outcome**: The term is successfully deleted, and no longer found by translation queries.

### 3. Attempt to delete a non-existent term

* **Scenario**: Verify that `deleteTerm` gracefully handles attempts to remove terms that are not in the dictionary.
* **Actions**:
  1. `deleteTerm({ language1: "nonexistent", language2: "word" })` (Expected to return an error)
* **Expected Outcome**: An error indicating the term was not found should be returned.

### 4. Attempt to translate a non-existent term (from L1 and L2)

* **Scenario**: Ensure that translation actions correctly identify when a term cannot be found in the dictionary.
* **Actions**:
  1. `translateTermFromL1({ language1: "unknown word" })` (Expected to return an error)
  2. `translateTermFromL2({ language2: "mot inconnu" })` (Expected to return an error)
* **Expected Outcome**: Both translation attempts should return errors indicating the term was not found.

### 5. Adding and translating multiple distinct terms, including terms sharing one language but different translations

* **Scenario**: Test the ability to store and retrieve multiple distinct terms, including cases where a word in one language might have different translations based on context (though the current concept design treats each `(language1, language2)` pair as unique).
* **Actions**:
  1. `addTerm({ language1: "bank", language2: "financial institution" })` (Success)
  2. `addTerm({ language1: "bank", language2: "river edge" })` (Success - these are distinct pairs)
  3. `addTerm({ language1: "cat", language2: "gato" })` (Success)
  4. `translateTermFromL1({ language1: "cat" })` (Expected to return "gato")
  5. `translateTermFromL2({ language2: "gato" })` (Expected to return "cat")
  6. `translateTermFromL1({ language1: "bank" })` (Expected to return *one* of "financial institution" or "river edge" - current `findOne` behavior is arbitrary if multiple entries for `language1` exist)
* **Expected Outcome**: Specific, unambiguous translations should succeed. For ambiguous terms (like "bank" in this scenario), the test should confirm *a* translation is returned, acknowledging the `findOne` behavior of picking one arbitrarily.

These scenarios will help ensure the robustness of the `DictionaryConcept` by testing both successful and unsuccessful paths for all defined actions.
