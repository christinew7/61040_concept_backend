---
timestamp: 'Wed Nov 05 2025 23:45:21 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251105_234521.68692f02.md]]'
content_id: c166ba442445cc5c869d4386b2d353e7a310825da56af4905f353e0286d28b6e
---

# response:

This is an excellent and very detailed document on Concept Design! It lays out the philosophy, structure, and implementation details for both concepts and synchronizations beautifully.

Based on your request, "can you help me implement syncs?", I'll break down the key aspects of implementing synchronizations with practical advice, going beyond just the syntax provided, to help you get started effectively.

***

## Implementing Synchronizations: A Practical Guide

Synchronizations are the glue of your concept-designed application. They define the causal relationships between independent concepts, allowing them to collaborate without direct coupling. Here's a deeper dive into how to implement them effectively.

### 1. **Setup and File Structure**

As the document states, `filename.sync.ts` files go into `src/syncs/`.

* **Organize logically:** Use subdirectories within `src/syncs/` to group related syncs. For example:
  * `src/syncs/auth/authentication.sync.ts`
  * `src/syncs/posts/post_lifecycle.sync.ts`
  * `src/syncs/notifications/user_alerts.sync.ts`
* **Run `deno run build` regularly:** This is crucial. Whenever you create a new concept file in `src/concepts/` or modify its actions/queries, run this command. It updates the `@concepts` import alias, ensuring your syncs can find and correctly reference your concept actions and queries. If your IDE shows "module not found" or types are incorrect for concept actions, this is usually the first thing to check.

### 2. **Basic Sync Structure (Review)**

```typescript
// src/syncs/example.sync.ts
import { actions, Sync } from "@engine";
import { Button, Counter } from "@concepts"; // Don't forget to run `deno run build` if you add new concepts!

export const ButtonIncrement: Sync = ({}) => ({
    when: actions(
        // [ConceptAction, InputPattern, OutputPattern]
        [Button.clicked, { kind: "increment_counter" }, {}],
    ),
    then: actions(
        // [ConceptAction, InputPattern] (no output for `then` actions)
        [Counter.increment, {}],
    ),
});
```

* **`when` clause:** Matches one or more actions that *have just occurred*.
  * The `OutputPattern` for `when` actions is used to bind variables from the action's return value. If the action doesn't return anything you care about, use `{}`.
  * Multiple actions in `when` imply a "flow" – they must be causally related in the same execution chain.
* **`then` clause:** Specifies one or more actions to *perform*.
  * These actions are triggered *for each frame* that successfully passes through the `when` and `where` clauses.
  * The `InputPattern` uses variables bound from `when` or `where` clauses.
* **`Sync` type:** Enforces the structure and helps with type checking.

### 3. **Introducing Variables and the `where` Clause**

The `where` clause is where you query the state of concepts and filter frames. Variables are essential for passing data between clauses.

```typescript
// src/syncs/example_with_where.sync.ts
import { actions, Sync } from "@engine";
import { Button, Counter, Notification } from "@concepts";

export const NotifyWhenReachTen: Sync = ({ count, user }) => ({ // Declare variables here
    when: actions(
        [Button.clicked, { kind: "increment_counter", user }, {}], // Bind `user` from button click
        [Counter.increment, {}, {}], // This action must also occur in the same flow
    ),
    where: async (frames) => { // `where` is always an async function
        // 1. Query the Counter concept to get the current count
        frames = await frames.query(Counter._getCount, {}, { count }); // Bind `count` from Counter state

        // 2. Filter frames based on the bound `count`
        return frames.filter(($) => $[count] >= 10); // Use `$[count]` for symbol access
    },
    then: actions(
        // Use `user` and `count` variables in the `then` clause
        [Notification.notify, { message: `Counter reached ${$[count]}!`, to: user }],
    ),
});
```

**Key Points on `where` and Variables:**

