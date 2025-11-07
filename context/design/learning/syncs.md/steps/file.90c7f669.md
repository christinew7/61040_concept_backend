---
timestamp: 'Thu Nov 06 2025 10:20:34 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_102034.0a11ce98.md]]'
content_id: 90c7f66913d930e7529551a130169b6ac1bb4fe9091c32f62521d0a459252e1d
---

# file: src/syncs/authentication.sync.ts

```typescript
import { actions, Frames, Sync } from "@engine";
import { PasswordAuthentication, Requesting, Sessioning } from "@concepts";

/**
 * Handles a request to get the username for the current session.
 * It first verifies the session, then queries for the username,
 * and finally responds to the original request.
 */
export const GetUsernameFromSession: Sync = ({ request, session, user, username, error }) => ({
  // when: Triggered by an incoming API request to a specific path.
  when: actions([
    Requesting.request,
    { path: "/auth/getUsername", session }, // Expects a session ID in the request body/params.
    { request },
  ]),

  // where: Contains the authorization and data-fetching logic.
  where: async (frames) => {
    // 1. Get the user associated with the provided session.
    // .query() returns a new set of frames. If the session is invalid, userFrames will be empty.
    const userFrames = await frames.query(Sessioning._getUser, { session }, { user });

    // 2. Handle the case of an invalid session (a "Zero Matches" scenario).
    if (userFrames.length === 0) {
      // Create a new frame containing the original request ID and an error message.
      const errorFrame = { ...frames[0], [error]: "Invalid session. Please log in again." };
      // Return a new Frames object with just this error frame.
      return new Frames(errorFrame);
    }

    // 3. If the session is valid, get the username for the user.
    // We expect this to succeed if the session was valid, assuming data integrity.
    const usernameFrames = await userFrames.query(PasswordAuthentication._getUsername, { user }, { username });

    // 4. Handle the unlikely case where a user exists for a session but not in the auth system.
     if (usernameFrames.length === 0) {
      const errorFrame = { ...frames[0], [error]: "Session user not found in authentication system." };
      return new Frames(errorFrame);
    }
    
    // 5. Return the successful frames containing the username.
    return usernameFrames;
  },

  // then: Responds to the original HTTP request.
  then: actions([
    // This action will receive a frame with either a 'username' or an 'error' binding.
    // The pattern matches whichever is present and includes it in the response.
    Requesting.respond, { request, username, error }
  ]),
});
```
