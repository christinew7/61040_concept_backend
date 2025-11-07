---
timestamp: 'Thu Nov 06 2025 22:34:17 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_223417.44e9d1f4.md]]'
content_id: 875156765923cc6bc503125c00aeabf4bb23604f08a410a3b793fa1ef89f3fc9
---

# file: src/syncs/library.sync.ts

```typescript
import { actions, Frames, Sync } from "@engine";
import { Library, Requesting, Sessioning } from "@concepts";

export const GetFileStringRequest: Sync = (
  { request, session, user, file, fileString },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getFileString", session, file },
    { request },
  ]),
  where: async (frames) => {
    // The idiomatic approach is to chain queries. Each `frames.query` call
    // uses the bindings from the previous step and adds new ones.

    // Step 1: Authenticate the session to get the user.
    // This uses the `session` variable bound in the `when` clause.
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // Step 2: Get the file string for that user and file.
    // This uses the `user` variable bound in the previous step and the `file`
    // variable bound in the `when` clause. `frames.query` automatically
    // uses the *values* of these variables. The result is bound to `fileString`.
    frames = await frames.query(
      Library._getFileString,
      { owner: user, file },
      { fileString },
    );

    // If either query fails to produce a result (e.g., invalid session, or
    // file not found for user), `frames` will become empty. This will prevent
    // the `then` clause from executing, and the request will time out,
    // correctly signaling an error to the client.
    return frames;
  },
  then: actions([
    Requesting.respond,
    { request, fileString },
  ]),
});
```
