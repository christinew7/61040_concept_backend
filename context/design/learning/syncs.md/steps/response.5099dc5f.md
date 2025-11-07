---
timestamp: 'Thu Nov 06 2025 12:06:54 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_120654.8686d415.md]]'
content_id: 5099dc5f08e5170fccff5682adfe35e00768e3808a08e71cc02e0e30459b121e
---

# response:

Okay, here are the synchronizations for your `Library` concept, following the patterns established in `auth.sync.ts` for handling requests, authentication, and responses.

**Important Considerations:**

1. **`Library` Concept Availability:** This assumes your `Library` concept is properly implemented in `src/concepts/Library/LibraryConcept.ts` and that `deno run build` has been run to make it importable via `@concepts`.
2. **`getAllFiles` as Action:** You listed `getAllFiles` under actions that returns `Set<File>`. I'm treating it as an action that returns a `{ files: File[] }` object, as actions called in `then` clauses typically return a dictionary. If `getAllFiles` were intended to be a query for the `where` clause, its return type for TypeScript would typically be `Promise<{file: File}[]>` (an array of single-item dictionaries). For consistency with the `actions` section, I've kept it as a `then` clause action returning a dictionary.
3. **Error Handling for `where` clause:** Similar to `GetUsernameRequest` in `auth.sync.ts`, I've included a pattern for checking for an invalid session within the `where` clause and returning an `error` frame to prevent subsequent `then` actions from firing and to allow `Requesting.respond` to send the error.

Let's create `src/syncs/library.sync.ts`:

***
