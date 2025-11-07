---
timestamp: 'Fri Nov 07 2025 13:18:17 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131817.2538e759.md]]'
content_id: 9fadc61a3047fcff2a71a4989df8db596ab3dd324667959827165015752b9e00
---

# response:

You've hit a classic JavaScript destructuring/naming mismatch!

Let's trace the flow and pinpoint the exact issue.

**1. Incoming Request (Good):**
`Requesting.request { ..., visible: false, path: '/FileTracker/setVisibility' }`
This shows that the incoming request correctly passes `visible: false`.

**2. Synchronization `when` clause (Good):**
`when: actions([Requesting.request, { path: "/FileTracker/setVisibility", session, file, visible }, { request },])`
Here, your `visible` variable in the synchronization is correctly capturing the `false` value from the incoming request. This is confirmed by your `resutl Frames(1) [ ... [Symbol(visible)]: false, ... ]` log. The sync's local `visible` variable holds `false`.

**3. The Problem in the `then` clause:**

```typescript
then: actions([
    FileTracker.setVisibility,
    {
        owner: user,
        file,
        isVisible: visible, // <-- THIS IS THE CULPRIT!
    },
]),
```

You are passing an object to `FileTracker.setVisibility` that has a property named `isVisible`, and you're assigning the sync's `visible` variable (which is `false`) to it.

**4. `FileTracker.setVisibility` method signature:**

```typescript
async setVisibility(
    { owner, file, visible }: { owner: User; file: File; visible: boolean },
): Promise<Empty | { error: string }> {
    console.log("in set", owner, file, visible); // <-- Prints `undefined` here
    // ...
    if (typeof visible !== "boolean") { // <-- This 'visible' is undefined
      return { error: `Invalid visible value: ${visible}. Must be a boolean.` };
    }
    // ...
}
```

Inside your `setVisibility` method, the destructuring `({ owner, file, visible })` expects a property named `visible` in the incoming argument object. However, you passed an object with `isVisible: false`. Because there's no property named `visible`, the local `visible` variable inside the method becomes `undefined`.

**The Solution:**

You need to match the parameter name in your `then` clause's object to the parameter name expected by the `FileTracker.setVisibility` method. Change `isVisible: visible` to `visible: visible` (or simply `visible` using shorthand).

```typescript
export const SetVisibilityRequest: Sync = (
  { request, session, user, file, visible }, // 'visible' variable is correctly bound here
) => ({
  when: actions([
    Requesting.request,
    { path: "/FileTracker/setVisibility", session, file, visible },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    const userFrames = await frames.query(Sessioning._getUser, { session }, { user });

    if (userFrames.length === 0) return new Frames(); // invalid session

    // Ensure all relevant variables are carried forward in the resulting frame
    const result = new Frames({
      ...originalFrame,
      [user]: userFrames[0][user], // bind user
      [file]: originalFrame[file], // bind file (already there, but good to be explicit if needed)
      [visible]: originalFrame[visible], // bind visible (already there, but good to be explicit if needed)
    });

    console.log("resutl", result);
    return result;
  },
  then: actions([
    FileTracker.setVisibility,
    {
      owner: user,
      file,
      // Change 'isVisible: visible' to 'visible: visible' (or just 'visible')
      visible: visible, // Corrected!
    },
  ]),
});
```

With this change, the `FileTracker.setVisibility` method will correctly receive `visible: false` as expected, and your `console.log` inside the method will show the boolean value.
