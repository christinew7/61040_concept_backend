---
timestamp: 'Thu Nov 06 2025 00:14:51 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_001451.f79b3688.md]]'
content_id: b68337de7d85161eda74cc851c1dfc9bacca296a291361feab2bb999131ca884
---

# context:

export const ListMyFilesRequest: Sync = (

{ request, session, user }, // 'session' comes from the request, 'user' will be bound in the 'where'

) => ({

when: actions(\[

Requesting.request,

{ path: "/my-files", session }, // Expect 'session' to be provided in the request body

{ request },

]),

where: async (frames) => {

// For each incoming request frame, validate the 'session' (User ID) using PasswordAuthentication

frames = await frames.query(

PasswordAuthentication.\_getUserId,

{ userId: session }, // Pass the 'session' from the request as 'userId' to the query

{ user }, // If successful, bind the validated User ID to the 'user' variable

);
