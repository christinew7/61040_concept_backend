---
timestamp: 'Thu Nov 06 2025 23:11:57 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_231157.12bd76b7.md]]'
content_id: 52cc94116f95b9a8f0ae8e7c5fbfe36e5405f9281cf0df5ec746668806a8a4cc
---

# file: src/syncs/library.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { Library, Requesting, Sessioning, FileTracker } from "@concepts";

/**
 * Sync to handle a request to get all files for the logged-in user.
 */
export const GetAllFiles: Sync = ({ request, session, user, files }) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getAllFiles", session },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    return await frames.query(Library._getAllFiles, { owner: user }, { files });
  },
  then: actions([
    Requesting.respond,
    { request, files },
  ]),
});

/**
 * Sync to handle a request to get the content of a specific file.
 * This is the corrected synchronization for the reported issue.
 */
export const GetFileString: Sync = (
  { request, session, user, file, fileString },
) => ({
  when: actions([
    Requesting.request,
    // The `file` variable is captured from the request payload here
    { path: "/Library/_getFileString", session, file },
    { request },
  ]),
  where: async (frames) => {
    frames = await frames.query(Sessioning._getUser, { session }, { user });
    // **THE FIX:** Ensure the captured `file` variable is passed as an input parameter
    // to the `_getFileString` query. The pattern is `{ owner: user, file: file }`.
    return await frames.query(
      Library._getFileString,
      { owner: user, file }, // <-- Correctly passes the file ID
      { fileString },
    );
  },
  then: actions([
    Requesting.respond,
    { request, fileString },
  ]),
});

/**
 * Sync to handle a request to create a new file for the logged-in user.
 */
export const CreateFile: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/createFile", session },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    Library.createFile,
    { owner: user },
  ]),
});

/**
 * Sync to respond to the original request after a file is created.
 */
export const CreateFileResponse: Sync = ({ request, id, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/createFile" }, { request }],
    [Library.createFile, {}, { id, error }],
  ),
  then: actions([
    Requesting.respond,
    { request, id, error },
  ]),
});

/**
 * Sync to handle a request to create a library for the logged-in user.
 */
export const CreateLibrary: Sync = ({ request, session, user }) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/create", session },
    { request },
  ]),
  where: async (frames) => {
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    Library.create,
    { owner: user },
  ]),
});

/**
 * Sync to respond to the original request after a library is created.
 */
export const CreateLibraryResponse: Sync = ({ request, library, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Library/create" }, { request }],
    [Library.create, {}, { library, error }],
  ),
  then: actions([
    Requesting.respond,
    { request, library, error },
  ]),
});
```

### Explanation of the Fix

In the `GetFileString` synchronization, the `where` clause now contains this critical line:

```typescript
return await frames.query(
  Library._getFileString,
  { owner: user, file }, // <-- The `file` variable is now correctly included
  { fileString },
);
```

By adding `file` to the second argument of `.query()`, you ensure that the `file` ID captured from the `Requesting.request` is passed to the `Library._getFileString` method. The concept will now use this ID to look up the specific file in the database, resolving the bug and returning the correct content for each request.
