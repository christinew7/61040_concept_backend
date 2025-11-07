---
timestamp: 'Thu Nov 06 2025 21:44:37 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_214437.3136ea38.md]]'
content_id: b4bc8870110920a453f0d8a5775d3fc274dfa5d82ca7fd48d737505a7f7a0113
---

# file: src/syncs/filetracker.sync.ts

```typescript
import { actions, Sync, Frames } from "@engine";
import { Requesting, Sessioning, FileTracker } from "@concepts";

/**
 * Handles a request to get the current tracked item index for a given file.
 * It authenticates the user via their session before querying the FileTracker.
 */
export const GetCurrentItemRequest: Sync = ({ request, session, user, file, index, error }) => ({
  // 1. WHEN a request comes in for the correct path with a session and file ID.
  when: actions([
    Requesting.request,
    {
      path: "/FileTracker/_getCurrentItem",
      session,
      file,
    },
    { request },
  ]),

  // 2. WHERE we can find a user for the session, AND that user is tracking the file.
  where: async (frames) => {
    // We chain queries. The output of one becomes the input for the next.
    // If any query in the chain fails to find a match, the final result will be an empty set of frames.
    const successfulFrames = await frames
      .query(Sessioning._getUser, { session }, { user })
      .query(FileTracker._getCurrentItem, { owner: user, file }, { index });
    
    // If the chain was successful, we'll have frames with an 'index'.
    if (successfulFrames.length > 0) {
      return successfulFrames;
    }

    // If the chain failed, the request will time out. Let's provide a helpful error.
    // We check which step failed.
    const sessionFrames = await frames.query(Sessioning._getUser, { session }, { user });
    if (sessionFrames.length === 0) {
      // The session was invalid. Respond with an auth error.
      // We take the original request frame and add an 'error' binding to it.
      return new Frames({ ...frames[0], [error]: "Invalid session. Please log in again." });
    } else {
      // The session was valid, but the file tracking query failed.
      return new Frames({ ...frames[0], [error]: "File is not currently being tracked by this user." });
    }
  },

  // 3. THEN respond to the original request with either the found index or an error message.
  then: actions([
    Requesting.respond,
    { request, index, error },
  ]),
});
```
