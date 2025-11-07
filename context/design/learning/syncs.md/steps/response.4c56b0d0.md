---
timestamp: 'Thu Nov 06 2025 21:44:37 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_214437.3136ea38.md]]'
content_id: 4c56b0d025a195c7fc7176b4e47db13b3376f21619db9cfd9f20905da51e9483
---

# response:

Of course! I can definitely help you with that. The timeout error you're seeing is a classic symptom of a synchronization where the `where` clause isn't producing any valid "frames" for the `then` clause to act upon.

Looking at your code, there are a few key issues that are causing this. Let's break them down.

### 1. Incorrect Path in `when` clause

Your `when` clause is listening for requests to `/Library/_getCurrentItem`, but your log clearly shows the request is coming in for `/FileTracker/_getCurrentItem`. The synchronization isn't even triggering because the path doesn't match.

**Incorrect:**

```typescript
path: "/Library/_getCurrentItem",
```

**Correct:**

```typescript
path: "/FileTracker/_getCurrentItem",
```

### 2. Calling a Concept Method Directly

This is the most critical issue. Inside a `where` clause, you **cannot** call a concept's query method directly like a regular function (e.g., `await FileTracker._getCurrentItem(...)`).

The purpose of the `where` clause is to build a chain of queries using the `frames.query()` method. The engine uses this information to fetch data and "enrich" the frames with new variable bindings.

**Incorrect:**

```typescript
// This will NOT work inside a 'where' clause
const result = await FileTracker._getCurrentItem({
  owner: userIdValue,
  file: fileValue,
});
...
return new Frames({ ...originalFrame, [index]: result.index });
```

**Correct:**
The correct approach is to chain the queries. The output variable from one query (`user`) becomes the input variable for the next one.

```typescript
where: async (frames) => {
    return await frames
      .query(Sessioning._getUser, { session }, { user })
      .query(FileTracker._getCurrentItem, { owner: user, file }, { index });
},
```

This single line is much cleaner and is the idiomatic way to write `where` clauses. It reads as:

1. Start with the frames from the `when` clause (which have `request`, `session`, and `file`).
2. Use the `session` variable to query `Sessioning._getUser`, and bind the result to a new `user` variable.
3. Use the newly bound `user` variable (as `owner`) and the existing `file` variable to query `FileTracker._getCurrentItem`, binding the result to a new `index` variable.
4. Return the final frames, which now contain all the necessary bindings for the `then` clause (`request`, `index`, etc.).

### 3. Incorrect `when` Pattern

The `when` clause for `Requesting.request` should only try to bind parameters that are actually part of the incoming request. The `user` is something we derive from the `session` in the `where` clause, it's not part of the initial request's payload.

**Incorrect:**

```typescript
when: actions([Requesting.request, {
  path: "...",
  session,
  user, // This shouldn't be here
  file,
}, { request }]),
```

**Correct:**

```typescript
when: actions([Requesting.request, {
  path: "/FileTracker/_getCurrentItem",
  session,
  file,
}, { request }]),
```

### The Corrected Synchronization

Here is the complete, corrected version of your synchronization that addresses all these points.
