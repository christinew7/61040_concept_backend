---
timestamp: 'Thu Nov 06 2025 01:43:48 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_014348.8476bfd8.md]]'
content_id: 31a45374bd1f7568a8304d89f463c1abe843a4ecb23e76c42434ed00f59605d9
---

# prompt: can you help me fix this sync:

// --- SYNCS FOR GETTING USERNAME ---

export const GetUsernameRequest: Sync = ({ request, session }) => ({

when: actions(\[

Requesting.request,

{ path: "/PasswordAuthentication/\_getUsername", session },

{ request },

]),

where: (frames) =>

frames.query(

PasswordAuthentication.\_getUsername,

{

userId:

frames.query(Sessioning.\_getUser, { session }, { user }).user.\_id,

},

{ username },

),

then: actions(\[

Requesting.respond,

{ request, username: frames.username },

]),

});

export const GetUsernameResponseSuccess: Sync = ({ request, username }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/\_getUsername" }, {

request,

}], // Match the initial request

\[PasswordAuthentication.\_getUsername, {}, { username }], // Match the successful username retrieval

),

then: actions(\[

Requesting.respond,

{ request, username },

]),

});

export const GetUsernameResponseUserNotFound: Sync = ({ request }) => ({

when: actions(

\[Requesting.request, { path: "/PasswordAuthentication/\_getUsername" }, {

request,

}],

\[PasswordAuthentication.\_getUsername, {}, {}], // Match when no username is returned (empty object)

),

then: actions(\[

Requesting.respond,

{ request, error: "User not found for the given session." },

]),

});
