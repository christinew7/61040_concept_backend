import { actions, Frames, Sync } from "@engine";
import { FileTracker, Library, Requesting, Sessioning } from "@concepts";
import { ID } from "@utils/types.ts";

/**
 * @sync DeleteLibraryRequest
 * @when Requesting.request (path: "/Library/delete", session) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.delete (owner: user)
 * @purpose Handles a request to delete the library of the logged-in user.
 */
export const DeleteLibraryRequest: Sync = ({ request, session, user }) => ({
  when: actions([Requesting.request, { path: "/Library/delete", session }, {
    request,
  }]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
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

export const CascadeFileDeletionRequest: Sync = ({ owner, file }) => ({
  when: actions([Library.delete, { owner }, {}]),
  where: async (frames) => {
    const ownerId = frames[0][owner] as ID;
    const result = await Library._getAllFiles({ owner: ownerId });

    if ("error" in result) {
      return new Frames({
        ...frames[0],
        ["error"]: "Failed to fetch files for deletion",
      });
    }

    // For each file, produce a separate frame binding `file`
    const fileFrames = result.files.map((f) => ({
      ...frames[0],
      file: f,
    }));

    return new Frames(...fileFrames);
  },
  then: actions([Library.deleteFile, { owner, file }]),
});

export const DeleteLibraryResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/delete" }, {
      request,
    }],
    [Library.delete, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
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
  when: actions([Requesting.request, {
    path: "/Library/createFile",
    session,
  }, {
    request,
  }]),
  where: async (frames) => {
    let sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    sessionFrames = sessionFrames.filter(($) => $[user] !== null);
    if (sessionFrames.length === 0) {
      return frames;
    }
    return sessionFrames;
  },
  then: actions([
    Library.createFile,
    { owner: user },
  ]),
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
    [Library.createFile, {}, { id: file }],
  ),
  then: actions([Requesting.respond, { request, id: file }]),
});

export const CreateFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/createFile" }, {
      request,
    }],
    [Library.createFile, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

/**
 * @sync DeleteFileRequest
 * @when Requesting.request (path: "/Library/deleteFile", session, file) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.deleteFile (owner: user, file)
 * @purpose Handles a request to delete a specific file from the user's library.
 */
export const DeleteFileRequest: Sync = ({ request, session, user, file }) => ({
  when: actions([Requesting.request, {
    path: "/Library/deleteFile",
    session,
    file,
  }, { request }]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.deleteFile, { owner: user, file }], [
    FileTracker.deleteTracking,
    { owner: user, file },
  ]),
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

export const DeleteFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/deleteFile" }, {
      request,
    }],
    [Library.deleteFile, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

export const StartTrackingFileLLMRequest: Sync = (
  { request, session, user, file, fileInput, fileMaxIndex, owner },
) => ({
  when: actions([
    Requesting.request,
    {
      path: "/FileTracker/startTrackingUsingLLM",
      session,
      file,
      fileInput,
      fileMaxIndex,
    },
    { request },
  ]),
  where: async (frames) => {
    // const originalFrame = frames[0];
    const framesWithUser = await frames.query(
      Sessioning._getUser,
      { session },
      { user },
    );
    const newFrames = framesWithUser.filter((f) => f[user] != null);
    return newFrames;
  },
  then: actions([
    FileTracker.startTrackingUsingLLM,
    {
      owner: user,
      file,
      fileInput,
      fileMaxIndex,
    },
    { file },
  ]),
});

export const StartTrackingFileLLMResponse: Sync = (
  { request, trackedFileId },
) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, {
      request,
    }],
    [FileTracker.startTrackingUsingLLM, {}, { id: trackedFileId }],
  ),
  then: actions([Requesting.respond, {
    request,
    trackedFileId,
    status: "started file tracking",
  }]),
});

