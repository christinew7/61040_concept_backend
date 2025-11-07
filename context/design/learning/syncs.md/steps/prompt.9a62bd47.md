---
timestamp: 'Thu Nov 06 2025 22:33:22 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_223322.bbc1200e.md]]'
content_id: 9a62bd4754fc9fad0b341f1e2459b0cd1c955c59f014d55366cafa676a44bfc6
---

# prompt: this returns the same filestring everytime despite having a different fileID

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
