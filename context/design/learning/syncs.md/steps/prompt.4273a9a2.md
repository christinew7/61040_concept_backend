---
timestamp: 'Thu Nov 06 2025 20:24:25 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_202425.d1442cd3.md]]'
content_id: 4273a9a2727dd4e18de058d99d332e5b171b338526ffc815d92d64d42261e2c5
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

Type 'symbol' is not assignable to type 'ID'.\
Type 'symbol' is not assignable to type 'string'.deno-ts(2322)

LibraryConcept.ts(338, 37): The expected type comes from property 'file' which is declared here on type '{ owner: ID; file: ID; }'
