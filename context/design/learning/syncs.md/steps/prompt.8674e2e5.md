---
timestamp: 'Thu Nov 06 2025 19:53:48 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_195348.90067cc8.md]]'
content_id: 8674e2e53fd246a351ca28369f89c37e90dde255456904ccad44b30cd7517e6a
---

# prompt:

can you help me fix the sync for addItemToFile in Library?/\*\*

* @sync AddItemToFileRequest

* @when Requesting.request (path: "/Library/addItemToFile", session, file, item) : (request)

* @where in Sessioning: user of session is user

* @then Library.addItemToFile (owner: user, file, item)

* @purpose Handles adding a string item to a specific file.

\*/

export const AddItemToFileRequest: Sync = (

{ request, session, user, file, item },

) => ({

when: actions(\[Requesting.request, {

path: "/Library/addItemToFile",

session,

file,

item,

}, { request }]),

where: async (frames) =>

await frames.query(Sessioning.\_getUser, { session }, { user }),

then: actions(\[Library.addItemToFile, { owner: user, file, item }]),

});
