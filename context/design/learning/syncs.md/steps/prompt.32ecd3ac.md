---
timestamp: 'Thu Nov 06 2025 21:41:43 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_214143.7594e9ec.md]]'
content_id: 32ecd3ac311826d36afe3bb394f5e6f34cd0b0763472a9006503887b93b00d45
---

# prompt: can you help me fix my getcurrent item:

\[Requesting] Received request for path: /FileTracker/\_getCurrentItem

Requesting.request {

session: '019a5b90-9a41-7c23-bbc0-beef93a9a003',

user: '019a0363-778d-7ee3-a5d1-07930b7c03cf',

file: '019a5c2d-cbea-7d29-87fd-68ab8affd1b3',

path: '/FileTracker/\_getCurrentItem'

} => { request: '019a5c2f-dc22-70ee-9ef5-7b5dd3085913' }

\[Requesting] Error processing request: Request 019a5c2f-dc22-70ee-9ef5-7b5dd3085913 timed out after 10000ms

export const GetCurrentItemRequest: Sync = (

{ request, session, user, file, index },

) => ({

when: actions(\[Requesting.request, {

path: "/Library/\_getCurrentItem",

session,

user,

file,

}, { request }]),

where: async (frames) => {

const originalFrame = frames\[0];

console.log("before");

const sessionFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

if (sessionFrames.length === 0) {

console.log("got nothing");

return new Frames();

}

console.log("find session frames", sessionFrames);

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

console.logs don't exist
