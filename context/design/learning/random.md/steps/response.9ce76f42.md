---
timestamp: 'Wed Oct 15 2025 19:25:15 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_192515.ed4fd8e8.md]]'
content_id: 9ce76f42d1bce84f0b1cec3f0e3031c465dc04ea98e8c1e698f4dc52d7542434
---

# response:

No, you cannot do `(currentStatus as number).index;`.

Here's why:

1. **Type Casting to `number`:** When you cast `currentStatus as number`, you are telling TypeScript that `currentStatus` is a primitive `number` type.
2. **`number` Primitives Don't Have Properties:** Primitive `number` types in JavaScript (and TypeScript) do not have properties like `.index`. Only objects can have properties.
3. **Runtime Error:** If `currentStatus` is truly an object (which it appears to be from your `assertObjectMatch` calls, e.g., `assertObjectMatch(currentStatus, { index: 0 })`), then casting it to `number` is incorrect and will lead to a runtime error when you try to access `.index` on what the type system *thinks* is a number, or it will simply be `undefined` if `currentStatus` wasn't an object in the first place.

**The Correct Way (assuming `currentStatus` is an object with an `index` property):**

Based on your other tests where you use `assertObjectMatch(currentStatus, { index: 0 })`, it seems `_getCurrentItem` returns an object that has an `index` property.

Therefore, you should access the `index` property directly:

```typescript
const currentStatus = await concept._getCurrentItem({
  owner: userAlice,
  file: file1,
});

// Assuming currentStatus is an object like { index: number, ... }
const originalIndex = currentStatus.index;
```

**Important Consideration: Error Handling**

Remember that `_getCurrentItem` might also return an object with an `error` key (as seen in your `deleteTracking` test: `assertEquals("error" in getFileResult, true)`). If that's the case, and you want to ensure `originalIndex` only gets a valid number, you might add a check:

```typescript
const currentStatusResult = await concept._getCurrentItem({
  owner: userAlice,
  file: file1,
});

if ("error" in currentStatusResult) {
  // Handle the error case, e.g., throw, return, or assign a default
  throw new Error(currentStatusResult.error);
}

// Now we know currentStatusResult is the successful status object
const originalIndex = currentStatusResult.index;
```

However, in the specific test step `"5. User cannot jump to an invalid index..."`, the `_getCurrentItem` call is *after* a successful `jumpTo` or `startTracking`, where it's expected to return a valid status object, so `currentStatusResult.index` without an `error` check is likely acceptable in that specific context.
