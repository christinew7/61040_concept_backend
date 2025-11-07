---
timestamp: 'Fri Nov 07 2025 13:14:43 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131443.3341eb11.md]]'
content_id: 32942b061f47635e9f39d85cd7bcc31e4bf28817a247a48928acd8d2ed7fc97d
---

# prompt:    why is my isVisible returning undefined when the reqest passes the visible boolean as a boolealn

export const SetVisibilityRequest: Sync = (

{ request, session, user, file, visible, isVisible },

) => ({

when: actions(\[

Requesting.request,

{ path: "/FileTracker/setVisibility", session, file, visible },

{ request },

]),

// where: async (frames) => {

// const originalFrame = frames\[0];

// // Get the actual user ID from the session

// const framesWithUser = await frames.query(

// Sessioning.\_getUser,

// { session },

// { user },

// );

// const sessionFrames = framesWithUser.filter(($) => $\[user] != null);

// const userIdValue = sessionFrames\[0]\[user];

// const result = await new Frames({

// ...originalFrame,

// \[user]: userIdValue,

// \[file]: originalFrame\[file],

// \[visible]: originalFrame\[visible],

// \[isVisible]: originalFrame\[visible],

// });

// console.log("result is", result);

// console.log("isvis", result\[isVisible]);

// return result;

// },

where: async (frames) => {

const originalFrame = frames\[0];

const userFrames = await frames.query(Sessioning.\_getUser, { session }, {

user,

});

if (userFrames.length === 0) return frames; // invalid session

console.log(userFrames\[0]\[user]);

return frames.map((frame) => ({

...originalFrame,

\[user]: userFrames\[0]\[user], // bind user

\[isVisible]: originalFrame\[visible], // bind isVisible

}));

},

then: actions(\[

FileTracker.setVisibility,

{

owner: user,

file,

isVisible,

},

]),

});
