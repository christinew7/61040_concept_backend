---
timestamp: 'Thu Nov 06 2025 20:55:49 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_205549.33ed410d.md]]'
content_id: eb3e0ef8170b41449529721476cff6a5accfc5083afeb28268a88f0b0b1b2ce1
---

# problem:

The error message you're receiving is: `Failed to start tracking with LLM: Cannot read properties of undefined (reading 'executeLLM')`.

This is a classic TypeScript/JavaScript error which means you are trying to call the method `executeLLM` on a variable that is `undefined`.

Looking at your `FileTrackerConcept.ts` code, the call happens here:

```typescript
// file: src/concepts/FileTracker/FileTrackerConcept.ts

// ... inside startTrackingUsingLLM method
try {
    // ...
    const text = await this.llm.executeLLM(prompt); // <--- ERROR HERE
    // ...
} //...
```

This indicates that `this.llm` is `undefined` when `startTrackingUsingLLM` is called.

If we look at the constructor for `FileTrackerConcept`, we can see how `this.llm` is supposed to be initialized:

```typescript
// file: src/concepts/FileTracker/FileTrackerConcept.ts

export default class FileTrackerConcept {
  private trackedFiles: Collection<TrackedFileDoc>;
  private readonly llm: GeminiLLM; // This property holds the LLM instance

  constructor(private readonly db: Db, llm: GeminiLLM) { // It's passed in here
    this.trackedFiles = this.db.collection(PREFIX + "trackedFiles");
    this.llm = llm; // And assigned to this.llm here
  }
//...
}
```

The constructor requires two arguments: a database connection (`db`) and an instance of `GeminiLLM` (`llm`). The error strongly suggests that when you created the `FileTrackerConcept` instance in your application's entry point (likely `src/main.ts`), you did not pass the second `llm` argument.
