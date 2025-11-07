---
timestamp: 'Thu Nov 06 2025 21:42:21 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_214221.bc9b9fc4.md]]'
content_id: 2398c886b195186b2e7b687e5c2c1fd827413081a15d80203b587821c6433d1b
---

# response:

Of course! I can help you fix your synchronization. The timeout error you're seeing is a classic sign that the `then` clause of your sync is never being reached. This happens when the conditions in your `when` or `where` clauses don't produce any valid results (or "frames").

Looking at your code and the log, there are two main issues.

### 1. Path Mismatch in `when` Clause

This is the most immediate problem and the reason none of your `console.log` statements are appearing. Your synchronization will never be triggered.

* **Log shows request path:** `/FileTracker/_getCurrentItem`
* **Your `when` clause is looking for:** `/Library/_getCurrentItem`

The engine can't match the incoming request to your synchronization because the paths are different.

### 2. Incorrect Pattern in `where` Clause

The second issue is more fundamental to how synchronizations work. You are trying to call a concept's query method (`FileTracker._getCurrentItem`) directly and manually build a new `Frames` object.

The correct and intended pattern is to **chain `frames.query()` calls**. Each call enriches the current set of frames with new variable bindings that can be used by subsequent queries or by the final `then` clause. The engine handles all the underlying logic of calling the concept and binding the results for you.

***

### Corrected Synchronization

Here is the corrected and simplified version of your `GetCurrentItemRequest` synchronization. I've added comments to explain each part of the standard pattern.

```typescript
// file: src/syncs/filetracker.sync.ts

import { actions, Sync } from "@engine";
import { Requesting, Sessioning, FileTracker } from "@concepts";

export const GetCurrentItemRequest: Sync = (
  // Declare all variables you will use in the sync.
  // `user` and `index` will be bound in the `where` clause.
  { request, session, file, user, index },
) => ({
  // The 'when' clause triggers the synchronization.
  when: actions([
    Requesting.request,
    {
      // FIX 1: Corrected the path to match the incoming request.
      path: "/FileTracker/_getCurrentItem",
      // We only need the session and file from the client for this request.
      session,
      file,
    },
    // Bind the `request` variable from the action's output.
    { request },
  ]),

  // The 'where' clause validates and fetches the necessary data.
  where: async (frames) => {
    // FIX 2: Use the standard frames.query() chaining pattern.
    
    // Step 1: Authenticate the session to get a valid user ID.
    // This query uses the `session` variable and binds the result to the `user` variable.
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Step 2: Get the current item index using the now-authenticated user and the file ID.
    // This query maps our `user` variable to the query's `owner` parameter.
    // It uses the `file` variable directly and binds the result to the `index` variable.
    frames = await frames.query(FileTracker._getCurrentItem, { owner: user, file }, { index });

    // If either query fails to find a result, `frames` will become empty,
    // and the `then` clause will correctly not execute.
    return frames;
  },

  // The 'then' clause responds to the original request.
  then: actions([
    Requesting.respond,
    // Use the variables that were successfully bound in the 'when' and 'where' clauses.
    { request, index },
  ]),
});
```

### Summary of Changes:

1. **Corrected Path:** The `path` in the `when` clause now correctly matches the request path `/FileTracker/_getCurrentItem`.
2. **Simplified `when` Clause:** For better security, I've removed the `user` parameter from the `when` clause. The user ID should always be determined by a trusted concept like `Sessioning`, not from the client's request body.
3. **Idiomatic `where` Clause:** The `where` clause now uses a clean, chained sequence of `frames.query()` calls. This is the standard, declarative way to express dependencies: first get the user, then use the user to get the item.
4. **Automatic Parameter Mapping:** Notice the pattern `{ owner: user, file }`. This tells the engine: "For the `_getCurrentItem` query, use the value of my `user` variable for the `owner` parameter, and the value of my `file` variable for the `file` parameter."

By making these changes, your synchronization will now correctly trigger, authenticate the user, query the file tracker, and respond with the current index, resolving the timeout issue.
