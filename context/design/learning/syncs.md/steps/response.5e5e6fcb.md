---
timestamp: 'Thu Nov 06 2025 19:07:12 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_190712.3fd686a4.md]]'
content_id: 5e5e6fcbe2455243b954e7e04014289f0c0627d8aec42935de1b7ea5744e2caf
---

# response:

Of course! It looks like you've run into a common issue when writing synchronizations. The error `Missing binding: Symbol(username)` is a strong clue. It means the `then` clause expected a `username` variable to be available in the data (the "frame") passed from the `where` clause, but it wasn't found.

This is happening for a few reasons in your `GetUsernameRequest` sync:

1. **Incorrect `when` clause:** Your `when` pattern for the request is `{ path: "...", session, username }`. This tells the engine to look for a `username` field in the incoming HTTP request. However, the purpose of this endpoint is to *find* the username, so the request should provide the `userId` to look up, not the username itself.
2. **Incorrect `where` clause:** The `where` clause calls `PasswordAuthentication._getUsername` directly. In concept design, all interactions with other concepts within a `where` clause must go through the `frames.query()` method. This is how the engine correctly "binds" the results of the query (like the `username`) to the frame for the `then` clause to use.
3. **Handling Success and Errors:** The logic tries to handle success and error cases in a single sync. While possible, it's often clearer and more robust to separate them, especially when the response shape changes (e.g., returning `{username: ...}` on success vs. `{error: ...}` on failure).

Let's fix this by rewriting `GetUsernameRequest` and `GetUserRequest` using the correct patterns.

### Corrected Synchronizations

Here is the corrected code. The best practice is to split the logic into separate syncs: one for the "happy path" (success) and others for specific error cases. This makes the logic clear and ensures the `then` clause for each sync receives exactly the data it expects.

#### 1. Fixing `GetUsernameRequest`

This sync finds a user's `username` given their `userId`.

**File: `src/syncs/auth.sync.ts` (or wherever you have it)**

```typescript
import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, PasswordAuthentication } from "@concepts";

/**
 * SUCCESS: Handles a valid request to get a username for a given userId.
 * This sync will only fire if the session is valid AND the user is found.
 */
export const GetUsernameRequest: Sync = (
  { request, session, userId, username, currentUser },
) => ({
  when: actions([
    Requesting.request,
    // FIX: The request provides the `userId` to look up and a `session` for auth.
    { path: "/PasswordAuthentication/_getUsername", session, userId },
    { request },
  ]),
  where: async (frames) => {
    // FIX: Chain queries using `frames.query`.
    // This ensures that `frames` is only passed on if BOTH queries succeed.
    // Step 1: Validate the session to get the user making the request.
    frames = await frames.query(Sessioning._getUser, { session }, { user: currentUser });
    // Step 2: Get the target user's username using the provided `userId`.
    frames = await frames.query(PasswordAuthentication._getUsername, { userId }, { username });
    return frames;
  },
  then: actions([
    // This `then` clause now safely receives a frame with `username` bound.
    Requesting.respond,
    { request, username },
  ]),
});

/**
 * ERROR: Handles a request to get a username when the session is invalid.
 */
export const GetUsernameRequestInvalidSession: Sync = (
  { request, session, userId, currentUser },
) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUsername", session, userId },
    { request },
  ]),
  where: async (frames) => {
    // We only want this sync to fire if the session is INVALID.
    const successfulFrames = await frames.query(Sessioning._getUser, { session }, { user: currentUser });
    if (successfulFrames.length > 0) {
      // Session is valid, so this error sync should NOT fire. Return empty frames.
      return new Frames();
    }
    // Session is invalid. Return the original frame so the `then` clause can respond.
    return frames;
  },
  then: actions([
    Requesting.respond,
    { request, error: "Invalid session. Please log in again." },
  ]),
});
```

#### 2. Fixing `GetUserRequest`

Your `GetUserRequest` sync has the same issues. It should take a `username` as input to find the full user document.

**File: `src/syncs/auth.sync.ts`**

```typescript
/**
 * SUCCESS: Handles a valid request to get a user document for a given username.
 */
export const GetUserRequest: Sync = (
  { request, session, username, user, currentUser },
) => ({
  when: actions([
    Requesting.request,
    // FIX: The request provides the `username` to look up.
    { path: "/PasswordAuthentication/_getUserByUsername", session, username },
    { request },
  ]),
  where: async (frames) => {
    // Step 1: Validate the session.
    frames = await frames.query(Sessioning._getUser, { session }, { user: currentUser });
    // Step 2: Get the full user document using the provided `username`.
    frames = await frames.query(PasswordAuthentication._getUserByUsername, { username }, { user });
    return frames;
  },
  then: actions([
    // `Requesting.respond` will correctly serialize the `user` object in the response.
    Requesting.respond,
    { request, user },
  ]),
});

/**
 * ERROR: Handles a request to get a user when the session is invalid.
 */
export const GetUserRequestInvalidSession: Sync = (
  { request, session, username, currentUser },
) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUserByUsername", session, username },
    { request },
  ]),
  where: async (frames) => {
    const successfulFrames = await frames.query(Sessioning._getUser, { session }, { user: currentUser });
    if (successfulFrames.length > 0) {
      return new Frames(); // Session is valid, don't fire.
    }
    return frames; // Session is invalid, fire.
  },
  then: actions([
    Requesting.respond,
    { request, error: "Invalid session. Please log in again." },
  ]),
});
```

By replacing your original syncs with these corrected versions, your application will now correctly handle the request flows for both success and failure, resolving the "Missing binding" error.