export const StartTrackingFileLLMResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, {
      request,
    }],
    [FileTracker.startTrackingUsingLLM, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

// --- Item Management in Files ---

/**
 * @sync AddItemToFileRequest
 * @when Requesting.request (path: "/Library/addItemToFile", session, file, item) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.addItemToFile (owner: user, file, item)
 * @purpose Handles adding a string item to a specific file.
 */
export const AddItemToFileRequest: Sync = (
  { request, session, user, file, item },
) => ({
  when: actions([Requesting.request, {
    path: "/Library/addItemToFile",
    session,
    file,
    item,
  }, { request }]),
  where: async (frames) => {
    let sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    sessionFrames = sessionFrames.filter(($) => $[user] !== null);
    if (sessionFrames.length === 0) {
      console.warn(
        "[AddItemToFileRequest] Invalid session for request:",
        request,
      );
      return frames; // optionally return an error frame instead
    }
    return sessionFrames;
  },
  then: actions([Library.addItemToFile, { owner: user, file, item }]),
});

export const AddItemToFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/addItemToFile" }, { request }],
    [Library.addItemToFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request }]),
});

export const AddItemToFileError: Sync = ({ request, error }) => ({
  when: actions(
    // The original request must be in the same flow
    [Requesting.request, { path: "/Library/addItemToFile" }, { request }],
    // This matches the ERROR case, where the result contains an 'error' field
    [Library.addItemToFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

/**
 * @sync ModifyItemInFileRequest
 * @when Requesting.request (path: "/Library/modifyItemInFile", session, file, index, newItem) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.modifyItemInFile (owner: user, file, index, newItem)
 * @purpose Handles modifying a string item at a specific index in a file.
 */
export const ModifyItemInFileRequest: Sync = (
  { request, session, user, file, index, newItem },
) => ({
  when: actions([Requesting.request, {
    path: "/Library/modifyItemInFile",
    session,
    file,
    index,
    newItem,
  }, { request }]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.modifyItemInFile, {
    owner: user,
    file,
    index,
    newItem,
  }]),
});

export const ModifyItemInFileResponse: Sync = ({ request, file }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/modifyItemInFile" }, { request }],
  ),
  then: actions([Requesting.respond, { request, file }]),
});

export const ModifyItemInFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/modifyItemInFile" }, {
      request,
    }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

/**
 * @sync RemoveItemFromFileRequest
 * @when Requesting.request (path: "/Library/removeItemFromFile", session, file, index) : (request)
 * @where in Sessioning: user of session is user
 * @then Library.removeItemFromFile (owner: user, file, index)
 * @purpose Handles removing a string item from a specific index in a file.
 */
export const RemoveItemFromFileRequest: Sync = (
  { request, session, user, file, index },
) => ({
  when: actions([Requesting.request, {
    path: "/Library/removeItemFromFile",
    session,
    file,
    index,
  }, { request }]),
  where: async (frames) =>
    await frames.query(Sessioning._getUser, { session }, { user }),
  then: actions([Library.removeItemFromFile, { owner: user, file, index }]),
});

export const removeItemFromFileResponse: Sync = ({ request, file }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/removeItemFromFile" }, { request }],
  ),
  then: actions([Requesting.respond, { request, file }]),
});

export const removeItemFromFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/removeItemFromFile" }, {
      request,
    }],
    [Library.removeItemFromFile, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

// --- Set Image to File ---

/**
 * @sync SetImageToFileRequest
 * @when Requesting.request (path: "/library/files/setImage", session, file, image) : (request)
 * @then Library.setImageToFile (owner: user, file, image)
 * @purpose Maps an incoming HTTP request to set an image for a file in the authenticated user's library.
 */
export const SetImageToFileRequest: Sync = (
  { request, session, owner, user, file, image },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/setImageToFile", session, file, image },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (sessionFrames.length === 0) {
      return new Frames({
        ...originalFrame,
        error: "Invalid session",
      });
    }
    const userIdValue = sessionFrames[0][user];

    frames = await new Frames({
      ...originalFrame,
      [owner]: userIdValue,
    });

    return frames;
  },
  then: actions([
    Library.setImageToFile,
    { owner, file, image },
  ]),
});

