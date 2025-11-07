---
timestamp: 'Thu Nov 06 2025 18:59:29 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185929.4a980c7b.md]]'
content_id: 6f3cd338a2ec1b5560be203f1d8ff12a460bf3c51d1652c563762d818b4678f3
---

# file: src/syncs/auth.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { PasswordAuthentication, Requesting, Sessioning } from "@concepts";
// NOTE: I've removed the unused 'Library' and 'Frames' imports for clarity.

// ... (previous syncs like Register, Authenticate, Logout are omitted for brevity, assuming they are correct) ...

/**
 * @sync GetUsernameRequest
 * @when Requesting.request (path: "/PasswordAuthentication/_getUsername", session) : (request)
 * @where in Sessioning: _getUser(session) gets user
 *   AND in PasswordAuthentication: _getUsername(user) gets username
 * @then Requesting.respond (request, username)
 * @purpose Responds with the username of the currently logged-in user.
 */
export const GetUsernameRequest: Sync = ({ request, session, user, username }) => ({
  // FIX 1: The incoming request only needs a `session` to identify the user.
  // The `username` is what we are trying to find, so it's not an input.
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUsername", session },
    { request },
  ]),

  // FIX 2: Use a clean chain of `frames.query` calls.
  // This is the idiomatic way to fetch data and bind it to variables for the `then` clause.
  where: async (frames) => {
    return await frames
      // Step 1: Get the user ID associated with the session.
      // The `_getUser` query returns a `user` parameter. We bind it to our `user` variable.
      .query(Sessioning._getUser, { session }, { user })
      // Step 2: Use the `user` ID to get the username.
      // The `_getUsername` query takes a `userId` parameter. We pass our `user` variable.
      // It returns a `username` parameter, which we bind to our `username` variable.
      .query(PasswordAuthentication._getUsername, { userId: user }, { username });
  },

  // This `then` clause will now work because the `where` clause correctly binds `username`.
  then: actions([
    Requesting.respond,
    { request, username },
  ]),
});


/**
 * @sync GetUserRequest (was _getUserByUsername)
 * @when Requesting.request (path: "/PasswordAuthentication/_getUserByUsername", session, username) : (request)
 * @where in Sessioning: session is valid
 *   AND in PasswordAuthentication: _getUserByUsername(username) gets user
 * @then Requesting.respond (request, user)
 * @purpose Allows a logged-in user to look up another user's document by their username.
 */
export const GetUserRequest: Sync = ({ request, session, username, userDoc }) => ({
  // FIX 1: The request needs both a `session` (for auth) and the `username` to look up.
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUserByUsername", session, username },
    { request },
  ]),

  where: async (frames) => {
    return await frames
      // Step 1 (Authorization): Ensure the session is valid. If not, this query returns no frames, and the sync stops.
      .query(Sessioning._getUser, { session }, {})
      // Step 2 (Query): Use the `username` from the request to find the user document.
      // The query returns a `user` parameter, which we bind to our `userDoc` variable to avoid name clashes.
      .query(PasswordAuthentication._getUserByUsername, { username }, { user: userDoc });
  },

  // FIX 2: Respond with the found user document, bound as `userDoc` from the `where` clause.
  then: actions([
    Requesting.respond,
    { request, user: userDoc },
  ]),
});
```
