---
timestamp: 'Thu Nov 06 2025 00:07:21 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_000721.99f6c3c7.md]]'
content_id: 4e29cf4e1526d123abf66e9312c4fbc6b5186699c392943e7c0aab0004d95fb6
---

# context: // file: src/syncs/library.sync.ts

import { actions, Sync, Frames } from "@engine";
import { Library, Requesting } from "@concepts"; // Import Library concept

/\*\*

* @sync ListMyFilesRequest
* @when Requesting.request (path: "/my-files", user) : (request)
* @then Library.\_getAllFiles (owner: user)
* @purpose Handles an HTTP request to list all files for a given user.
* ```
       Assumes the 'user' ID is directly passed in the request body.
  ```

\*/
export const ListMyFilesRequest: Sync = ({ request, user }) => ({
when: actions(\[
Requesting.request,
{ path: "/my-files", user }, // Expect 'user' to be provided in the request body
{ request },
]),
// No 'where' clause here; \_getAllFiles itself will handle if the library doesn't exist
// by returning an error, which the subsequent sync will catch.
then: actions(\[
Library.\_getAllFiles,
{ owner: user },
]),
});

/\*\*

* @sync ListMyFilesResponse
* @when Requesting.request (path: "/my-files") : (request)
* AND Library.\_getAllFiles () : (files)
* @then Requesting.respond (request, files)
* @purpose Responds to a successful request to list files with the retrieved file data.
  \*/
  export const ListMyFilesResponse: Sync = ({ request, files }) => ({
  when: actions(
  \[Requesting.request, { path: "/my-files" }, { request }],
  \[Library.\_getAllFiles, {}, { files }], // Catches the successful return from \_getAllFiles
  ),
  then: actions(\[
  Requesting.respond,
  { request, files },
  ]),
  });

/\*\*

* @sync ListMyFilesResponseError
* @when Requesting.request (path: "/my-files") : (request)
* AND Library.\_getAllFiles () : (error)
* @then Requesting.respond (request, error)
* @purpose Responds to a failed request to list files with the error message.
  \*/
  export const ListMyFilesResponseError: Sync = ({ request, error }) => ({
  when: actions(
  \[Requesting.request, { path: "/my-files" }, { request }],
  \[Library.\_getAllFiles, {}, { error }], // Catches the error return from \_getAllFiles
  ),
  then: actions(\[
  Requesting.respond,
  { request, error },
  ]),
  });

will this limit me so i can only get the files if i am logged in as that user?
