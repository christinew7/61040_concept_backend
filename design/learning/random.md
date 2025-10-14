[@testing-concepts](../background/testing-concepts.md)
# prompt: can you explain what this means when making test cases: 
- **No state setup**. Your test cases should not require any setting up of the concept state except by calling concept actions. When you are testing one action at a time, this means that you will want to order your actions carefully (for example, by the operational principle) to avoid having to set up state.

# response:

This instruction, "**No state setup**. Your test cases should not require any setting up of the concept state except by calling concept actions," is a fundamental principle for writing robust, meaningful, and self-validating tests within this framework.

Let's break down what it means and why it's important:

### What it means:

1.  **No Direct Database Manipulation for State Creation:**
    *   You should *never* directly insert, update, or delete records in the `db` object (e.g., `db.users.insertOne(...)`, `db.products.updateMany(...)`) *for the purpose of creating the initial state* that your action under test depends on.
    *   Even though `testDb` gives you a `db` object, its primary use in tests is for *assertions* after actions have been performed, or to verify the absence of certain states *before* an action.

2.  **State Must Be Built Exclusively Through Concept Actions:**
    *   If an action you want to test (let's call it `actionB`) requires a certain state to exist (e.g., a user needs to be registered, an item needs to be added to a cart), you *must* achieve that state by first calling other concept actions (e.g., `registerUser`, `addItemToCart`).
    *   This means your tests, especially "trace" tests, will often involve a sequence of actions that progressively build up the necessary state.

3.  **"Ordering Your Actions Carefully":**
    *   Since each test file starts with a fresh, empty database (`Deno.test.beforeAll` drops it), if you're testing an action that depends on prior state, you have to execute the *preceding actions* within that same test or a logically preceding test step.
    *   The "operational principle" for your concept is an excellent guide here. It outlines the natural progression of actions that lead to the concept's core functionality. By following this principle in your tests, you naturally build up the state needed for subsequent steps.

### Why this rule is critical:

1.  **Ensures `requires` Conditions are Validated:**
    *   If you manually set up state by bypassing concept actions, you're not testing whether the `requires` conditions of those *setup* actions actually work.
    *   Example: If you manually insert a `user` into the database instead of calling `registerUser()`, you're not testing if `registerUser` correctly enforced uniqueness of usernames, validated password strength, or handled other business rules specified in its `requires` block.

2.  **Validates `effects` and State Transitions:**
    *   By using concept actions to build state, you implicitly verify that the `effects` of those actions correctly update the system's state according to their specification.
    *   You're confirming that the system transitions from one valid state to another *through its defined interface*, not by an external manipulation.

3.  **Tests the "Principle" Holistically:**
    *   The document explicitly states the goal: "Demonstrate that the series of actions described in the **principle**, when performed, result in the specified behavior." If you inject state directly, you're not performing the "series of actions." You're short-circuiting part of the principle.

4.  **Realistic Interaction and Black-Box Testing:**
    *   This approach mirrors how an external user or another system would interact with your concept – through its public actions, not by directly manipulating its internal data store.
    *   It treats your concept as a black box, testing its exposed interface and observable behavior, rather than its internal implementation details.

5.  **Reveals Missing Actions or Incomplete Requirements:**
    *   If you find it difficult or impossible to create a specific prerequisite state using *only* your concept's defined actions, it might indicate that:
        *   You're missing a necessary action in your concept specification.
        *   Your concept's `principle` is incomplete.
        *   The `effects` of existing actions don't correctly lead to the states you expect.

6.  **Reduces Test Fragility:**
    *   If your tests rely on directly inserting data with a specific schema, changes to that schema (e.g., adding a new required field) will break many tests.
    *   If tests use concept actions, they are more resilient to internal schema changes, as long as the action's interface (`name`, `requires`, `effects`) remains stable.

### Example:

Let's say you have a concept for an e-commerce cart.

**Bad Practice (Violates "No State Setup"):**

```typescript
// DON'T DO THIS
Deno.test("removeItemFromCart requires item to exist", async () => {
  const [db, client] = await testDb();

  // Manually inserting state directly into the database
  await db.cart.insertOne({ userId: "user1", itemId: "itemA", quantity: 1 });

  const result = await concept.removeItemFromCart({ userId: "user1", itemId: "itemA" });
  assertEquals(result.success, true); // Assuming this is the expected outcome
  // ... assertions
  await client.close();
});
```

**Good Practice (Adheres to "No State Setup"):**

```typescript
Deno.test("removeItemFromCart requires item to exist", async () => {
  const [db, client] = await testDb();

  // State is built using a concept action
  const addResult = await concept.addItemToCart({ userId: "user1", itemId: "itemA", quantity: 1 });
  assertEquals(addResult.success, true); // Verify the setup action worked

  // Now, perform the action under test
  const removeResult = await concept.removeItemFromCart({ userId: "user1", itemId: "itemA" });
  assertEquals(removeResult.success, true); // Test the removal
  // ... assertions about the state after removal

  await client.close();
});
```

By following the "No state setup" rule, your tests become a true validation of your concept's design, ensuring that its internal logic and external behavior align with its specified `requires`, `effects`, and overall `principle`.