/**
 * @sync SetImageToFileResponse
 * @when Requesting.request (path: "/Library/setImageToFile") : (request)
 *   AND Library.setImageToFile () : ()
 * @then Requesting.respond (request, status: "image_set")
 * @purpose Responds to a successful setting of an image for a file.
 */
export const SetImageToFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/setImageToFile" }, { request }],
    [Library.setImageToFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "image_set" }]),
});

/**
 * @sync SetImageToFileResponseError
 * @when Requesting.request (path: "/Library/setImageToFile") : (request)
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
 * @when Requesting.request (path: "/Library/clearImageFromFile", session, file) : (request)
 * @then Library.clearImageFromFile (owner: user, file)
 * @purpose Maps an incoming HTTP request to clear the image for a file in the authenticated user's library.
 */
export const ClearImageFromFileRequest: Sync = (
  { request, session, user, file },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/clearImageFromFile", session, file },
    { request },
  ]),
  where: async (frames) => {
    // const originalFrame = frames[0];
    const authenticatedFrames = await frames.query(Sessioning._getUser, {
      session,
    }, { user });

    if (authenticatedFrames.length === 0) {
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
 * @when Requesting.request (path: "/Library/clearImageFromFile") : (request)
 *   AND Library.clearImageFromFile () : ()
 * @then Requesting.respond (request, status: "image_cleared")
 * @purpose Responds to a successful clearing of an image for a file.
 */
export const ClearImageFromFileResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/clearImageFromFile" }, { request }],
    [Library.clearImageFromFile, {}, {}],
  ),
  then: actions([Requesting.respond, { request, status: "image_cleared" }]),
});

/**
 * @sync ClearImageFromFileResponseError
 * @when Requesting.request (path: "/Library/clearImageFromFile") : (request)
 *   AND Library.clearImageFromFile () : (error)
 * @then Requesting.respond (request, error)
 * @purpose Responds to a failed attempt to clear an image for a file.
 */
export const ClearImageFromFileResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/clearImageFromFile" }, { request }],
    [Library.clearImageFromFile, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

//-- SYNCS FOR QUERIES --//

export const GetAllFilesRequest: Sync = (
  { request, session, user, files },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getAllFiles", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (sessionFrames.length === 0) {
      return new Frames();
    }
    const userIdValue = sessionFrames[0][user];

    const result = await Library._getAllFiles({ owner: userIdValue });

    return new Frames({
      ...originalFrame,
      [files]: result.files,
    });
  },
  then: actions([
    Requesting.respond,
    { request, files },
  ]),
});

/**
 * @sync GetAllFilesAuthError
 * @when Requesting.request (path: "/Library/_getAllFiles", session) : (request)
 * @where if session invalid, respond with error
 * @then Requesting.respond (request, error)
 */
export const GetAllFilesAuthError: Sync = (
  { request, session, userId, error },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getAllFiles", session },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      userId,
    });
    if (sessionFrames.length === 0) {
      return new Frames({
        ...originalFrame,
        [error]: "Invalid session. Please log in again.",
      });
    }
    return new Frames();
  },
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});

export const GetFileStringRequest: Sync = (
  { request, session, user, file, fileString },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getFileString", session, file },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];

    // Get the actual user ID from the session
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, {
      user,
    });
    if (sessionFrames.length === 0) {
      return new Frames({
        ...originalFrame,
        error: "Invalid session",
      });
    }
    const userIdValue = sessionFrames[0][user];

    const result = await Library._getFileString({
      owner: userIdValue,
      file: originalFrame[file],
    });

    frames = await new Frames({
      ...originalFrame,
      [fileString]: result.fileString,
    });

    return frames;
  },
  then: actions([
    Requesting.respond,
    {
      request,
      fileString,
    },
  ]),
});
