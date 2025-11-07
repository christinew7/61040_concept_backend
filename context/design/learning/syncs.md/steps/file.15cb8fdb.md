---
timestamp: 'Thu Nov 06 2025 10:02:58 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_100258.b4c9a359.md]]'
content_id: 15cb8fdb08b95ddd23944d9d0d28a7ec786fa584b25383c905dbefc3a589ace2
---

# file: src/syncs/auth.sync.ts

```typescript
import { actions, Frames, Sync } from "@engine";
import { PasswordAuthentication, Requesting, Sessioning } from "@concepts";

// =================================================================================================
// == REGISTRATION FLOW                                                                           ==
// =================================================================================================

/**
 * @sync RegisterRequest
 * When an HTTP request is made to `/register`, trigger the `register` action
 * in the `PasswordAuthentication` concept.
 */
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/register", username, password },
    { request },
  ]),
  then: actions([PasswordAuthentication.register, { username, password }]),
});

/**
 * @sync RegisterResponseSuccess
 * When a user is successfully registered, respond to the original HTTP request
 * with the new user's ID.
 */
export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions([Requesting.respond, { request, user }]),
});

/**
 * @sync RegisterResponseError
 * If user registration fails (e.g., username already exists), respond to
 * the original HTTP request with the error message.
 */
export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// == LOGIN / SESSION CREATION FLOW                                                               ==
// =================================================================================================

/**
 * @sync LoginRequest
 * When an HTTP request is made to `/login`, trigger the `authenticate` action.
 */
export const LoginRequest: Sync = ({ request, username, password }) => ({
  when: actions(
    [Requesting.request, { path: "/login", username, password }, { request }],
  ),
  then: actions([PasswordAuthentication.authenticate, { username, password }]),
});

/**
 * @sync LoginSuccessCreatesSession
 * When authentication is successful, create a new session for that user.
 * This is a key composition: `PasswordAuthentication` success leads to a `Sessioning` action.
 */
export const LoginSuccessCreatesSession: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }],
  ),
  then: actions([Sessioning.create, { user }]),
});

/**
 * @sync SessionCreationResponse
 * When a session is created as part of the login flow, respond to the original
 * HTTP request with the new session ID.
 */
export const SessionCreationResponse: Sync = ({ request, session }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [Sessioning.create, {}, { session }],
  ),
  then: actions([Requesting.respond, { request, session }]),
});

/**
 * @sync LoginResponseError
 * If authentication fails, respond to the original HTTP request with the error.
 */
export const LoginResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// =================================================================================================
// == LOGOUT / SESSION DELETION FLOW                                                              ==
// =================================================================================================

/**
 * @sync LogoutRequest
 * When a request is made to `/logout` with a session ID, delete that session.
 */
export const LogoutRequest: Sync = ({ request, session }) => ({
  when: actions(
    [Requesting.request, { path: "/logout", session }, { request }],
  ),
  then: actions([Sessioning.delete, { session }]),
});

/**
 * @sync LogoutResponse
 * After a session is successfully deleted, respond to the original request
 * with a success status message.
 */
export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}], // Match on successful deletion
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});

// =================================================================================================
// == USING QUERIES IN THE `WHERE` CLAUSE                                                         ==
// =================================================================================================

/**
 * @sync CheckUsernameAvailability
 * Handles requests to `/users/check-username` to see if a username is already taken.
 * This is a great example of using a query in the `where` clause and handling
 * the "zero matches" case as described in the documentation.
 */
export const CheckUsernameAvailability: Sync = ({ request, username, userDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/users/check-username", username },
    { request },
  ]),
  where: async (frames) => {
    // Grab the original frame to preserve the `request` and `username` bindings.
    const originalFrame = frames[0];

    // Query for a user with the given username.
    const queryFrames = await frames.query(
      PasswordAuthentication._getUserByUsername,
      { username },
      { userDoc },
    );

    // If the query returns one or more frames, the username exists.
    if (queryFrames.length > 0) {
      // Return a new frame indicating the username is not available.
      return new Frames({ ...originalFrame, [Symbol("available")]: false });
    } else {
      // If the query returns zero frames, the username is available.
      return new Frames({ ...originalFrame, [Symbol("available")]: true });
    }
  },
  then: actions([Requesting.respond, { request, available: Symbol("available") }]),
});

/**
 * @sync GetMyProfile
 * Handles requests to `/users/me`. It uses the provided session ID to find the
 * user, then queries for that user's details and returns them. This shows how
 * concepts can be chained together through `where` clauses.
 */
export const GetMyProfile: Sync = ({ request, session, user, userDoc }) => ({
  when: actions([
    Requesting.request,
    { path: "/users/me", session },
    { request },
  ]),
  where: async (frames) => {
    // Step 1: Use the session to find the User ID.
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    // Step 2: Use the User ID to find the User document from PasswordAuthentication.
    frames = await frames.query(PasswordAuthentication._getUserById, { user }, { userDoc });
    // This will only return frames for valid, logged-in sessions that correspond to an existing user.
    return frames;
  },
  then: actions([Requesting.respond, { request, profile: userDoc }]),
});
```
