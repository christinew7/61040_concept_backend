---
timestamp: 'Thu Nov 06 2025 11:35:01 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_113501.120521d6.md]]'
content_id: eeaf2cd07aa947f72c93f7ec99ced94e29a8a68c79f51c73a530a88d4bfb7fad
---

# file: src/syncs/library.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { Library, Requesting, Sessioning } from "@concepts";

// --- Library Management ---

/**
 * @sync CreateLibraryRequest
 * @when Requesting.request (path: "/Library/create", session) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.create (owner: user)
 * @purpose Handles a request to create a new library for the logged-in user.
 */
export const CreateLibraryRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Library/create", session }, { request }]),
  where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.create, { owner: user }]),
});

/**
 * @sync CreateLibraryResponse
 * @when Requesting.request (path: "/Library/create") : (request)
 *   AND Library.create () : (library)
 * @then Requesting.respond (request, library)
 * @purpose Responds to a successful library creation request with the new library's ID.
 */
export const CreateLibraryResponse: Sync = ({ request, library }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/create" }, { request }],
    [Library.create, {}, { library }],
  ),
  then: actions([Requesting.respond, { request, library }]),
});

/**
 * @sync CreateLibraryResponseError
 * @when Requesting.request (path: "/Library/create") : (request)
 *   AND Library.create () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed library creation request with an error.
 */
export const CreateLibraryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/create" }, { request }],
    [Library.create, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync DeleteLibraryRequest
 * @when Requesting.request (path: "/Library/delete", session) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.delete (owner: user)
 * @purpose Handles a request to delete the library of the logged-in user.
 */
export const DeleteLibraryRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Library/delete", session }, { request }]),
  where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.delete, { owner: user }]),
});

/**
 * @sync DeleteLibraryResponse
 * @when Requesting.request (path: "/Library/delete") : (request)
 *   AND Library.delete () : ()
 * @then Requesting.respond (request, status: "deleted")
 * @purpose Responds to a successful library deletion request.
 */
export const DeleteLibraryResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/delete" }, { request }],
    [Library.delete, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "deleted" }]),
});

// --- File Management ---

/**
 * @sync CreateFileRequest
 * @when Requesting.request (path: "/Library/createFile", session) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.createFile (owner: user)
 * @purpose Handles a request to create a new, empty file in the user's library.
 */
export const CreateFileRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Library/createFile", session }, { request }]),
  where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.createFile, { owner: user }]),
});

/**
 * @sync CreateFileResponse
 * @when Requesting.request (path: "/Library/createFile") : (request)
 *   AND Library.createFile () : (file)
 * @then Requesting.respond (request, file)
 * @purpose Responds with the ID of the newly created file.
 */
export const CreateFileResponse: Sync = ({ request, file }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/createFile" }, { request }],
    [Library.createFile, {}, { file }],
  ),
  then: actions([Requesting.respond, { request, file }]),
});

/**
 * @sync DeleteFileRequest
 * @when Requesting.request (path: "/Library/deleteFile", session, file) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.deleteFile (owner: user, file)
 * @purpose Handles a request to delete a specific file from the user's library.
 */
export const DeleteFileRequest: Sync = ({ request, session, user, file }) => ({
  when: actions([Requesting.request, { path: "/Library/deleteFile", session, file }, { request }]),
  where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.deleteFile, { owner: user, file }]),
});

/**
 * @sync DeleteFileResponse
 * @when Requesting.request (path: "/Library/deleteFile") : (request)
 *   AND Library.deleteFile () : ()
 * @then Requesting.respond (request, status: "deleted")
 * @purpose Confirms successful deletion of a file.
 */
export const DeleteFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/deleteFile" }, { request }],
    [Library.deleteFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "deleted" }]),
});

/**
 * @sync GetAllFilesRequest
 * @when Requesting.request (path: "/Library/getAllFiles", session) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.getAllFiles (owner: user)
 * @purpose Handles a request to retrieve all files for the logged-in user.
 */
export const GetAllFilesRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Library/getAllFiles", session }, { request }]),
  where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.getAllFiles, { owner: user }]),
});

/**
 * @sync GetAllFilesResponse
 * @when Requesting.request (path: "/Library/getAllFiles") : (request)
 *   AND Library.getAllFiles () : (files)
 * @then Requesting.respond (request, files)
 * @purpose Responds with the set of files belonging to the user.
 */
