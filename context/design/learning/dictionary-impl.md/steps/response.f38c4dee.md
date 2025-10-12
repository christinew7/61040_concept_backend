---
timestamp: 'Sun Oct 12 2025 18:54:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_185428.2a41c845.md]]'
content_id: f38c4deed49579437e17e41ed1765181558c9aa65a305603ce17d1d669155300
---

# response:

No, the current `translateTerm` action is specifically designed to take `language1` as input and return `language2`. It queries the `language1` field in your MongoDB collection.

To translate from `language2` to `language1`, you would need to implement a new action (or a significantly refactor the existing one to be more generic, which is usually not preferred for clarity in concept actions).

The most straightforward way to handle this, while adhering to the concept implementation guidelines (especially the single argument dictionary for actions), is to create a new action, for example, `reverseTranslateTerm`.

Before providing the solution, it's worth noting that your `addTerm` and `deleteTerm` actions currently take two arguments, which violates the rule: "Every action must take a single argument, and output a single argument: both of these are a dictionary/JSON object with primitive values". They should be refactored to accept a single dictionary argument, similar to `translateTerm`.

Let's address both points in the updated `DictionaryConcept.ts`.
