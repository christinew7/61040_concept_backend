---
timestamp: 'Thu Nov 06 2025 21:35:07 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_213507.4f720b78.md]]'
content_id: ca92fc23cc710fc245c9fc842d7c1e6afe5d6289c21bd7adc8cfdda005ea887c
---

# prompt: can you help me fix my getcurrent item:

export const GetCurrentItemRequest: Sync = (

{ request, session, user, file, index },

) => ({

when: actions(\[Requesting.request, {

path: "/Library/\_getCurrentItem",

session,

}, { request }]),

where: async (frames) => {

const originalFrame = frames\[0];

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

if (sessionFrames.length === 0) {

return new Frames();

}

// Extract user ID from the first frame

const userIdValue = sessionFrames\[0]\[user];

const fileValue = sessionFrames\[0]\[file];

// Step 2: Get username using the user ID

const result = await FileTracker.\_getCurrentItem({

owner: userIdValue,

file: fileValue,

});

if ("error" in result) {

return new Frames({

...originalFrame,

\["error"]: "User not found in authentication system.",

});

}

console.log("curr item result", result);

return new Frames({

...originalFrame,

[index]: result.index,

});

},

then: actions(\[

Requesting.respond,

{ request, index },

]),

});
