---
timestamp: 'Thu Nov 06 2025 18:55:28 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185528.eb2dd053.md]]'
content_id: 0a7da52180c7bfa37f732e2062fb6bb3befea1dbf339e6d18fc61acc3896edac
---

# prompt:

can you help me fix the sync for \_getUsername
export const GetUsernameRequest: Sync = (

{ request, session, userId, username },

) => ({

when: actions(\[

Requesting.request,

{ path: "/PasswordAuthentication/\_getUsername", session, username },

{ request },

]),

where: async (frames) => {

console.log("here");

const originalFrame = frames\[0];

// Query the session to get the userId

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

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

.\_getUsername({ userId: userIdValue });

return new Frames({

...originalFrame,

[username]: usernameValue,

[userId]: userIdValue,

});

},

then: actions(\[

Requesting.respond,

{ request, username },

]),

});

export const GetUserRequest: Sync = (

{ request, session, userId, username },

) => ({

when: actions(\[Requesting.request, {

path: "/PasswordAuthentication/\_getUserByUsername",

session,

}, { request }]),

where: async (frames) => {

const originalFrame = frames\[0];

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

userId,

});

if (sessionFrames.length === 0) {

// Invalid session

return new Frames({

...originalFrame,

\["error"]: "Invalid session. Please log in again.",

});

}

const usernameValue = sessionFrames[0][username];

// Step 2: Get username using the user ID

const { user: userIdValue } = await PasswordAuthentication

.\_getUserByUsername({

username: usernameValue,

});

// Step 3: Return a new frame containing username and user ID

return new Frames({

...originalFrame,

[userId]: userIdValue,

});

},

then: actions(\[

Requesting.respond,

{ request, userId },

]),

});

\[Requesting] Error processing request: Missing binding: Symbol(username) in frame: \[object Object]
