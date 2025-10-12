---
timestamp: 'Sun Oct 12 2025 19:50:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_195054.64ec3351.md]]'
content_id: 683f70ed86a12574e10e28c5c2acfa487b01fa6f912257571202aa91a7c21167
---

# response:

The `FileTrackerConcept` is passing in `User` and `File` by their ID (branded string) instead of their full object for several key reasons, primarily driven by the architectural principles and constraints outlined in the concept implementation guidelines:

1. **Rule 1: No Import Statements Referencing Other Concepts:**
   This is the most crucial reason. The specification explicitly states: "No import statements can reference another concept in any way, including type declarations."
   * If `FileTrackerConcept` were to accept `User` or `File` *objects*, those objects would necessarily be defined by a `UserConcept` and a `FileConcept` (or similar concepts).
   * To know the structure of these objects (e.g., `User` might have properties like `name`, `email`, etc.), `FileTrackerConcept` would need to import types or interfaces from `UserConcept` and `FileConcept`.
   * This direct import would violate Rule 1, breaking the intended isolation between concepts.
   * By using `ID` (which is just a branded `string`), `FileTrackerConcept` doesn't need to know *anything* about the internal structure of `User` or `File` beyond their unique identifier. It treats them as opaque references.

2. **Loose Coupling and Modularity:**
   Concepts are designed to be independent and self-contained units. Using IDs promotes loose coupling between them.
   * `FileTrackerConcept` only cares about *which* user and *which* file it's tracking, not their specific attributes (like a user's name or a file's content). These attributes are the responsibility of their respective `UserConcept` and `FileConcept`.
   * This modularity means `FileTrackerConcept` can operate without changes even if the internal structure of `User` or `File` objects changes, as long as their IDs remain consistent.

3. **Database Best Practices (Foreign Keys):**
   In relational database terms, this is analogous to using foreign keys. Instead of embedding entire related records, you store a reference (the ID) to the record in another collection.
   * This prevents data redundancy: if a user's email changes, you only need to update the `User` document, not every `TrackedFileDoc` that references them.
   * It improves performance: queries and indexes are often more efficient when dealing with smaller, consistent ID fields rather than potentially large, complex embedded documents.

4. **`ID` Utility Type Reinforcement:**
   The provided `ID` utility type and examples (`type Item = ID;`, `const userA = "user:Alice" as ID;`) explicitly guide implementers towards using these branded strings for generic identifiers, reinforcing the idea that interactions between concepts should primarily happen through these stable, unique references.

In essence, using IDs allows concepts to build relationships and interact at an abstract level (referencing entities by their unique keys) without needing to know or depend on the internal implementation details of other concepts, adhering strictly to the principle of independent concept implementation.
