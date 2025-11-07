---
timestamp: 'Thu Nov 06 2025 22:58:13 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_225813.9a326345.md]]'
content_id: 1a84ec34c943dedfe4642d67a8000316abdb273433f8bfc1b267144e82f14b48
---

# prompt:   i'm having symbol string errors again:

og file Symbol(file)
cur item user 019a5c70-dcd5-72f3-b7cc-9c7ebec62ab2
cur item Symbol(file)
\[Requesting] Error processing request: Cannot convert a Symbol value to a string

export const GetFileStringRequest: Sync = (

{ request, session, user, file, fileString },

) => ({

when: actions(\[

Requesting.request,

{ path: "/Library/\_getFileString", session, file },

{ request },

]),

where: async (frames) => {

const originalFrame = frames\[0];

// Get the actual user ID from the session

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

if (sessionFrames.length === 0) {

return new Frames({

...originalFrame,

error: "Invalid session",

});

}

const userIdValue = sessionFrames\[0]\[user];

console.log("found user", userIdValue);

// Fetch the file string from the Library

const result = await Library.\_getFileString({ owner: userIdValue, file });

console.log("result string", result);

console.log(".fileString", result.fileString);

return new Frames({

...originalFrame,

[fileString]: result.fileString,

});

},

then: actions(\[

Requesting.respond,

{

request,

fileString,

},

]),

});
