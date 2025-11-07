---
timestamp: 'Thu Nov 06 2025 20:23:20 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_202320.1dacf479.md]]'
content_id: 466676e6ed638e58b5f189189300017c8975891ddeac5146f6a9848ac7abca49
---

# prompt: how to i properly pass in the file to \_getFileString

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
