---
timestamp: 'Wed Nov 05 2025 23:47:30 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251105_234730.a937048a.md]]'
content_id: 588f466dcf48951193ae8b2de6c13e2246634293073d13ed04b3533de06b276a
---

# file: src/syncs/auth.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { Requesting, PasswordAuthentication } from "@concepts";
import { ID } from "@utils/types.ts";

/**
 * --- Synchronizations for PasswordAuthentication ---
 *
 * This file defines syncs to handle HTTP requests for user registration and authentication
 * using the PasswordAuthentication concept.
 */

// --------------------------------------------------------------------------------
// Register User
// --------------------------------------------------------------------------------

/**
 * @sync RegisterRequest
 * @when Requesting.request (path: "/register", username, password) : (request)
 * @then PasswordAuthentication.register (username, password)
 * @purpose Maps an incoming HTTP request for registration to the PasswordAuthentication concept's register action.
 */
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/register", username, password },
    { request },
  ]),
  then: actions([
    PasswordAuthentication.register,
    { username, password },
  ]),
});

/**
 * @sync RegisterResponse
 * @when Requesting.request (path: "/register") : (request)
 *   AND PasswordAuthentication.register () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful registration request with the newly created user's ID.
 */
export const RegisterResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions([
    Requesting.respond,
    { request, user: user as ID }, // Ensure user type is ID for Requesting.respond
  ]),
});

/**
 * @sync RegisterResponseError
 * @when Requesting.request (path: "/register") : (request)
 *   AND PasswordAuthentication.register () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed registration request with the error message.
 */
export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/register" }, { request }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

// --------------------------------------------------------------------------------
// Authenticate User
// --------------------------------------------------------------------------------

/**
 * @sync AuthenticateRequest
 * @when Requesting.request (path: "/authenticate", username, password) : (request)
 * @then PasswordAuthentication.authenticate (username, password)
 * @purpose Maps an incoming HTTP request for authentication to the PasswordAuthentication concept's authenticate action.
 */
export const AuthenticateRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/authenticate", username, password },
    { request },
  ]),
  then: actions([
    PasswordAuthentication.authenticate,
    { username, password },
  ]),
});

/**
 * @sync AuthenticateResponse
 * @when Requesting.request (path: "/authenticate") : (request)
 *   AND PasswordAuthentication.authenticate () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful authentication request with the authenticated user's ID.
 */
export const AuthenticateResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }],
  ),
  then: actions([
    Requesting.respond,
    { request, user: user as ID }, // Ensure user type is ID for Requesting.respond
  ]),
});

/**
 * @sync AuthenticateResponseError
 * @when Requesting.request (path: "/authenticate") : (request)
 *   AND PasswordAuthentication.authenticate () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed authentication request with the error message.
 */
export const AuthenticateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});
```

***

**To use this:**

1. Save the `PasswordAuthenticationConcept.ts` file in `src/concepts/PasswordAuthentication/`.
2. Create a new file `src/syncs/auth.sync.ts` and paste the synchronization code into it.
3. Run `deno run build` from your project root to update the `@concepts` import map.
4. Start your application with `deno run start`.

Now, when you send a POST request to `/api/register` or `/api/authenticate` with the `username` and `password` in the body, the `Requesting` concept will fire a `Requesting.request` action. Your synchronizations will then catch these requests, invoke the appropriate `PasswordAuthentication` action, and send back a response (either the user ID or an error message).
