---
timestamp: 'Thu Nov 06 2025 01:31:09 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_013109.81d07f36.md]]'
content_id: 8645ea8fb8530ae20b0a025090b29a95c301247fb2e125a04073d3de2dcc8ebe
---

# response:

Here are the synchronizations for the `PasswordAuthentication` concept, as well as the related `Sessioning` concept for authentication and logout, to handle HTTP requests via the `Requesting` concept.

Place these syncs in a file like `src/syncs/auth.sync.ts`. Remember to run `deno run build` after adding new concepts or sync files to ensure the `@concepts` import is updated.

```typescript
// src/syncs/auth.sync.ts

import { actions, Sync, Frames } from "@engine";
import { Requesting, PasswordAuthentication, Sessioning } from "@concepts";

// --- Synchronizations for PasswordAuthentication.register ---

/**
 * @sync RegisterRequest
 * @when Requesting.request (path: "/register", username, password)
 * @then PasswordAuthentication.register (username, password)
 * @description Triggers the registration action when a /register HTTP request is received.
 */
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions(
    [Requesting.request, { path: "/register", username, password }, { request }],
  ),
  then: actions(
    [PasswordAuthentication.register, { username, password }],
  ),
});

/**
 * @sync RegisterResponseSuccess
 * @when Requesting.request (path: "/register") AND PasswordAuthentication.register () : (user)
 * @then Requesting.respond (request, user)
 * @description Responds to a successful registration request with the new user's ID.
 */
export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions(
    [Requesting.respond, { request, user }],
  ),
});

/**
 * @sync RegisterResponseError
 * @when Requesting.request (path: "/register") AND PasswordAuthentication.register () : (error)
 * @then Requesting.respond (request, error)
 * @description Responds to a failed registration request with an error message.
 */
export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions(
    [Requesting.respond, { request, error }],
  ),
});

// --- Synchronizations for PasswordAuthentication.authenticate and Sessioning.create ---

/**
 * @sync AuthenticateRequest
 * @when Requesting.request (path: "/authenticate", username, password)
 * @then PasswordAuthentication.authenticate (username, password)
 * @description Triggers the authentication action when a /authenticate HTTP request is received.
 */
export const AuthenticateRequest: Sync = ({ request, username, password }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate", username, password }, { request }],
  ),
  then: actions(
    [PasswordAuthentication.authenticate, { username, password }],
  ),
});

/**
 * @sync AuthenticateAndCreateSession
 * @when Requesting.request (path: "/authenticate") AND PasswordAuthentication.authenticate () : (user)
 * @then Sessioning.create (user)
 * @description Creates a new session for the user if authentication is successful.
 */
export const AuthenticateAndCreateSession: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }], // Capture 'user' from successful authentication
  ),
  then: actions(
    [Sessioning.create, { user }], // Use the captured 'user' to create a session
  ),
});

/**
 * @sync AuthenticateRespondWithSession
 * @when Requesting.request (path: "/authenticate")
 *   AND PasswordAuthentication.authenticate () : (user)
 *   AND Sessioning.create () : (session)
 * @then Requesting.respond (request, user, session)
 * @description Responds to a successful authentication and session creation with the user's ID and new session ID.
 */
export const AuthenticateRespondWithSession: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }], // Ensure auth happened
    [Sessioning.create, { user }, { session }], // Ensure session creation happened for the *same* user and request flow
  ),
  then: actions(
    [Requesting.respond, { request, user, session }],
  ),
});

/**
 * @sync AuthenticateResponseError
 * @when Requesting.request (path: "/authenticate") AND PasswordAuthentication.authenticate () : (error)
 * @then Requesting.respond (request, error)
 * @description Responds to a failed authentication request with an error message.
 */
export const AuthenticateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions(
    [Requesting.respond, { request, error }],
  ),
});

// --- Synchronizations for Sessioning.delete (Logout) ---

/**
 * @sync LogoutRequest
 * @when Requesting.request (path: "/logout", session)
 * @then Sessioning.delete (session)
 * @description Triggers the session deletion action when a /logout HTTP request is received.
 */
export const LogoutRequest: Sync = ({ request, session }) => ({
  when: actions(
    [Requesting.request, { path: "/logout", session }, { request }],
  ),
  then: actions(
    [Sessioning.delete, { session }],
  ),
});

/**
 * @sync LogoutResponseSuccess
 * @when Requesting.request (path: "/logout", session) AND Sessioning.delete (session) : ()
 * @then Requesting.respond (request, message: "Logged out successfully")
 * @description Responds to a successful logout request.
 */
export const LogoutResponseSuccess: Sync = ({ request, session }) => ({
  when: actions(
    [Requesting.request, { path: "/logout", session }, { request }],
    [Sessioning.delete, { session }, {}], // Match successful deletion of the specific session
  ),
  then: actions(
    [Requesting.respond, { request, message: "Logged out successfully" }],
  ),
});

/**
 * @sync LogoutResponseError
 * @when Requesting.request (path: "/logout") AND Sessioning.delete () : (error)
 * @then Requesting.respond (request, error)
 * @description Responds to a failed logout request with an error message.
 */
export const LogoutResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, { error }],
  ),
  then: actions(
    [Requesting.respond, { request, error }],
  ),
});
```
