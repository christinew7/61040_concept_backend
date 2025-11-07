---
timestamp: 'Fri Nov 07 2025 13:14:59 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131459.f5f57a88.md]]'
content_id: 1511fba236634999b3e7a0bbad01356899dff34b22e88346992eaed3d6c0cf00
---

# response:

You're encountering an `undefined` issue for `isVisible` because of a mismatch in variable names between your synchronization's `then` clause and the `FileTracker.setVisibility` concept action's expected parameters.

Let's break down the problem and fix it.

### The Problem

1. **`FileTracker.setVisibility` expects `visible`**: Looking at your `FileTrackerConcept.ts`, the `setVisibility` action is defined as:
   ```typescript
   async setVisibility(
     { owner, file, visible }: { owner: User; file: File; visible: boolean }, // <--- expects 'visible'
   ): Promise<Empty | { error: string }> {
     // ...
   }
   ```
   It expects a parameter named `visible`.

2. **Your `then` clause passes `isVisible`**:
   ```typescript
   then: actions([
       FileTracker.setVisibility,
       {
           owner: user,
           file,
           isVisible, // <--- You're passing 'isVisible'
       },
   ]),
   ```
   Here, you are passing `isVisible` as the key, but the concept action expects `visible`. The value `isVisible` in the `then` clause comes from the destructuring of the sync function's arguments `({ request, session, user, file, visible, isVisible })`.

### The Solution

You need to ensure the parameter name in the `then` clause matches the concept action's expected parameter name.

1. **Adjust the `then` clause**: Change `isVisible` to `visible` in the object passed to `FileTracker.setVisibility`.
2. **Simplify `where` clause**: The `visible` boolean is already present in the `originalFrame` from the `when` clause. You don't need to re-bind it to `isVisible` or `visible` explicitly in the `where` clause; you just need to ensure it's carried through the `frames`.

Here's the corrected synchronization:

```typescript
import { actions, Frames, Sync } from "@engine"; // Import Frames
import { Requesting, Sessioning, FileTracker } from "@concepts"; // Make sure FileTracker is imported

export const SetVisibilityRequest: Sync = (
  { request, session, user, file, visible }, // <--- Removed 'isVisible' from destructuring, as 'visible' is already what we need.
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/setVisibility", session, file, visible }, // 'visible' is bound here
    { request },
  ]),

  where: async (frames) => {
    // There should typically only be one frame from the 'when' clause here for a single request.
    const originalRequestFrame = frames[0];

    // Query for the user associated with the session.
    // We start a new Frames chain from the original request frame to ensure all prior bindings are carried.
    const userFrames = await new Frames(originalRequestFrame).query(
      Sessioning._getUser,
      { session: originalRequestFrame[session] }, // Use the session from the current frame
      { user }, // Bind the output user to the 'user' symbol
    );

    // If no user is found for the session, this means the session is invalid,
    // so we return an empty set of frames, preventing the 'then' clause from firing.
    if (userFrames.length === 0) {
      return new Frames(); // Return an empty Frames object
    }

    // The 'userFrames' now contains all bindings: request, session, file, visible, and user.
    // No further mapping is needed to bind 'visible' as it came from the 'when' clause.
    return userFrames;
  },

  then: actions([
    FileTracker.setVisibility,
    {
      owner: user, // 'user' is bound from the 'where' clause
      file,       // 'file' is bound from the 'when' clause
      visible,    // <--- THIS IS THE FIX: Pass 'visible', which is already bound from the 'when' clause.
    },
  ]),
});
```

### Explanation of Changes:

1. **`SetVisibilityRequest` arguments**: Changed from `{ request, session, user, file, visible, isVisible }` to `{ request, session, user, file, visible }`. The `visible` parameter is directly available from the `when` clause's pattern match. There's no separate `isVisible` variable needed here.
2. **`where` clause refinement**:
   * It now correctly starts the query chain from `new Frames(originalRequestFrame)` to ensure `request`, `session`, `file`, and `visible` are carried forward.
   * It explicitly uses `originalRequestFrame[session]` for the query input.
   * Crucially, if `Sessioning._getUser` doesn't return a user (i.e., `userFrames.length === 0`), it now returns `new Frames()` (an empty `Frames` object). This means the `then` clause will *not* fire, which is the correct behavior for an unauthorized or invalid session. Your previous code had a bug where `userFrames[0][user]` would error if `userFrames` was empty, or it would proceed with an `undefined` user if you didn't catch it.
   * The `map` function to re-bind `isVisible` is no longer needed because the `visible` variable (with its correct boolean value) is already present in the frames from the `when` clause and carried through by `userFrames`.
3. **`then` clause**: The argument passed to `FileTracker.setVisibility` now uses `{ owner: user, file, visible }`, which aligns with the `FileTracker` concept's `setVisibility` action signature.

This revised synchronization ensures that the boolean value from the request is correctly identified, an authorized user is associated, and the `FileTracker.setVisibility` action is called with the expected `visible` parameter.
