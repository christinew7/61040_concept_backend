---
timestamp: 'Mon Oct 13 2025 19:38:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_193829.bafa8d83.md]]'
content_id: be1c151f5ae5cc992b690590a727f9811c30b77e7d6fb3f9a57a2087cc2fc8d5
---

# trace:

This trace demonstrates how the `Dictionary` concept's **principle** is fulfilled: "the dictionary maintains a mapping of terms between two languages, a user can request the translation of a term, and the dictionary will provide the appropriate term in the other language."

1. **Action**: A user adds a new term pair to the dictionary.
   ```typescript
   concept.addTerm({ language1: "hello", language2: "bonjour" })
   ```

2. **Expected Result**: The term is successfully added, and its unique ID is returned.
   ```json
   { "id": "term:hello_bonjour_123..." }
   ```

3. **Verification**: The dictionary's internal state now includes this mapping.

4. **Action**: The user requests a translation from `language1` to `language2`.
   ```typescript
   concept.translateTermFromL1({ language1: "hello" })
   ```

5. **Expected Result**: The dictionary successfully finds and returns the corresponding term in `language2`.
   ```json
   { "language2": "bonjour" }
   ```

6. **Verification**: The returned translation `bonjour` is correct, demonstrating that the dictionary can provide the appropriate term.

7. **Action**: The user requests a translation from `language2` to `language1`.
   ```typescript
   concept.translateTermFromL2({ language2: "bonjour" })
   ```

8. **Expected Result**: The dictionary successfully finds and returns the corresponding term in `language1`.
   ```json
   { "language1": "hello" }
   ```

9. **Verification**: The returned translation `hello` is correct, further demonstrating the bidirectional translation capability.

This sequence confirms that the `addTerm`, `translateTermFromL1`, and `translateTermFromL2` actions together fulfill the stated principle of the `Dictionary` concept.
