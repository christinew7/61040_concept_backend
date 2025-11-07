---
timestamp: 'Thu Nov 06 2025 20:18:44 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_201844.94019a71.md]]'
content_id: 8cc02fc5f8a1709834aa4b9894b0069795fd07a7312e376a1dc605549c89a001
---

# prompt:

can you help me fix the sync for getFileString in Library?/\*\*

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

const result = await Library.\_getFileString({

owner: userIdValue,

file,

});

return new Frames({

...originalFrame,

[fileString]: result.fileString,

});

},

then: actions(\[

Requesting.respond,

{ request, fileString },

]),
