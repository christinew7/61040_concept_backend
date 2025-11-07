---
timestamp: 'Thu Nov 06 2025 11:54:27 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_115427.f7500357.md]]'
content_id: 2cf7eedf22001ffe84721abd7f3559e07e67d98fd08495bed77104abb3e29420
---

# context: /\*\*

* @sync DeleteLibraryRequest

* @when Requesting.request (path: "/Library/delete", session) : (request)

* @where in Sessioning: user of session is user

* @then Library.delete (owner: user)

* @purpose Handles a request to delete the library of the logged-in user.

\*/

export const DeleteLibraryRequest: Sync = ({ request, session, user }) => ({

when: actions(\[Requesting.request, { path: "/Library/delete", session }, {

request,

}]),

where: async (frames) =>

await frames.query(Sessioning.\_getUser, { session }, { user }),

then: actions(\[Library.delete, { owner: user }]),

});

/\*\*

* @sync DeleteLibraryResponse

* @when Requesting.request (path: "/Library/delete") : (request)

* AND Library.delete () : ()

* @then Requesting.respond (request, status: "deleted")

* @purpose Responds to a successful library deletion request.

\*/

export const DeleteLibraryResponse: Sync = ({ request }) => ({

when: actions(

\[Requesting.request, { path: "/Library/delete" }, { request }],

\[Library.delete, {}, {}],

),

then: actions(\[Requesting.respond, { request, status: "deleted" }]),

});

export const DeleteLibraryResponseError: Sync = ({ request, error }) => ({

when: actions(

\[Requesting.request, { path: "/Library/delete" }, {

request,

}],

\[Library.delete, {}, { error }],

),

then: actions(\[

Requesting.respond,

{ request, error },

]),

});
