---
timestamp: 'Thu Nov 06 2025 18:55:28 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185528.eb2dd053.md]]'
content_id: 2a587ee05eea54309533161b6b5a35fdf2a277131e4b62078aadc3a271d73538
---

# file: src/syncs/auth.sync.ts

```typescript
import { actions, Sync } from "@engine";
import {
  Library,
  PasswordAuthentication,
  Requesting,
  Sessioning,
} from "@concepts";
import { Frames } from "../engine/frames.ts";

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
 * @when Requesting.request (path: "/register") : (request)
 *   AND PasswordAuthentication.register () : (user)
 * @then Requesting.respond (request, user)
 * @purpose Responds to a successful registration request with the newly created user's ID.
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
    [Library.create, {
      owner: user,
    }],
  ),
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

/**
 * @sync AuthenticateRequest
 * @when Requesting.request (path: "/authenticate", username, password) : (request)
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
 * @sync AuthenticateResponseCreatesSession
 */
export const AuthenticateResponseCreatesSession: Sync = ({ user }) => ({
  when: actions(
    [PasswordAuthentication.authenticate, {}, { user }],
  ),
  then: actions([
    Sessioning.create,
    { user },
  ]),
});

export const AuthenticateResponseSuccess: Sync = (
  { request, user, session },
) => ({
  when: actions(
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, {
      request,
    }],
    [PasswordAuthentication.authenticate, {}, { user }],
    [Sessioning.create, { user }, { session }],
  ),
  then: actions([
    Requesting.respond,
    { request, user, session },
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
    [Requesting.request, { path: "/PasswordAuthentication/authenticate" }, {
      request,
    }],
    [PasswordAuthentication.authenticate, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

//-- User Logout --//
export const LogoutRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/logout", session }, {
    request,
  }]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Sessioning.delete, { session }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/logout" }, { request }],
    [Sessioning.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "logged_out" }]),
});

// --- SYNCS FOR GETTING USERNAME ---

export const GetUsernameRequest: Sync = (
  { request, session, userId, username },
) => ({
  when: actions([
    Requesting.request,
    { path: "/PasswordAuthentication/_getUsername", session, username },
    { request },
  ]),
  where: async (frames) => {
    console.log("here");
    const originalFrame = frames[0];

    // Query the session to get the userId
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      userId,
    });
    if (sessionFrames.length === 0) {
      return new Frames({
        ...originalFrame,
        error: "Invalid session. Please log in again.",
      });
    }

    const userIdValue = sessionFrames[0][userId];

    // Fetch username from auth system
    const { username: usernameValue } = await PasswordAuthentication
      ._getUsername({ userId: userIdValue });

    return new Frames({
      ...originalFrame,
      [username]: usernameValue,
      [userId]: userIdValue,
    });
  },
  then: actions([
    Requesting.respond,
    { request, username },
  ]),
});

export const GetUserRequest: Sync = (
  { request, session, userId, username },
) => ({
  when: actions([Requesting.request, {
    path: "/PasswordAuthentication/_getUserByUsername",
    session,
  }, { request }]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      userId,
    });

    if (sessionFrames.length === 0) {
      // Invalid session
      return new Frames({
        ...originalFrame,
        ["error"]: "Invalid session. Please log in again.",
      });
    }

    const usernameValue = sessionFrames[0][username];

    // Step 2: Get username using the user ID
    const { user: userIdValue } = await PasswordAuthentication
      ._getUserByUsername({
        username: usernameValue,
      });

    // Step 3: Return a new frame containing username and user ID
    return new Frames({
      ...originalFrame,
      [userId]: userIdValue,
    });
  },
  then: actions([
    Requesting.respond,
    { request, userId },
  ]),
});

```
