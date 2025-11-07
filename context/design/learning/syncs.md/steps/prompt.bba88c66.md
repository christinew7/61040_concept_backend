---
timestamp: 'Thu Nov 06 2025 00:45:18 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_004518.1b9b9867.md]]'
content_id: bba88c666175f3f94fd0bf884f481d6f7e16389051b7762b0b5cad2f43f2f182
---

# prompt: can you model this auth sync and update my auth.sync.ts to be similar to that?

import { actions, Sync } from "@engine";

import { Library, PasswordAuthentication, Requesting } from "@concepts";

/\*\*

* @sync RegisterRequest

* @when Requesting.request (path: "/PasswordAuthentication/register", username, password) : (request)

* @then PasswordAuthentication.register (username, password)

* @purpose Maps an incoming HTTP request for registration to the PasswordAuthentication concept's register action.

\*/

export const RegisterRequest: Sync = ({ request, username, password }) => ({

when: actions(\[

Requesting.request,

{ path: "/PasswordAuthentication/register", username, password },

{ request },

]),

then: actions(\[

PasswordAuthentication.register,

{ username, password },

]),

});

/\*\*

* @sync RegisterResponse

* @when Requesting.request (path: "/register") : (request)

* AND PasswordAuthentication.register () : (user)

* @then Requesting.respond (request, user)

* @purpose Responds to a successful registration request with the newly created user's ID.

\*/

export const RegisterResponse: Sync = ({ request, user }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/register" }, {

request,

}],

\[PasswordAuthentication.register, {}, { user }],

),

then: actions(

\[Requesting.respond, { request, user }],

\[Library.create, {

owner: user,

}],

),

});

/\*\*

* @sync RegisterResponseError

* @when Requesting.request (path: "/register") : (request)

* AND PasswordAuthentication.register () : (error)

* @then Requesting.respond (request, error)

* @purpose Responds to a failed registration request with the error message.

\*/

export const RegisterResponseError: Sync = ({ request, error }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/register" }, { request }],

\[PasswordAuthentication.register, {}, { error }],

),

then: actions(\[

Requesting.respond,

{ request, error },

]),

});

/\*\*

* @sync AuthenticateRequest

* @when Requesting.request (path: "/authenticate", username, password) : (request)

* @then PasswordAuthentication.authenticate (username, password)

* @purpose Maps an incoming HTTP request for authentication to the PasswordAuthentication concept's authenticate action.

\*/

export const AuthenticateRequest: Sync = ({ request, username, password }) => ({

when: actions(\[

Requesting.request,

{ path: "/PasswordAuthentication/authenticate", username, password },

{ request },

]),

then: actions(\[

PasswordAuthentication.authenticate,

{ username, password },

]),

});

/\*\*

* @sync AuthenticateResponse

* @when Requesting.request (path: "/authenticate") : (request)

* AND PasswordAuthentication.authenticate () : (user)

* @then Requesting.respond (request, user)

* @purpose Responds to a successful authentication request with the authenticated user's ID.

\*/

export const AuthenticateResponse: Sync = ({ request, user }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/authenticate" }, { request }],

\[PasswordAuthentication.authenticate, {}, { user }],

),

then: actions(\[

Requesting.respond,

{ request, user }, // Ensure user type is ID for Requesting.respond

]),

});

/\*\*

* @sync AuthenticateResponseError

* @when Requesting.request (path: "/authenticate") : (request)

* AND PasswordAuthentication.authenticate () : (error)

* @then Requesting.respond (request, error)

* @purpose Responds to a failed authentication request with the error message.

\*/

export const AuthenticateResponseError: Sync = ({ request, error }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/authenticate" }, { request }],

\[PasswordAuthentication.authenticate, {}, { error }],

),

then: actions(\[

Requesting.respond,

{ request, error },

]),

});
