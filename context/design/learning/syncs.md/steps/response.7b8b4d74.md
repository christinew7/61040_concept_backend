---
timestamp: 'Thu Nov 06 2025 22:59:16 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_225916.2bf60377.md]]'
content_id: 7b8b4d746cc08e818e6a837231625d1d76707a54989ff4123aeab49b13f9430f
---

# response:

Of course. It looks like you're running into a very common issue when writing synchronizations: the difference between a **symbol** and its **value** within a frame. Let's break down the problem and the solution.

### The Problem: `Cannot convert a Symbol value to a string`

The error message is telling you exactly what's wrong. Inside your `where` clause, you are calling `Library._getFileString` and passing it the `file` variable directly:

```typescript
// Problematic line from your code
const result = await Library._getFileString({ owner: userIdValue, file });
```

In the context of a synchronization function, variables you destructure (`{ request, session, user, file, ... }`) are **symbols**. They are special keys used by the engine to look up values inside a `Frame` object. They are not the string values themselves.

Your `Library._getFileString` method expects `file` to be a string ID, but you're passing it `Symbol(file)`, which causes the type error when the database driver tries to use it in a query.

Your log confirms this: `cur item Symbol(file)` shows that the `file` variable itself is a Symbol.

### The Solution: Use `frames.query` and Fix Your Concept Query

While you could fix your current code by manually extracting the file's string value from the frame (`const fileId = originalFrame[file]`), this approach is an anti-pattern that bypasses the engine. The intended and much safer way to interact with concepts in a `where` clause is by chaining `frames.query()` calls.

However, for `frames.query` to work, **your concept's query method must adhere to the framework's specification.**

#### Step 1: Fix `LibraryConcept._getFileString`

The documentation states: **"Important: queries MUST return an array of the type specified by the return signature"**. This means a query should return an array of objects on success (even if it's just one object) and an empty array `[]` on failure.

Your current implementation returns a single object (`{...}`) or an empty object (`{}`). This will break `frames.query`.

Modify `src/concepts/Library/LibraryConcept.ts` as follows:

```typescript
// file: src/concepts/Library/LibraryConcept.ts

// ... (imports and other methods)

  /**
   * @query _getFileString
   * @requires this owner has a Library, and this file is in this owner's Library
   * @effects returns the items list of the specified file as a JSON string
   */
  async _getFileString(
    { owner, file }: { owner: User; file: File },
    // Return an array of objects, as per framework spec
  ): Promise<{ fileString: string }[]> { 
    const ownerLibrary = await this.libraries.findOne({ owner });
    if (!ownerLibrary) {
      return []; // Return empty array on failure
    }

    const fileInDoc = await this.files.findOne({
      library: ownerLibrary._id,
      _id: file,
    });
    if (!fileInDoc) {
      return []; // Return empty array on failure
    }
    const items = fileInDoc.items;
    // Return array with a single result object on success
    return [{ fileString: JSON.stringify(items) }]; 
  }

// ... (rest of the class)
```

#### Step 2: Rewrite the Synchronization with `frames.query`

Now that your concept is compliant, you can rewrite the synchronization to use the standard, safer pattern. This new version uses `frames.query` to correctly look up values and handles the "not found" case gracefully, preventing timeouts.

```typescript
import { actions, Frames, Sync } from "@engine";
import { Requesting, Sessioning, Library } from "@concepts";

export const GetFileStringRequest: Sync = (
  // Add 'error' to the destructured variables
  { request, session, user, file, fileString, error },
) => ({
  when: actions([
    Requesting.request,
    { path: "/Library/_getFileString", session, file },
    { request },
  ]),
  where: async (frames) => {
    // Keep a reference to the original frame for error handling
    const originalFrame = frames[0];

    // 1. First, verify the session and bind the 'user' variable
    frames = await frames.query(Sessioning._getUser, { session }, { user });

    // If the session is invalid, frames will be empty. Respond with an error.
    if (frames.length === 0) {
      const response = { ...originalFrame, [error]: "Invalid session" };
      return new Frames(response);
    }

    // 2. Now, use the bound 'user' and 'file' to query for the fileString
    // The engine automatically uses the string values associated with the user and file symbols.
    frames = await frames.query(Library._getFileString, { owner: user, file }, { fileString });

    // If the file wasn't found for that user, frames will be empty. Respond with an error.
    if (frames.length === 0) {
      const response = { ...originalFrame, [error]: "File not found or access denied" };
      return new Frames(response);
    }
    
    // If we get here, the frame is successfully enriched with 'fileString'.
    return frames;
  },
  then: actions([
    Requesting.respond,
    // This pattern responds with 'fileString' on success or 'error' on failure.
    { request, fileString, error },
  ]),
});
```

### Summary of Changes

1. **Corrected the `Symbol` Error**: By switching to `frames.query`, the sync engine now correctly handles looking up the string IDs for the `user` and `file` symbols, resolving your original error.
2. **Robust Error Handling**: The `where` clause now explicitly checks for failed queries (`frames.length === 0`) and constructs a proper error response instead of timing out.
3. **Framework Compliance**: You fixed your `_getFileString` query to return an array, making your `LibraryConcept` robust and compatible with the framework's intended patterns.
