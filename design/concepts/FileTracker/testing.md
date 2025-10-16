
[@testing-concepts](../../background/testing-concepts.md)

[@implementation](../../../src/concepts/FileTracker/FileTrackerConcept.ts)

[@testing](../../../src/concepts/FileTracker/FileTrackerConcept.test.ts)

[@LikertTesting](../LikertSurvey/testing.md)
# context: these are all questions about the FileTracker concept and its test cases. use the Likert testing as reference

# prompt: how should i print out the error object
AssertionError: Expected actual: true not to be: true: There should be no error in starting a new tracking with LLM, but got error [object Object]
  throw new AssertionError(
        ^
# response:

You're encountering `[object Object]` because when you interpolate an object directly into a template string (e.g., `${startResult}`), JavaScript calls its `toString()` method, which for generic objects defaults to `[object Object]`.

To properly print the error object or its message, you should explicitly convert it to a string, typically using `JSON.stringify()`, or access the specific `error` property if you're sure it's an error object.

Given your assertion:
```typescript
assertNotEquals(
  "error" in startResult,
  true,
  `There should be no error in starting a new tracking with LLM, but got error ${startResult}`,
);
```
This assertion fails when `"error" in startResult` is `true`. This means `startResult` *is* an object containing an `error` key, like `{ error: "Some error message" }`.

Here are the best ways to print the error object in your assertion message:

1.  **Using `JSON.stringify(startResult)` (Recommended for general debugging)**
    This will give you the full JSON representation of the error object.

    ```typescript
    assertNotEquals(
      "error" in startResult,
      true,
      `There should be no error in starting a new tracking with LLM, but got error: ${JSON.stringify(startResult)}`,
    );
    ```
    **Example output:** `...but got error: {"error":"Invalid maxIndex: -1. Must be a non-negative integer."}`

2.  **Accessing the `error` property directly (If you know it's an error object)**
    This will give you just the string message from the `error` property. You might need a type assertion to tell TypeScript that `startResult` can indeed have an `error` property.

    ```typescript
    assertNotEquals(
      "error" in startResult,
      true,
      `There should be no error in starting a new tracking with LLM, but got error: ${(startResult as { error: string }).error}`,
    );
    ```
    **Example output:** `...but got error: Invalid maxIndex: -1. Must be a non-negative integer.`

Choose the first option (`JSON.stringify`) for more comprehensive debugging, as it shows the entire structure of the object that caused the assertion to fail. The second option is cleaner if you only care about the error message itself and are confident in the object's shape when it contains an error.