export const GetAllFilesResponse: Sync = ({ request, files }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/getAllFiles" }, { request }],
    [Library.getAllFiles, {}, { files }],
  ),
  then: actions([Requesting.respond, { request, files }]),
});


// --- Item Management in Files ---

/**
 * @sync AddItemToFileRequest
 * @when Requesting.request (path: "/Library/addItemToFile", session, file, item) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.addItemToFile (owner: user, file, item)
 * @purpose Handles adding a string item to a specific file.
 */
export const AddItemToFileRequest: Sync = ({ request, session, user, file, item }) => ({
    when: actions([Requesting.request, { path: "/Library/addItemToFile", session, file, item }, { request }]),
    where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([Library.addItemToFile, { owner: user, file, item }]),
});

/**
 * @sync ModifyItemInFileRequest
 * @when Requesting.request (path: "/Library/modifyItemInFile", session, file, index, newItem) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.modifyItemInFile (owner: user, file, index, newItem)
 * @purpose Handles modifying a string item at a specific index in a file.
 */
export const ModifyItemInFileRequest: Sync = ({ request, session, user, file, index, newItem }) => ({
    when: actions([Requesting.request, { path: "/Library/modifyItemInFile", session, file, index, newItem }, { request }]),
    where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([Library.modifyItemInFile, { owner: user, file, index, newItem }]),
});

/**
 * @sync RemoveItemFromFileRequest
 * @when Requesting.request (path: "/Library/removeItemFromFile", session, file, index) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.removeItemFromFile (owner: user, file, index)
 * @purpose Handles removing a string item from a specific index in a file.
 */
export const RemoveItemFromFileRequest: Sync = ({ request, session, user, file, index }) => ({
    when: actions([Requesting.request, { path: "/Library/removeItemFromFile", session, file, index }, { request }]),
    where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([Library.removeItemFromFile, { owner: user, file, index }]),
});

// --- Image Management in Files ---

/**
 * @sync SetImageToFileRequest
 * @when Requesting.request (path: "/Library/setImageToFile", session, file, image) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.setImageToFile (owner: user, file, image)
 * @purpose Handles setting the image URL for a specific file.
 */
export const SetImageToFileRequest: Sync = ({ request, session, user, file, image }) => ({
    when: actions([Requesting.request, { path: "/Library/setImageToFile", session, file, image }, { request }]),
    where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([Library.setImageToFile, { owner: user, file, image }]),
});

/**
 * @sync ClearImageFromFileRequest
 * @when Requesting.request (path: "/Library/clearImageFromFile", session, file) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.clearImageFromFile (owner: user, file)
 * @purpose Handles clearing the image URL from a specific file.
 */
export const ClearImageFromFileRequest: Sync = ({ request, session, user, file }) => ({
    when: actions([Requesting.request, { path: "/Library/clearImageFromFile", session, file }, { request }]),
    where: async (frames) => await frames.query(Sessioning._getUser, { session }, { user }),
    then: actions([Library.clearImageFromFile, { owner: user, file }]),
});


// --- Generic Success/Error Responders for Actions without specific return values ---

const simpleActions = [
    "addItemToFile",
    "modifyItemInFile",
    "removeItemFromFile",
    "setImageToFile",
    "clearImageFromFile",
];

// This generates success responses for all simple actions that don't return data.
export const SimpleActionSuccessResponses: Sync[] = simpleActions.map(action => 
    ({ request }) => ({
        when: actions(
            [Requesting.request, { path: `/Library/${action}` }, { request }],
            [Library[action as keyof typeof Library], {}, {}],
        ),
        then: actions([Requesting.respond, { request, status: "success" }]),
    })
);

// This generates error responses for all actions in the Library concept.
export const AllLibraryActionErrorResponses: Sync[] = Object.keys(Library)
    .filter(key => !key.startsWith("_")) // Exclude queries
    .map(action => 
    ({ request, error }) => ({
        when: actions(
            [Requesting.request, { path: `/Library/${action}` }, { request }],
            [Library[action as keyof typeof Library], {}, { error }],
        ),
        then: actions([Requesting.respond, { request, error }]),
    })
);
```
