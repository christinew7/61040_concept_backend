---
timestamp: 'Thu Nov 06 2025 00:33:04 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_003304.5c763146.md]]'
content_id: 45d2f6290434eab63bd09411972ca4acd47c27b28a4395bd0a6627b9efbf7469
---

# response:

In Concept Design, checking if a session token is correct (i.e., valid and associated with a logged-in user) is handled through **synchronizations** that interact with a dedicated **Sessioning concept**.

Let's assume you have a `Sessioning` concept (like the one hinted at in the `getDb()` example) that manages user sessions. A typical `Sessioning` concept might look something like this (simplified):

```concept
concept Sessioning [User]
purpose associate a user with an active session
principle a user logs in and gets a session, which identifies them for subsequent actions
state
  a set of Sessions with
    a user User
    a token String
    a lastActivity DateTime // To manage session expiry, etc.
actions
  create (user: User): (session: Session) // Creates a new session for a user
  delete (session: Session) // Deletes a session
queries
  _getUser (session: Session): (user: User) // Given a session, returns the associated user
  _getSession (user: User): (session: Session) // Given a user, returns their active session
```

To check if a session token is correct when it comes in via a `Requesting.request`, you would use the `Sessioning._getUser` query within the `where` clause of your synchronization.

Here's how you'd structure synchronizations to handle requests that require a valid session:

### 1. Synchronization for Valid Session (Proceed with action)

This synchronization will fire if a `Requesting.request` comes in with a `session` token, and that `session` token successfully resolves to a `user` via the `Sessioning` concept.

```typescript
// in src/syncs/auth.sync.ts (or relevant feature sync file)
import { actions, Sync } from "@engine";
import { Requesting, Sessioning, Posting } from "@concepts"; // Assuming Posting is another concept you want to use

export const AuthenticatedPostCreation: Sync = (
  { request, title, content, session, user },
) => ({
  when: actions(
    // Match an incoming request to create a post, expecting a session token
    [Requesting.request, { path: "/posts/create", title, content, session }, {
      request,
    }],
  ),
  where: async (frames) => {
    // Query the Sessioning concept to get the user associated with the session
    // If the session is invalid, _getUser will return no frames, and this 'where' clause will filter out the request.
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions(
    // If we reach here, 'session' was valid and 'user' is bound to the requesting user.
    // Now, trigger the actual Post creation action with the authenticated user.
    [Posting.create, { title, content, author: user }],
    // And respond to the original request (perhaps with a success message or the new post ID)
    // NOTE: In a real scenario, you'd likely have another sync to respond after Posting.create completes.
    // For simplicity, showing a direct respond here, but it's often chained.
    [Requesting.respond, { request, message: "Post created successfully" }],
  ),
});
```

**Explanation:**

* **`when` clause**: Captures the incoming `Requesting.request` with specific path and parameters, including `session`. It binds the incoming `request` ID.
* **`where` clause**: This is where the session validation happens.
  * `frames.query(Sessioning._getUser, { session }, { user })`: This calls the `_getUser` query on your `Sessioning` concept.
  * It takes the `session` variable (bound from the `when` clause) as input.
  * If `Sessioning._getUser` successfully finds a user for that session, it binds that user's ID to the `user` variable for each `frame`.
  * **Crucially**: If no user is found for the given `session` (i.e., the session token is invalid or expired), the `Sessioning._getUser` query will return an empty set of `frames`. When `frames` becomes empty in a `where` clause, the `then` clause **will not fire at all**, effectively blocking unauthorized access.
* **`then` clause**: Only executes if the `where` clause successfully bound a `user`. It then proceeds to trigger the desired application logic (e.g., `Posting.create`) and responds to the request.

### 2. Synchronization for Invalid Session (Respond with error)

This handles the case where the session token provided in the request is invalid or missing, and you want to send a specific error response back to the client. This typically needs to be a separate synchronization.

```typescript
// in src/syncs/auth.sync.ts
import { actions, Frames, Sync } from "@engine";
import { Requesting, Sessioning } from "@concepts";

export const UnauthenticatedRequestResponse: Sync = (
  { request, session, originalPath },
) => ({
  when: actions(
    // Catch any request where a session might be expected
    [Requesting.request, { path: originalPath, session }, { request }],
  ),
  where: async (frames) => {
    // Keep the original request frame before potential filtering
    const originalFrame = frames[0];

    // Attempt to query the Sessioning concept to validate the session
    const validatedFrames = await frames.query(Sessioning._getUser, {
      session,
    }, { /* no need to bind user if we're just checking existence */ });

    // If 'validatedFrames' is empty, it means the session was NOT found/valid.
    if (validatedFrames.length === 0) {
      // Recreate a frame with the original request details and the error.
      // We need to explicitly create a new Frames object to ensure it continues.
      return new Frames({
        ...originalFrame,
        request, // Ensure request ID is still bound for the respond action
        error: "Authentication required or session invalid.",
      });
    }
    // If the session was valid, this sync should NOT fire, so filter it out.
    // This sync is specifically for *unauthenticated* requests.
    return new Frames(); // Return empty frames to prevent the 'then' from firing
  },
  then: actions(
    // Respond to the request with the error message
    [Requesting.respond, { request, error }],
  ),
});
```

**Explanation:**

* **`when` clause**: Similar to before, it captures requests. `originalPath` is used to match any path.
* **`where` clause**:
  * `originalFrame = frames[0]`: It's crucial to capture the original frame's bindings (especially `request`) before any queries might empty the `frames` array.
  * `validatedFrames = await frames.query(...)`: We attempt the session validation query.
  * `if (validatedFrames.length === 0)`: This condition checks if the `Sessioning._getUser` query failed to find a user for the provided session. If it failed, we explicitly create a new `Frames` object with the original request `request` ID and an `error` message. This new frame is what passes to the `then` clause.
  * `return new Frames();`: If `validatedFrames` *is not* empty (meaning the session was actually valid), this synchronization should *not* handle it, as it's intended for invalid sessions. So, we return an empty `Frames` array to prevent its `then` clause from firing.
* **`then` clause**: Fires only when an invalid session is detected by the `where` clause, responding with the predefined error.

By using these two types of synchronizations, you can declaratively enforce session validation for your application's API endpoints, cleanly separating the concerns of authentication from your core business logic.
