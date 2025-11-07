[@sync-background](../tools/sync-background.md)

%% [@Password-implementation](../../src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts) %%

 %% [@Dictionary-implementation](../concepts/Dictionary/implementation.md) %%

 %% [@Library-implementation](../../src/concepts/Library/LibraryConcept.ts) %%

 [@FileTracker-implementation](../../src/concepts/FileTracker/FileTrackerConcept.ts) 

[@Sessioning](../concepts/Sessioning/Sessioning.md)

%% [@auth sync](../../src/syncs/auth.sync.ts) %%
# prompt:  why is my isVisible returning undefined when the reqest passes the visible boolean as a boolealn


Requesting.request {
  session: '019a5d21-c489-7cf6-a9ac-2892d8447101',
  file: '019a5d3f-0ae3-71d8-88e0-74351df88a18',
  visible: false,
  path: '/FileTracker/setVisibility'
} => { request: '019a5f89-432e-779d-8ca0-90372e5fd09e' }

019a0363-778d-7ee3-a5d1-07930b7c03cf
resutl Frames(1) [
  {
    [Symbol(flow)]: "fa6e6843-f666-47df-8577-8036993f8e06",
    [Symbol(session)]: "019a5d21-c489-7cf6-a9ac-2892d8447101",
    [Symbol(file)]: "019a5d3f-0ae3-71d8-88e0-74351df88a18",
    [Symbol(visible)]: false,
    [Symbol(request)]: "019a5f89-432e-779d-8ca0-90372e5fd09e",
    [Symbol(action_0)]: "4e3abf3e-d0fd-493e-ae1c-426566d9844e",
    [Symbol(user)]: "019a0363-778d-7ee3-a5d1-07930b7c03cf"
  }
]
in set 019a0363-778d-7ee3-a5d1-07930b7c03cf 019a5d3f-0ae3-71d8-88e0-74351df88a18 undefined

FileTracker.setVisibility {
  owner: '019a0363-778d-7ee3-a5d1-07930b7c03cf',
  file: '019a5d3f-0ae3-71d8-88e0-74351df88a18',
  isVisible: false
} => { error: 'Invalid visible value: undefined. Must be a boolean.' }


Requesting.respond {
  request: '019a5f89-432e-779d-8ca0-90372e5fd09e',
  error: 'Invalid visible value: undefined. Must be a boolean.'
} => { request: '019a5f89-432e-779d-8ca0-90372e5fd09e' }

export const SetVisibilityRequest: Sync = (

{ request, session, user, file, visible },

) => ({

when: actions([

Requesting.request,

{ path: "/FileTracker/setVisibility", session, file, visible },

{ request },

]),

// where: async (frames) => {

// const originalFrame = frames[0];

  

// // Get the actual user ID from the session

// const framesWithUser = await frames.query(

// Sessioning._getUser,

// { session },

// { user },

// );

// const sessionFrames = framesWithUser.filter(($) => $[user] != null);

  

// const userIdValue = sessionFrames[0][user];

// const result = await new Frames({

// ...originalFrame,

// [user]: userIdValue,

// [file]: originalFrame[file],

// [visible]: originalFrame[visible],

// [isVisible]: originalFrame[visible],

// });

// console.log("result is", result);

// console.log("isvis", result[isVisible]);

// return result;

// },

where: async (frames) => {

const originalFrame = frames[0];

const userFrames = await frames.query(Sessioning._getUser, { session }, {

user,

});

if (userFrames.length === 0) return new Frames(); // invalid session

  

console.log(userFrames[0][user]);

const result = new Frames({

...originalFrame,

[user]: userFrames[0][user], // bind user

[visible]: originalFrame[visible], // bind isVisible

});

console.log("resutl", result);

return result;

},

  

then: actions([

FileTracker.setVisibility,

{

owner: user,

file,

isVisible: visible,

},

]),

});
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