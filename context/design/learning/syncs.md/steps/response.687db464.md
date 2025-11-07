---
timestamp: 'Thu Nov 06 2025 00:45:35 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_004535.0f90639e.md]]'
content_id: 687db4649dd67645ae95d8b00f73651cac6c6a0ff50189e7a890fd6bdd6c6cca
---

# response:

```typescript
// file: src/syncs/auth.sync.ts
import { actions, Sync } from "@engine";
import {
  PasswordAuthentication,
  Requesting,
  Sessioning,
} from "@concepts"; // Assuming SessioningConcept exists in src/concepts/Sessioning/SessioningConcept.ts

// -------------------------------------------------------------------------------- //
//                                 User Registration                                //
// -------------------------------------------------------------------------------- //

/**
 * @sync RegisterRequest
 * @when Requesting.request (path: "/PasswordAuthentication/register", username, password) : (request)
 * @then PasswordAuthentication.register (username, password)
 * @purpose Maps an incoming HTTP request for registration to the PasswordAuthentication concept's register action.
 */
export const RegisterRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/register", username, password },
    { request },
  ]),
  then: actions([
    PasswordAuthentication.register,
    { username, password },
  ]),
});

/**
 * @sync RegisterResponseSuccess
 * @when Requesting.request (path: "/PasswordAuthentication/register") : (request)
 * AND PasswordAuthentication.register () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful registration request with the newly created user's ID.
 */
export const RegisterResponseSuccess: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions(
    [Requesting.respond, { request, user }],
  ),
});

/**
 * @sync RegisterResponseError
 * @when Requesting.request (path: "/PasswordAuthentication/register") : (request)
 * AND PasswordAuthentication.register () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed registration request with the error message.
 */
export const RegisterResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

// -------------------------------------------------------------------------------- //
//                             User Login & Session Creation                        //
// -------------------------------------------------------------------------------- //

/**
 * @sync LoginRequest
 * @when Requesting.request (path: "/login", username, password) : (request)
 * @then PasswordAuthentication.authenticate (username, password)
 * @purpose Maps an incoming HTTP request for login to the PasswordAuthentication concept's authenticate action.
 */
export const LoginRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/login", username, password },
    { request },
  ]),
  then: actions([
    PasswordAuthentication.authenticate,
    { username, password },
  ]),
});

/**
 * @sync LoginSuccessCreatesSession
 * @when PasswordAuthentication.authenticate () : (user)
 * @then Sessioning.create (user)
 * @purpose When a user successfully authenticates, a new session is created for them.
 */
export const LoginSuccessCreatesSession: Sync = ({ user }) => ({
  when: actions(
    [PasswordAuthentication.authenticate, {}, { user }],
  ),
  then: actions(
    [Sessioning.create, { owner: user }], // Assuming Sessioning.create takes 'owner' as the user ID
  ),
});

/**
 * @sync LoginResponseSuccess
 * @when Requesting.request (path: "/login") : (request)
 * AND PasswordAuthentication.authenticate () : (user)
 * AND Sessioning.create (user) : (session)
 * @then Requesting.respond (request, session)
 * @purpose Responds to a successful login request with the new session ID.
 */
export const LoginResponseSuccess: Sync = ({ request, user, session }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }],
    [Sessioning.create, { owner: user }, { session }],
  ),
  then: actions(
    [Requesting.respond, { request, session }],
  ),
});

/**
 * @sync LoginResponseError
 * @when Requesting.request (path: "/login") : (request)
 * AND PasswordAuthentication.authenticate () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed login request with the error message.
 */
export const LoginResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/login" }, { request }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions(
    [Requesting.respond, { request, error }],
  ),
});

// -------------------------------------------------------------------------------- //
//                                   User Logout                                    //
// -------------------------------------------------------------------------------- //

/**
 * @sync LogoutRequest
 * @when Requesting.request (path: "/logout", session) : (request)
 * @where in Sessioning: _getUser(session) gets user
 * @then Sessioning.delete (session)
 * @purpose Maps an incoming HTTP request for logout to the Sessioning concept's delete action, after verifying the session.
 */
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions(
    [Requesting.request, { path: "/logout", session }, { request }],
  ),
  where: async (frames) => {
    // Authorize the request: a valid session must exist and we derive the user from it
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    return frames;
  },
  then: actions(
    [Sessioning.delete, { session }],
  ),
});

/**
 * @sync LogoutResponse
 * @when Requesting.request (path: "/logout") : (request)
 * AND Sessioning.delete () : ()
 * @then Requesting.respond (request, status: "logged_out")
 * @purpose Responds to a successful logout request.
 */
export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}], // Sessioning.delete returns an empty dictionary on success
  ),
  then: actions(
    [Requesting.respond, { request, status: "logged_out" }],
  ),
});
```
