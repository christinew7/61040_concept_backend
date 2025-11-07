---
timestamp: 'Thu Nov 06 2025 18:56:32 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185632.86ddc4d3.md]]'
content_id: d3b1d2bb0ba501627324a6cc0c2b8d1bd208d1bb1c07e5ed382d35ebb30396a8
---

# response:

Of course! I can help you fix the synchronizations. The error message `Missing binding: Symbol(username)` is a classic sign that a `then` clause expected a piece of information (a "binding" for the `username` variable) that wasn't provided by the `where` clause.

This is happening for a few reasons in your `GetUsernameRequest` sync. Let's break down the issues and then fix them.

### Root Causes of the Error

1. **Incorrect `when` Pattern**: The `when` clause for `GetUsernameRequest` tries to get a `username` from the incoming request body. However, the goal of this sync is to *find* the username using the `session`, so the request body likely won't contain a `username`.
2. **Incorrect `where` Logic**: The `where` clause calls a concept method directly (`await PasswordAuthentication._getUsername(...)`) instead of using the idiomatic `frames.query(...)` method. This bypasses the engine's mechanism for passing bindings from one step to the next.
3. **Missing Concept Query**: Your `PasswordAuthenticationConcept` is missing a `_getUsername` query that can find a user's name from their ID.
4. **Error Handling**: The attempt to handle the "invalid session" case inside the `where` clause is incompatible with the `then` clause. The `then` clause expects a `username`, but in the error case, the `where` clause provides an `error` instead, causing the "missing binding" crash. The best practice is to separate success and failure cases into different syncs.
5. **Logical Flaw in `GetUserRequest`**: The `GetUserRequest` sync has a similar issue where it tries to use a `username` variable that was never bound.

### Step 1: Fix the `PasswordAuthenticationConcept`

First, we need to add the missing `_getUsername` query and ensure all queries correctly return an array, as required by the framework.

#### file: src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts (Updated)

```typescript
// ... (imports and existing class structure)

export default class PasswordAuthenticationConcept {
  private users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection<UserDoc>(PREFIX + "users");
  }

  // ... (register and authenticate actions remain the same)


  /**
   * @query _getUsername
   * @param {object} args - The input arguments.
   * @param {User} args.user - The ID of the user.
   * @returns {Promise<{username: string}[]>} Returns an array containing the user's username if found.
   *
   * @requires user exists
   * @effects returns username of user
   */
  async _getUsername({ user }: { user: User }): Promise<{ username: string }[]> {
    const userDoc = await this.users.findOne({ _id: user });
    if (!userDoc) {
      return []; // Return empty array if user not found, as per query rules
    }
    return [{ username: userDoc.username }];
  }

  /**
   * @query _getUserByUsername
   * @param {object} args - The input arguments for the query.
   * @param {string} args.username - The username to search for.
   * @returns {Promise<{user: User}[]>} Returns an array containing the user's ID if found.
   */
  async _getUserByUsername({ username }: { username: string }): Promise<{ user: User }[]> {
    const userDoc = await this.users.findOne({ username });
    if (!userDoc) {
      return [];
    }
    return [{ user: userDoc._id }];
  }
}
```

### Step 2: Fix the Synchronizations

Now, let's replace your `GetUsernameRequest` and `GetUserRequest` with clearer, more robust versions that correctly handle both success and failure scenarios by splitting them into separate syncs.

#### file: src/syncs/auth.sync.ts (Updated)

```typescript
import { actions, Frames, Sync } from "@engine";
import {
  Library,
  PasswordAuthentication,
  Requesting,
  Sessioning,
} from "@concepts";

// ... (Your existing Register, Authenticate, and Logout syncs) ...

// --- GET CURRENT USER'S USERNAME (from session) ---
// This replaces your original `GetUsernameRequest`

/**
 * @sync GetCurrentUsername_Success
 * @when a request is made to get the current user's username with a valid session
 * @where the session corresponds to a valid user, and that user has a username
 * @then respond with the username
 */
export const GetCurrentUsername_Success: Sync = ({ request, session, user, username }) => ({
  when: actions([
    Requesting.request,
    // The request only needs the path and the session ID.
    { path: "/PasswordAuthentication/_getUsername", session },
    { request },
  ]),
  where: async (frames) => {
    // Chain the queries: first get user from session, then get username from that user's ID.
    // The chain will only produce frames if both queries succeed.
    return await frames
      .query(Sessioning._getUser, { session }, { user })
      .query(PasswordAuthentication._getUsername, { user }, { username });
  },
  then: actions([
    Requesting.respond,
    { request, username },
  ]),
});

/**
 * @sync GetCurrentUsername_Failure
 * @when a request is made to get the current user's username with an invalid session
 * @where the session does NOT correspond to a valid user
 * @then respond with an error message
 */
export const GetCurrentUsername_Failure: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUsername", session },
    { request },
  ]),
  where: async (frames) => {
    // Attempt to get the user from the session.
    const userFrames = await frames.query(Sessioning._getUser, { session }, { user });

    // This sync should only fire if the above query FAILED (returned no frames).
    if (userFrames.length === 0) {
      return frames; // Return the original frame which contains the 'request' binding for the response.
    } else {
      return new Frames(); // A user WAS found, so this failure sync should not fire.
    }
  },
  then: actions([
    Requesting.respond,
    { request, error: "Invalid session. Please log in again." },
  ]),
});


// --- GET USER ID BY USERNAME (public lookup) ---
// This replaces your original `GetUserRequest`

/**
 * @sync GetUserByUsername_Success
 * @when a request is made to find a user's ID by their username
 * @where a user with that username exists
 * @then respond with the user's ID
 */
export const GetUserByUsername_Success: Sync = ({ request, username, user }) => ({
  when: actions([
    Requesting.request,
    // The request body should contain the username to look up.
    { path: "/PasswordAuthentication/_getUserByUsername", username },
    { request },
  ]),
  where: async (frames) => {
    // Query for the user by username. This will only return frames if a user is found.
    return await frames.query(PasswordAuthentication._getUserByUsername, { username }, { user });
  },
  then: actions([
    Requesting.respond,
    { request, user },
  ]),
});

/**
 * @sync GetUserByUsername_Failure
 * @when a request is made to find a user's ID by their username
 * @where NO user with that username exists
 * @then respond with an error
 */
export const GetUserByUsername_Failure: Sync = ({ request, username, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUserByUsername", username },
    { request },
  ]),
  where: async (frames) => {
    const userFrames = await frames.query(PasswordAuthentication._getUserByUsername, { username }, { user });
    // This sync fires only if the query returned no results.
    if (userFrames.length === 0) {
      return frames; // User not found, pass the original frame to the 'then' clause.
    }
    return new Frames(); // User was found, so this failure sync should not fire.
  },
  then: actions([
    Requesting.respond,
    { request, error: "User not found." },
  ]),
});
```

By making these changes, you are aligning your code with the intended patterns of the concept design framework. This approach is more declarative, easier to debug, and robustly handles both the "happy path" and error conditions without causing crashes.
