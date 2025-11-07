---
timestamp: 'Thu Nov 06 2025 21:22:05 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_212205.0b585303.md]]'
content_id: 4c4d2552b59be43722942f8e6e7b9aba068f026a56fa7eb5637102ff8c7cfec7
---

# prompt: what's wrong with my getfilestring:

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

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

if (sessionFrames.length === 0) {

return new Frames();

}

const userIdValue = sessionFrames\[0]\[user];

const result = await Library.\_getFileString({ owner: userIdValue, file });

return new Frames({

...originalFrame,

[fileString]: result.fileString,

});

},

then: actions(\[

Requesting.respond,

{ request, fileString },

]),

});

\[Requesting] Received request for path: /Library/\_getFileString

Requesting.request {
session: '019a0363-778d-7ee3-a5d1-07930b7c03cf',
file: '019a5c1c-74bc-799d-8bdc-504943033833',
path: '/Library/\_getFileString'
} => { request: '019a5c1c-7933-798a-8464-eba8917069e5' }

\[Requesting] Error processing request: Missing binding: Symbol(fileString) in frame: \[object Object]
