---
timestamp: 'Thu Nov 06 2025 00:20:15 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_002015.fd91050f.md]]'
content_id: 6102653e1568348f90dd1612fd998095e1a343675427b4f7995ba1c6d306c146
---

# prompt:

i'm having this error: No overload matches this call.\
Overload 1 of 2, '(f: (...args: never\[]) => unknown\[], input: { userId: symbol; }, output: { user: symbol; }): Frames<Frame>', gave the following error.\
Argument of type '({ userId }: { userId: ID; }) => Promise<{ user: ID; } | { error: string; }>' is not assignable to parameter of type '(...args: never\[]) => unknown\[]'.\
Type 'Promise<{ user: ID; } | { error: string; }>' is missing the following properties from type 'unknown\[]': length, pop, push, concat, and 35 more.\
Overload 2 of 2, '(f: (...args: never\[]) => Promise\<unknown\[]>, input: { userId: symbol; }, output: { user: symbol; }): Promise\<Frames<Frame>>', gave the following error.\
Argument of type '({ userId }: { userId: ID; }) => Promise<{ user: ID; } | { error: string; }>' is not assignable to parameter of type '(...args: never\[]) => Promise\<unknown\[]>'.\
Type 'Promise<{ user: ID; } | { error: string; }>' is not assignable to type 'Promise\<unknown\[]>'.\
Type '{ user: ID; } | { error: string; }' is not assignable to type 'unknown\[]'.\
Type '{ user: ID; }' is missing the following properties from type 'unknown\[]': length, pop, push, concat, and 35 more.deno-ts(2769)

(method) PasswordAuth

import { actions, Sync, Frames } from "@engine";

import { Library, Requesting, PasswordAuthentication } from "@concepts"; // Import PasswordAuthentication

/\*\*

* @sync ListMyFilesRequest

* @when Requesting.request (path: "/my-files", session) : (request)

* @where The session corresponds to a valid user

* @then Library.\_getAllFiles (owner: user)

* @purpose Handles an HTTP request to list all files for a given user, after authenticating the session.

* Assumes 'session' ID is provided in the request body (e.g., as the User ID from a prior login).

\*/

export const ListMyFilesRequest: Sync = (

{ request, session, user }, // 'session' comes from the request, 'user' will be bound in the 'where'

) => ({

when: actions(\[

Requesting.request,

{ path: "/my-files", session }, // Expect 'session' to be provided in the request body

{ request },

]),

where: async (frames) => {

// For each incoming request frame, validate the 'session' (User ID) using PasswordAuthentication

frames = await frames.query(

PasswordAuthentication.\_getUserId,

{ userId: session }, // Pass the 'session' from the request as 'userId' to the query

{ user }, // If successful, bind the validated User ID to the 'user' variable

);

// Handle the case where no user is found for the session (i.e., frames is empty after query)

// If the frames are empty, it means the session was invalid.

if (frames.length === 0) {

// Respond with an error directly from here.

// We create a new Frames instance with just the original request binding to respond to it.

return new Frames({ \[request]: request, error: "Invalid session. Please log in." });

}

return frames; // Continue with the validated frames

},

then: actions(\[

// If the session was valid, proceed to get all files for the validated 'user'

Library.\_getAllFiles, // Renamed from \_getAllFiles to getAllFiles as per your Library concept's action name

{ owner: user },

]),

});