* **Variable Declaration:** Destructure the function argument `{ count, user }` in your `Sync` function to make these symbols available for pattern matching and in the `where` clause.
* **`frames.query(Concept.queryMethod, InputPattern, OutputPattern)`:**
  * This is how you read concept state.
  * `Concept.queryMethod`: The query method from your concept class (e.g., `Counter._getCount`).
  * `InputPattern`: Values from current frame variables to pass as input to the query (e.g., `{ user: user }`).
  * `OutputPattern`: How to bind the query's return values to new variables in the frame (e.g., `{ count: count }`).
  * **Crucially, `.query` can multiply frames.** If a query returns multiple results (e.g., `_getCommentsByPost` returns 3 comments), `frames.query` will produce 3 new frames, each with a different `comment` binding, for each original frame. This is how iteration happens for free!
* **`async` and `await`:** Always mark your `where` function as `async` and `await` all `frames.query` calls.
* **`$` for Symbols:** Remember `count` is a JavaScript `Symbol`, so you access its value in a frame using `$[count]`, not `$.count`.

### 4. **Handling Multiple Query Results (Iteration)**

This is a powerful feature for cascading operations.

```typescript
// src/syncs/cascade_deletion.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, Post, Comment } from "@concepts";

export const CascadePostDeletion: Sync = ({ post, comment, request }) => ({
	when: actions(
	    // Assuming a request triggers the post deletion
	    [Requesting.request, { path: "/posts/delete", post }, { request }],
	    [Post.delete, { post }, {}], // Bind `post` from the action's input
	),
	where: async (frames) => {
		// For each frame (initially one post to delete), query for all related comments.
        // If a post has 3 comments, this will turn 1 frame into 3 frames.
		return await frames.query(Comment._getByTarget, { target: post }, { comment });
	},
	then: actions(
		// This `Comment.delete` action will fire once for EACH `comment` bound in the frames.
		[Comment.delete, { comment }]
	),
});
```

The diagram in your document (`flowchart TD`) perfectly illustrates this expansion of frames.

### 5. **`collectAs` for Aggregating Results**

When you need to return a list of items, `collectAs` is your friend.

```typescript
// src/syncs/user_data.sync.ts
import { actions, Frames, Sync } from "@engine";
import { Requesting, User, Purchasing, Sessioning } from "@concepts";

export const GetActiveUserPurchaseTotals: Sync = (
  { request, session, user, username, total, results },
) => ({
  when: actions(
    [Requesting.request, { path: "/purchase-totals", session }, { request }],
  ),
  where: async (frames) => {
    // IMPORTANT: Store the initial frame to ensure `request` is available for `then`
    const originalFrame = frames[0];

    frames = await frames.query(Sessioning._getUser, { session }, { user }); // Get user from session
    frames = await frames.query(User._getUsername, { user }, { username });   // Get username for user
    frames = await frames.query(Purchasing._getTotalForUser, { user }, { total }); // Get total for user

    // Handle the case where no purchases are found for any user
    if (frames.length === 0) {
      // If no data, return a single frame with an empty results array, using the original request.
      return new Frames({ ...originalFrame, [results]: [] });
    }

    // Collect all {user, username, total} tuples into a single `results` array
    // This reduces multiple frames (one per user/total) back to a single frame
    // that still has the `request` binding from the original frame (if `request` wasn't collected).
    return frames.collectAs([user, username, total], results);
  },
  then: actions(
    [Requesting.respond, { request, results }],
  ),
});
```

* `frames.collectAs([varsToCollect], asVar)`:
  * `varsToCollect`: An array of variable symbols (`[user, username, total]`) you want to group.
  * `asVar`: The variable symbol (`results`) under which the collected array will be stored.
  * It groups frames by their *uncollected* variables. If only `user, username, total` are collected, and `request` is uncollected, and all frames share the *same* `request` binding, then `collectAs` will yield one frame containing `request` and an array `results` (containing all `user, username, total` objects). This is ideal for API responses.

### 6. **Handling Request/Response Cycles**

This pattern is fundamental for building API endpoints.

