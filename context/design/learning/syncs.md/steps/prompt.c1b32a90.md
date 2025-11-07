---
timestamp: 'Fri Nov 07 2025 13:18:04 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131804.03696a23.md]]'
content_id: c1b32a90f54573482f8d90b68a4b4b10b4e7ae0ebafdc01d5a3c355d61432710
---

# prompt:  why is my isVisible returning undefined when the reqest passes the visible boolean as a boolealn

Requesting.request {
session: '019a5d21-c489-7cf6-a9ac-2892d8447101',
file: '019a5d3f-0ae3-71d8-88e0-74351df88a18',
visible: false,
path: '/FileTracker/setVisibility'
} => { request: '019a5f89-432e-779d-8ca0-90372e5fd09e' }

019a0363-778d-7ee3-a5d1-07930b7c03cf
resutl Frames(1) \[
{
\[Symbol(flow)]: "fa6e6843-f666-47df-8577-8036993f8e06",
\[Symbol(session)]: "019a5d21-c489-7cf6-a9ac-2892d8447101",
\[Symbol(file)]: "019a5d3f-0ae3-71d8-88e0-74351df88a18",
\[Symbol(visible)]: false,
\[Symbol(request)]: "019a5f89-432e-779d-8ca0-90372e5fd09e",
\[Symbol(action\_0)]: "4e3abf3e-d0fd-493e-ae1c-426566d9844e",
\[Symbol(user)]: "019a0363-778d-7ee3-a5d1-07930b7c03cf"
}
]
in set 019a0363-778d-7ee3-a5d1-07930b7c03cf 019a5d3f-0ae3-71d8-88e0-74351df88a18 undefined

FileTracker.setVisibility {
owner: '019a0363-778d-7ee3-a5d1-07930b7c03cf',
file: '019a5d3f-0ae3-71d8-88e0-74351df88a18',
isVisible: false
} => { error: 'Invalid visible value: undefined. Must be a boolean.' }

Requesting.respond {
request: '019a5f89-432e-779d-8ca0-90372e5fd09e',
error: 'Invalid visible value: undefined. Must be a boolean.'
} => { request: '019a5f89-432e-779d-8ca0-90372e5fd09e' }

export const SetVisibilityRequest: Sync = (

{ request, session, user, file, visible },

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

if (userFrames.length === 0) return new Frames(); // invalid session

console.log(userFrames\[0]\[user]);

const result = new Frames({

...originalFrame,

\[user]: userFrames\[0]\[user], // bind user

\[visible]: originalFrame\[visible], // bind isVisible

});

console.log("resutl", result);

return result;

},

then: actions(\[

FileTracker.setVisibility,

{

owner: user,

file,

isVisible: visible,

},

]),

});
