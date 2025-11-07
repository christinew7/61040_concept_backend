---
timestamp: 'Thu Nov 06 2025 12:06:54 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_120654.8686d415.md]]'
content_id: 39dc68fa586cbe275179a8cebdccecb140b0b9130b93caca45d8a66becd139e6
---

# file: src/syncs/library.sync.ts

```typescript
import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, Library } from "@concepts";
import { ID } from "@utils/types.ts"; // Assuming ID is also needed for generic types

/**
 * Helper function to authenticate a session and return the user ID.
 * This can be reused across multiple where clauses.
 */
async function authenticateSession(
  frames: Frames,
  sessionSymbol: symbol,
  userSymbol: symbol,
  originalRequestFrame: Record<PropertyKey, unknown>,
): Promise<Frames> {
  const sessionFrames = await frames.query(
    Sessioning._getUser,
    { session: frames[0][sessionSymbol] as ID }, // Assuming session is on the first frame
    { user: userSymbol },
  );

  if (sessionFrames.length === 0) {
    // Invalid session, return an error frame
    return new Frames({
      ...originalRequestFrame,
      ["error"]: "Invalid session. Please log in again.",
    });
  }
  return sessionFrames;
}

// --- Create Library ---

/**
 * @sync CreateLibraryRequest
 * @when Requesting.request (path: "/library/create", session) : (request)
 * @then Library.create (owner: user)
 * @purpose Maps an incoming HTTP request to create a library for the authenticated user.
 */
export const CreateLibraryRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/create", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames; // Propagate error frame if authentication failed
    }
    // Now 'user' is bound in authenticatedFrames
    return authenticatedFrames;
  },
  then: actions([
    Library.create,
    { owner: user },
  ]),
});

/**
 * @sync CreateLibraryResponse
 * @when Requesting.request (path: "/library/create") : (request)
 *   AND Library.create () : (library)
 * @then Requesting.respond (request, library)
 * @purpose Responds to a successful library creation request with the new library's ID.
 */
export const CreateLibraryResponse: Sync = ({ request, library }) => ({
  when: actions(
    [Requesting.request, { path: "/library/create" }, { request }],
    [Library.create, {}, { library }],
  ),
  then: actions([Requesting.respond, { request, library }]),
});

/**
 * @sync CreateLibraryResponseError
 * @when Requesting.request (path: "/library/create") : (request)
 *   AND Library.create () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed library creation request with an error message.
 */
export const CreateLibraryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/create" }, { request }],
    [Library.create, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Delete Library ---

/**
 * @sync DeleteLibraryRequest
 * @when Requesting.request (path: "/library/delete", session) : (request)
 * @then Library.delete (owner: user)
 * @purpose Maps an incoming HTTP request to delete a library for the authenticated user.
 */
export const DeleteLibraryRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/delete", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.delete,
    { owner: user },
  ]),
});

/**
 * @sync DeleteLibraryResponse
 * @when Requesting.request (path: "/library/delete") : (request)
 *   AND Library.delete () : ()
 * @then Requesting.respond (request, status: "deleted")
 * @purpose Responds to a successful library deletion request.
 */
export const DeleteLibraryResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/delete" }, { request }],
    [Library.delete, {}, {}], // No return value for successful delete
  ),
  then: actions([Requesting.respond, { request, status: "deleted" }]),
});

/**
 * @sync DeleteLibraryResponseError
 * @when Requesting.request (path: "/library/delete") : (request)
 *   AND Library.delete () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed library deletion request with an error message.
 */
export const DeleteLibraryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/delete" }, { request }],
    [Library.delete, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Create File ---

/**
 * @sync CreateFileRequest
 * @when Requesting.request (path: "/library/files/create", session) : (request)
 * @then Library.createFile (owner: user)
 * @purpose Maps an incoming HTTP request to create a new file in the authenticated user's library.
 */
export const CreateFileRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/create", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.createFile,
    { owner: user },
  ]),
});

/**
 * @sync CreateFileResponse
 * @when Requesting.request (path: "/library/files/create") : (request)
 *   AND Library.createFile () : (file)
 * @then Requesting.respond (request, file)
 * @purpose Responds to a successful file creation request with the new file's ID.
 */
export const CreateFileResponse: Sync = ({ request, file }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/create" }, { request }],
    [Library.createFile, {}, { file }],
  ),
  then: actions([Requesting.respond, { request, file }]),
});

/**
 * @sync CreateFileResponseError
 * @when Requesting.request (path: "/library/files/create") : (request)
 *   AND Library.createFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed file creation request with an error message.
 */
export const CreateFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/create" }, { request }],
    [Library.createFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Add Item to File ---

/**
 * @sync AddItemToFileRequest
 * @when Requesting.request (path: "/library/files/addItem", session, file, item) : (request)
 * @then Library.addItemToFile (owner: user, file, item)
 * @purpose Maps an incoming HTTP request to add an item to a file in the authenticated user's library.
 */
export const AddItemToFileRequest: Sync = ({ request, session, user, file, item }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/addItem", session, file, item },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.addItemToFile,
    { owner: user, file, item },
  ]),
});

/**
 * @sync AddItemToFileResponse
 * @when Requesting.request (path: "/library/files/addItem") : (request)
 *   AND Library.addItemToFile () : ()
 * @then Requesting.respond (request, status: "item_added")
 * @purpose Responds to a successful addition of an item to a file.
 */
export const AddItemToFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/addItem" }, { request }],
    [Library.addItemToFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "item_added" }]),
});

/**
 * @sync AddItemToFileResponseError
 * @when Requesting.request (path: "/library/files/addItem") : (request)
 *   AND Library.addItemToFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to add an item to a file.
 */
export const AddItemToFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/addItem" }, { request }],
    [Library.addItemToFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Modify Item in File ---

/**
 * @sync ModifyItemInFileRequest
 * @when Requesting.request (path: "/library/files/modifyItem", session, file, index, newItem) : (request)
 * @then Library.modifyItemInFile (owner: user, file, index, newItem)
 * @purpose Maps an incoming HTTP request to modify an item in a file in the authenticated user's library.
 */
export const ModifyItemInFileRequest: Sync = (
  { request, session, user, file, index, newItem },
) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/modifyItem", session, file, index, newItem },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.modifyItemInFile,
    { owner: user, file, index, newItem },
  ]),
});

/**
 * @sync ModifyItemInFileResponse
 * @when Requesting.request (path: "/library/files/modifyItem") : (request)
 *   AND Library.modifyItemInFile () : ()
 * @then Requesting.respond (request, status: "item_modified")
 * @purpose Responds to a successful modification of an item in a file.
 */
export const ModifyItemInFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/modifyItem" }, { request }],
    [Library.modifyItemInFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "item_modified" }]),
});

/**
 * @sync ModifyItemInFileResponseError
 * @when Requesting.request (path: "/library/files/modifyItem") : (request)
 *   AND Library.modifyItemInFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to modify an item in a file.
 */
export const ModifyItemInFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/modifyItem" }, { request }],
    [Library.modifyItemInFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Remove Item from File ---

/**
 * @sync RemoveItemFromFileRequest
 * @when Requesting.request (path: "/library/files/removeItem", session, file, index) : (request)
 * @then Library.removeItemFromFile (owner: user, file, index)
 * @purpose Maps an incoming HTTP request to remove an item from a file in the authenticated user's library.
 */
export const RemoveItemFromFileRequest: Sync = (
  { request, session, user, file, index },
) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/removeItem", session, file, index },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.removeItemFromFile,
    { owner: user, file, index },
  ]),
});

/**
 * @sync RemoveItemFromFileResponse
 * @when Requesting.request (path: "/library/files/removeItem") : (request)
 *   AND Library.removeItemFromFile () : ()
 * @then Requesting.respond (request, status: "item_removed")
 * @purpose Responds to a successful removal of an item from a file.
 */
export const RemoveItemFromFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/removeItem" }, { request }],
    [Library.removeItemFromFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "item_removed" }]),
});

/**
 * @sync RemoveItemFromFileResponseError
 * @when Requesting.request (path: "/library/files/removeItem") : (request)
 *   AND Library.removeItemFromFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to remove an item from a file.
 */
export const RemoveItemFromFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/removeItem" }, { request }],
    [Library.removeItemFromFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Set Image to File ---

/**
 * @sync SetImageToFileRequest
 * @when Requesting.request (path: "/library/files/setImage", session, file, image) : (request)
 * @then Library.setImageToFile (owner: user, file, image)
 * @purpose Maps an incoming HTTP request to set an image for a file in the authenticated user's library.
 */
export const SetImageToFileRequest: Sync = ({ request, session, user, file, image }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/setImage", session, file, image },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.setImageToFile,
    { owner: user, file, image },
  ]),
});

/**
 * @sync SetImageToFileResponse
 * @when Requesting.request (path: "/library/files/setImage") : (request)
 *   AND Library.setImageToFile () : ()
 * @then Requesting.respond (request, status: "image_set")
 * @purpose Responds to a successful setting of an image for a file.
 */
export const SetImageToFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/setImage" }, { request }],
    [Library.setImageToFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "image_set" }]),
});

/**
 * @sync SetImageToFileResponseError
 * @when Requesting.request (path: "/library/files/setImage") : (request)
 *   AND Library.setImageToFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to set an image for a file.
 */
export const SetImageToFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/setImage" }, { request }],
    [Library.setImageToFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Clear Image from File ---

/**
 * @sync ClearImageFromFileRequest
 * @when Requesting.request (path: "/library/files/clearImage", session, file) : (request)
 * @then Library.clearImageFromFile (owner: user, file)
 * @purpose Maps an incoming HTTP request to clear the image for a file in the authenticated user's library.
 */
export const ClearImageFromFileRequest: Sync = ({ request, session, user, file }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/clearImage", session, file },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.clearImageFromFile,
    { owner: user, file },
  ]),
});

/**
 * @sync ClearImageFromFileResponse
 * @when Requesting.request (path: "/library/files/clearImage") : (request)
 *   AND Library.clearImageFromFile () : ()
 * @then Requesting.respond (request, status: "image_cleared")
 * @purpose Responds to a successful clearing of an image for a file.
 */
export const ClearImageFromFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/clearImage" }, { request }],
    [Library.clearImageFromFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "image_cleared" }]),
});

/**
 * @sync ClearImageFromFileResponseError
 * @when Requesting.request (path: "/library/files/clearImage") : (request)
 *   AND Library.clearImageFromFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to clear an image for a file.
 */
export const ClearImageFromFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/clearImage" }, { request }],
    [Library.clearImageFromFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Delete File ---

/**
 * @sync DeleteFileRequest
 * @when Requesting.request (path: "/library/files/delete", session, file) : (request)
 * @then Library.deleteFile (owner: user, file)
 * @purpose Maps an incoming HTTP request to delete a file from the authenticated user's library.
 */
export const DeleteFileRequest: Sync = ({ request, session, user, file }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/delete", session, file },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.deleteFile,
    { owner: user, file },
  ]),
});

/**
 * @sync DeleteFileResponse
 * @when Requesting.request (path: "/library/files/delete") : (request)
 *   AND Library.deleteFile () : ()
 * @then Requesting.respond (request, status: "file_deleted")
 * @purpose Responds to a successful deletion of a file.
 */
export const DeleteFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/delete" }, { request }],
    [Library.deleteFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "file_deleted" }]),
});

/**
 * @sync DeleteFileResponseError
 * @when Requesting.request (path: "/library/files/delete") : (request)
 *   AND Library.deleteFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to delete a file.
 */
export const DeleteFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/delete" }, { request }],
    [Library.deleteFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Get All Files (Query-like Action) ---

/**
 * @sync GetAllFilesRequest
 * @when Requesting.request (path: "/library/files/all", session) : (request)
 * @then Library.getAllFiles (owner: user)
 * @purpose Maps an incoming HTTP request to retrieve all files for the authenticated user.
 */
export const GetAllFilesRequest: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/library/files/all", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const authenticatedFrames = await authenticateSession(
      frames,
      session,
      user,
      originalFrame,
    );
    if (authenticatedFrames.length === 0 || authenticatedFrames[0].error) {
      return authenticatedFrames;
    }
    return authenticatedFrames;
  },
  then: actions([
    Library.getAllFiles,
    { owner: user },
  ]),
});

/**
 * @sync GetAllFilesResponse
 * @when Requesting.request (path: "/library/files/all") : (request)
 *   AND Library.getAllFiles () : (files)
 * @then Requesting.respond (request, files)
 * @purpose Responds to a successful request for all files with the list of files.
 */
export const GetAllFilesResponse: Sync = ({ request, files }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/all" }, { request }],
    [Library.getAllFiles, {}, { files }],
  ),
  then: actions([Requesting.respond, { request, files }]),
});

/**
 * @sync GetAllFilesResponseError
 * @when Requesting.request (path: "/library/files/all") : (request)
 *   AND Library.getAllFiles () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed request for all files with an error message.
 */
export const GetAllFilesResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/library/files/all" }, { request }],
    [Library.getAllFiles, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```