```typescript
// src/syncs/api_handlers.sync.ts
import { actions, Sync } from "@engine";
import { Requesting, LikertSurvey } from "@concepts";

// 1. Trigger the concept action from an incoming request
export const AddQuestionRequest: Sync = ({ request, survey, text }) => ({
  when: actions([
    Requesting.request,
    { path: "/LikertSurvey/addQuestion", survey, text },
    { request }, // Bind the unique request ID
  ]),
  then: actions([LikertSurvey.addQuestion, { survey, text }]),
});

// 2. Respond to the request upon successful completion of the concept action
export const AddQuestionResponse: Sync = ({ request, question }) => ({
  when: actions(
    [Requesting.request, { path: "/LikertSurvey/addQuestion" }, { request }], // Match the original request
    [LikertSurvey.addQuestion, {}, { question }], // Match the successful output of the concept action
  ),
  then: actions([Requesting.respond, { request, question }]), // Respond with the bound `question`
});

// 3. Respond to the request upon error completion of the concept action
export const AddQuestionResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/LikertSurvey/addQuestion" }, { request }], // Match the original request
    [LikertSurvey.addQuestion, {}, { error }], // Match the error output of the concept action
  ),
  then: actions([Requesting.respond, { request, error }]), // Respond with the bound `error`
});
```

**Important `Requesting` Considerations:**

* **`path` parameter:** For `Requesting.request`, the `path` parameter *does not* include the `REQUESTING_BASE_URL` prefix (e.g., `/LikertSurvey/addQuestion`, not `/api/LikertSurvey/addQuestion`).
* **Flat `Requesting.respond`:** As stated, `Requesting.respond` expects a flat list of parameters. If you need to send a complex object, prepare it in the `where` clause (e.g., using `JSON.stringify` or by constructing a new object `{ body: myComplexObject }`).
* **`when` clause flow:** The engine understands that `Requesting.request` and `LikertSurvey.addQuestion` are part of the *same causal flow* if `AddQuestionRequest` successfully fired `LikertSurvey.addQuestion`. This is why the response syncs work: they link back to the originating `request` binding.

### 7. **Common Pitfalls and Debugging**

* **Zero Matches in `where`:** If your `where` clause results in `frames.length === 0`, the `then` clause will *not* fire.
  * **Solution:** As shown in `ListMyFilesRequest` example in the documentation, check `if (frames.length === 0)` and manually construct a `new Frames({...originalFrame, [results]: []})` to provide a default response (e.g., an empty list) if nothing is found. Always capture `originalFrame` early if you intend to modify `frames` significantly.
* **Missing `actionId` in `then` clause:** This error often indicates:
  * Your `where` clause function isn't returning a `Frames` object, or isn't properly `await`ing queries.
  * A critical binding (like `request` for `Requesting.respond`) is lost from the frame during `where` processing, or wasn't correctly bound in `when`.
* **Incorrect Pattern Matching:** This is the #1 source of sync bugs.
  * **Parameter Names:** Double-check that the field names in your input/output patterns exactly match the parameter names in your concept's action/query specification. Case-sensitive!
  * **Variable Names:** The right-hand side of a pattern (e.g., `author: user`) is the variable symbol. The left-hand side (`author`) is the concept action's parameter name. If they're the same, you can use shorthand (`{ author }`).
  * **Missing `deno run build`:** If you add new actions or queries to a concept, but don't rebuild, the `@concepts` module might be stale, leading to incorrect types or runtime errors in your syncs.
* **Unclear Causal Flow:** For `when` clauses with multiple actions, ensure you understand the engine's concept of "flow." These actions must have happened in a sequence where one directly caused the other (often via another sync).
* **Logging:** The engine's logging (especially at `TRACE` level) is incredibly helpful for debugging. It will show you exactly which actions are fired and which syncs are being evaluated, and what their `when` clauses are matching against.

### 8. **Testing Synchronizations**

* **Principle-Guided:** Use the concept's `principle` as a guide for your syncs. A good principle should highlight how a concept fulfills its purpose, and often involves multiple actions and possibly interactions with other concepts. Your syncs should embody these principles.
* **Unit Tests for Syncs:** Although not explicitly shown, you would typically write unit tests for your syncs that simulate action occurrences and concept states, then assert the expected `then` actions are fired. The `@engine`'s `Sync` type and `actions` helper lend themselves well to this.

By following these guidelines and paying close attention to the details of pattern matching, variable binding, and frame manipulation, you'll be well-equipped to implement robust and modular synchronizations in your concept-designed applications.
