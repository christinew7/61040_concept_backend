---
timestamp: 'Mon Oct 13 2025 20:15:04 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_201504.50c2654a.md]]'
content_id: 88a44b481b9d4c5a9668eb0d61b659977cb08a1fadfec357f46f9e6b67639c03
---

# response:

This rule, "No state setup. Your test cases should not require any setting up of the concept state except by calling concept actions," is a cornerstone of robust and meaningful concept testing. It ensures that your tests accurately reflect the intended behavior and interaction model of your system.

Let's break down what this means:

***

## "No state setup"

This part defines **how you prepare your system for a specific test scenario.**

* **"State"** refers to the current condition or configuration of your system at any given moment. This includes all data stored (e.g., in `testDb`), active sessions, object properties, and any other relevant information that defines the system's context.
  * *Example state:* A user exists, an item is in a cart, an order has been placed, a payment is pending.
* **"Setup"** means establishing that particular state before you execute the main action you want to test.

The rule dictates that you should **NOT** directly manipulate the internal workings of your system to get it into a desired state.

### What it **forbids** (common anti-patterns):

* **Direct database manipulation:** You should *not* directly insert, update, or delete records in your `testDb` to create a pre-existing condition (e.g., manually inserting a `user` record to test `login`).
* **Bypassing public APIs/actions:** If your concept defines actions (like `createUser`, `addItemToCart`, `placeOrder`), you should *not* find internal, non-public methods or directly set private properties to achieve the same result in your tests.
* **Initializing objects with pre-baked data that doesn't flow through actions:** Your test setup shouldn't involve creating complex data structures from scratch that represent a state, without those structures being the result of previously executed concept actions.

### What it **allows** and **requires**:

* **"Except by calling concept actions":** This is the critical qualifier. You *must* use the defined public actions of your concept to put the system into any necessary pre-conditions.
  * If you need a user to exist, call the `createUser` action.
  * If you need an item in a shopping cart, call the `addItemToCart` action.
  * If you need an order placed, you'd typically call `createUser`, then `addItemToCart`, then `placeOrder`.

***

## "When you are testing one action at a time, this means that you will want to order your actions carefully (for example, by the operational principle) to avoid having to set up state."

This explains *how* to adhere to the "no state setup" rule effectively, especially when focusing on individual actions.

* **"Ordering your actions carefully":** This means thinking about the logical dependencies between actions. If action `B` requires a certain state established by action `A`, then your test for `B` will necessarily start by invoking `A`.
  * You can't test `confirmOrder` if no order has been `placed`. So, a test for `confirmOrder` will include calls to `createUser`, `addItemToCart`, and `placeOrder` *before* it calls `confirmOrder`.
* **"By the operational principle":** The concept specification likely describes a high-level "principle" or workflow. This rule encourages you to use this natural flow to build up your test scenarios. The sequence of actions in your tests should mimic the real-world usage and the logical progression of operations defined by your concept. This ensures that the state created is always valid and reachable through normal system interactions.

***

## Why is this rule important? (The benefits)

1. **Tests Realism and Integrity:** Your tests become a true reflection of how your system is *meant* to be used. You're not "cheating" to get to a state; you're demonstrating that the system can reach that state through its own defined actions.
2. **Increased Test Robustness:** If the `createUser` action has a bug, any test for `login` (which would call `createUser` first) will automatically fail. This means your setup phase is itself being tested, making your test suite more comprehensive. If you directly inserted a user into the database, a bug in `createUser` might go unnoticed until later.
3. **Better Maintainability:** Tests that rely only on public concept actions are less brittle. If the internal implementation of `createUser` changes (e.g., how it stores data in the `testDb`), your `login` test won't break as long as `createUser`'s public interface and behavior remain consistent. Direct database manipulation would likely break with internal schema changes.
4. **Clearer Test Intent:** Tests become more readable because they tell a story: "First, we create a user. Then, that user logs in. Now, we add an item to their cart..." This makes it easier for anyone to understand what behavior is being tested.
5. **Focus on External Behavior (Black-box testing):** This rule strongly encourages testing the observable behavior of your concept (what it *does*) rather than its internal implementation details (how it *does it*). This aligns perfectly with concept testing, which aims to validate the conceptual model.

***

### Example: Testing a `placeOrder` action

Let's imagine a concept with actions like `createUser`, `loginUser`, `addItemToCart`, and `placeOrder`.

**Bad State Setup (Violates the rule):**

```typescript
Deno.test("Place Order - bad setup", async () => {
  const [db, client] = await testDb();

  // FORBIDDEN: Directly manipulate the database to create a user and cart
  await db.query(`INSERT INTO users (id, name, email) VALUES ('user-123', 'John Doe', 'john@example.com');`);
  await db.query(`INSERT INTO carts (id, user_id) VALUES ('cart-456', 'user-123');`);
  await db.query(`INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ('cart-456', 'prod-789', 2);`);

  // Assume user is "logged in" by setting some internal state
  const loggedInUserId = 'user-123'; // FORBIDDEN: bypassing login action

  // Now, try to place the order
  const orderResult = await yourConcept.placeOrder({ userId: loggedInUserId });

  // ... assertions
  await client.close();
});
```

**Good State Setup (Follows the rule):**

```typescript
import { testDb } from "@utils/database.ts";
import { assertEquals } from "jsr:@std/assert";
// Assume your concept actions are imported from your concept file
import * as yourConcept from "../yourConcept/yourConcept.ts";

Deno.test("Place Order - good setup", async () => {
  const [db, client] = await testDb();

  // REQUIRED: Use concept actions to establish the necessary state
  const createUserResult = await yourConcept.createUser({ name: "Jane Doe", email: "jane@example.com", password: "securepassword" });
  assertEquals(createUserResult.status, "success");
  const userId = createUserResult.userId; // Get the user ID from the action's return

  const loginResult = await yourConcept.loginUser({ email: "jane@example.com", password: "securepassword" });
  assertEquals(loginResult.status, "success");
  const userSessionToken = loginResult.sessionToken; // Get session token if concept uses it

  const addItemsResult1 = await yourConcept.addItemToCart({ userId: userId, productId: "prod-A", quantity: 1, sessionToken: userSessionToken });
  assertEquals(addItemsResult1.status, "success");
  const addItemsResult2 = await yourConcept.addItemToCart({ userId: userId, productId: "prod-B", quantity: 3, sessionToken: userSessionToken });
  assertEquals(addItemsResult2.status, "success");

  // Now, test the specific action: placeOrder
  const placeOrderResult = await yourConcept.placeOrder({ userId: userId, sessionToken: userSessionToken });
  assertEquals(placeOrderResult.status, "success");
  assertEquals(typeof placeOrderResult.orderId, "string");
  // ... further assertions on the state change (e.g., cart is empty, order exists, payment status)

  await client.close();
});
```

In the "good setup" example, every pre-condition for `placeOrder` (user exists, user is logged in, items are in the cart) is established by calling the concept's own actions. This not only makes the `placeOrder` test more realistic but also indirectly validates the entire workflow leading up to it.
