---
timestamp: 'Thu Nov 06 2025 22:15:14 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_221514.df9467ed.md]]'
content_id: 6f0dc9488e2af8210735c7fa2524bcec78d9b4bff568ea737d1c54d46fcbaa25
---

# prompt: can you help me fix my jump to. how come it was a success response, but it didn't actually update?

export const JumpToRequest: Sync = (

{ request, session, user, file, index },

) => ({

when: actions(\[

Requesting.request,

{ path: "/FileTracker/jumpTo", session, file, index },

{ request },

]),

where: async (frames) => {

let sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

sessionFrames = sessionFrames.filter(($) => $\[user] !== null);

if (sessionFrames.length === 0) {

return frames;

}

console.log("sesh frames", sessionFrames);

return sessionFrames;

},

then: actions(\[

FileTracker.jumpTo,

{

owner: user,

file,

index,

},

]),

});

export const JumpToResponse: Sync = ({ request }) => ({

when: actions(

\[Requesting.request, { path: "/FileTracker/jumpTo" }, { request }],

\[FileTracker.jumpTo, {}, {}],

),

then: actions(\[Requesting.respond, { request, status: "jumpedTo" }]),

});
