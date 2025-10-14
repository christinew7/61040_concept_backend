---
timestamp: 'Mon Oct 13 2025 20:14:31 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_201431.ee45355d.md]]'
content_id: 9584e72bc6982cad39f6c4e32d4448d54bae75acc63f912854d3051fa2b6da7e
---

# response:

This rule is a fundamental principle in good test design, especially when testing the *behavior* of a system rather than just its internal data structures.

Let's break down what it means:

## "No state setup"

This refers to **how you get your system into a particular condition or configuration before you test a specific action.**

* **"State"** means the current condition of your system. For example, in an e-commerce application, the state could be: "user is logged in," "shopping cart contains 3 items," "order has been placed," "item is out of stock."
* **"Setup"** means preparing that condition for your test.

The rule says you should **NOT** directly manipulate the system's internal state to get it ready for a test.

***

### What it **forbids** (and what people often *do* incorrectly):

* **Directly modifying database records:** Instead of calling `addItemToCart()`, you shouldn't directly insert a row into a `cart_items` table in your test setup.
* **Manipulating internal objects:** Don't bypass the public methods to set properties on an object. E.g., don't do `user.isLoggedIn = true;` if there's a `user.login()` action.
* **Using internal, non-public APIs for setup:** If a method isn't part of the exposed "concept actions" (the public interface), don't use it just for test setup.
* **Using mocks/stubs to *fake* a state that the system couldn't actually reach through its normal operations:** While mocks/stubs are useful, they shouldn't be used to bypass the system's own actions to establish a valid state.

### What it **allows** and **requires**:

* **"Except by calling concept actions":** This is the crucial part. You *should* set up the state of your system **only by interacting with it through its defined public actions or API.**
  * If you need a user to be logged in, call the `login()` action.
  * If you need an item in a shopping cart, call the `addItemToCart()` action.
  * If you need an order placed, call `placeOrder()` (after `addItemToCart()`, etc.).

***

## "When you are testing one action at a time, this means that you will want to order your actions carefully (for example, by the operational principle) to avoid having to set up state."

This explains *how* to achieve "no state setup" when testing individual actions.

* **"Ordering your actions carefully":** This means you need to think about the natural sequence of operations in your system.
  * You can't `checkout()` if there are no items in the cart. So, before testing `checkout()`, you must first `addItemToCart()`.
  * You can't `deactivateAccount()` if the account hasn't been `created()` yet.
* **"By the operational principle":** This refers to the logical flow of operations dictated by the system's business rules and design. What *must* happen before something else can happen? Follow that natural workflow in your tests.

***

### Why is this rule important? (The benefits)

1. **Realism:** Your tests will accurately reflect how a real user or another system would interact with your software. You're not "cheating" to get to a state.
2. **Robustness & Reliability:** If your tests only use public actions to set up state, then the *setup itself* is also being tested. If there's a bug in `addItemToCart()`, a test for `checkout()` that relies on `addItemToCart()` will indirectly catch that bug. If you directly manipulated the database, you might miss it.
3. **Maintainability:** Tests that use public actions are less brittle. If the internal implementation of how a cart stores items changes, but the `addItemToCart()` action remains the same, your tests won't break. If you were directly manipulating the database, they likely would.
4. **Clarity:** Tests are easier to read and understand because they tell a story of interaction that makes sense from the system's perspective.
5. **Focus on Behavior:** This rule encourages you to test the system's behavior and its exposed contract (API) rather than its internal implementation details.

***

### Example: Testing a "Checkout" action in an E-commerce system

**Bad State Setup (Forbidden by the rule):**

```python
def test_checkout_with_items():
    # Directly manipulate database or internal object
    db.session.add(CartItem(user_id=1, product_id=101, quantity=2))
    db.session.add(CartItem(user_id=1, product_id=102, quantity=1))
    db.session.commit()
    user.is_logged_in = True # Directly set an attribute

    # Now, test the checkout action
    result = app.checkout(user_id=1)
    assert result.status == "success"
    # ... further assertions
```

**Good State Setup (Following the rule):**

```python
def test_checkout_with_items():
    # Use concept actions to set up the state
    app.login(username="testuser", password="password") # Logs in the user
    app.add_item_to_cart(product_id=101, quantity=2) # Adds items
    app.add_item_to_cart(product_id=102, quantity=1) # Adds items

    # Now, test the checkout action
    result = app.checkout()
    assert result.status == "success"
    # ... further assertions
```

In the good example, the actions `login()` and `add_item_to_cart()` are called. This not only sets up the necessary state for the `checkout()` test but also implicitly verifies that `login()` and `add_item_to_cart()` are working correctly to establish that state.
