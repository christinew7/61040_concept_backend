---
timestamp: 'Thu Nov 06 2025 00:53:59 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_005359.a387ee48.md]]'
content_id: f37eab53e7aabc543bc2ad02175837e04c43a3e6b8935f1cf501ee3f7341b009
---

# response:

```typescript
// file: src/syncs/auth.sync.ts
import { actions, Sync } from "@engine";
import { Library, PasswordAuthentication, Requesting } from "@concepts"; // Updated imports

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
 * @sync RegisterResponse
 * @when Requesting.request (path: "/PasswordAuthentication/register") : (request)
 * AND PasswordAuthentication.register () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful registration request with the newly created user's ID and creates a Library for them.
 */
export const RegisterResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/register" }, {
      request,
    }],
    [PasswordAuthentication.register, {}, { user }],
  ),
  then: actions(
    [Requesting.respond, { request, user }],
    [Library.create, { owner: user }], // Create a library for the new user
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
    [Requesting.request, { path: "/PasswordAuthentication/register" }, { request }],
    [PasswordAuthentication.register, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

/**
 * @sync AuthenticateRequest
 * @when Requesting.request (path: "/PasswordAuthentication/authenticate", username, password) : (request)
 * @then PasswordAuthentication.authenticate (username, password)
 * @purpose Maps an incoming HTTP request for authentication to the PasswordAuthentication concept's authenticate action.
 */
export const AuthenticateRequest: Sync = ({ request, username, password }) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/authenticate", username, password },
    { request },
  ]),
  then: actions([
    PasswordAuthentication.authenticate,
    { username, password },
  ]),
});

/**
 * @sync AuthenticateResponse
 * @when Requesting.request (path: "/PasswordAuthentication/authenticate") : (request)
 * AND PasswordAuthentication.authenticate () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful authentication request with the authenticated user's ID.
 */
export const AuthenticateResponse: Sync = ({ request, user }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { user }],
  ),
  then: actions([
    Requesting.respond,
    { request, user },
  ]),
});

/**
 * @sync AuthenticateResponseError
 * @when Requesting.request (path: "/PasswordAuthentication/authenticate") : (request)
 * AND PasswordAuthentication.authenticate () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed authentication request with the error message.
 */
export const AuthenticateResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, { request }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});
```
