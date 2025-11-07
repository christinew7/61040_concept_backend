---
timestamp: 'Thu Nov 06 2025 20:34:12 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_203412.95441437.md]]'
content_id: 0bae8c13922a3758284959a16ca835bdd2dcae42c2667d5bfd19f621bd07f77c
---

# file: src/syncs/filetracker.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { FileTracker, Requesting, Sessioning } from "@concepts";

/**
 * @sync StartTrackingFileLLMRequest
 * @description When a request is made to start tracking a file using the LLM,
 * this sync authenticates the user and triggers the corresponding concept action.
 */
export const StartTrackingFileLLMRequest: Sync = (
  // Destructure all variables needed from the request and subsequent queries
  { request, session, user, file, fileInput, maxIndex },
) => ({
  when: actions([
    Requesting.request,
    {
      // FIX: Extract all necessary parameters from the request body.
      path: "/FileTracker/startTrackingUsingLLM",
      session,
      file,
      fileInput,
      maxIndex,
    },
    { request },
  ]),
  where: async (frames) => {
    // FIX: Simplify authentication. The query will return an empty set of frames
    // if the session is invalid, correctly preventing the 'then' clause from firing.
    return await frames.query(Sessioning._getUser, { session }, { user });
  },
  then: actions([
    FileTracker.startTrackingUsingLLM,
    {
      owner: user,
      file,
      fileInput,
      // FIX: Correctly map the `maxIndex` variable from the request to the
      // `fileMaxIndex` parameter required by the concept action.
      fileMaxIndex: maxIndex,
    },
  ]),
});

/**
 * @sync StartTrackingFileLLMResponse
 * @description When the file tracking action succeeds, this sync responds to the
 * original request with the ID of the newly created tracking resource.
 */
export const StartTrackingFileLLMResponse: Sync = (
  // Use a more descriptive name for the output ID.
  { request, trackedFileId },
) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, { request }],
    // FIX: Match the correct success output signature from the action, which is `{ id: ... }`.
    [FileTracker.startTrackingUsingLLM, {}, { id: trackedFileId }],
  ),
  then: actions([
    Requesting.respond,
    {
      request,
      status: "started file tracking",
      // FIX: Return the newly created ID in the response for the client.
      trackedFileId,
    },
  ]),
});

/**
 * @sync StartTrackingFileLLMResponseError
 * @description When the file tracking action fails, this sync responds to the
 * original request with the error message.
 */
export const StartTrackingFileLLMResponseError: Sync = (
  { request, error },
) => ({
  when: actions(
    [Requesting.request, { path: "/FileTracker/startTrackingUsingLLM" }, { request }],
    // This sync was already correct: it properly matches the `{ error: ... }` output.
    [FileTracker.startTrackingUsingLLM, {}, { error }],
  ),
  then: actions([
    Requesting.respond,
    { request, error },
  ]),
});
```
