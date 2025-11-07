---
timestamp: 'Thu Nov 06 2025 22:06:41 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_220641.e38f8b7a.md]]'
content_id: d7350d5d537593601dcf533953ca3a958406b49b6797854b13047c8369344e78
---

# prompt: can you help me fix my jump to

export const JumpToRequest: Sync = (

{ request, session, user, file, index },

) => ({

when: actions(\[

Requesting.request,

{ path: "/FileTracker/jumpTo", session, file, index },

{ request },

]),

where: async (frames) => {

const originalFrame = frames\[0];

// Get the user ID from the session

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

console.log("user value is", userIdValue);

// Return frame with actual values for jumpTo

return new Frames({

...originalFrame,

owner: userIdValue, // must match "owner" in then

file, // must match "file" in then

index, // must match "index" in then

});

},

then: actions(\[

FileTracker.jumpTo,

{

owner: "owner", // these refer to the keys in the frame returned by where

file: "file",

index: "index",

},

]),

});
