---
timestamp: 'Wed Nov 05 2025 23:46:23 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251105_234623.44553c48.md]]'
content_id: 3b25283d9cc3ea1e87a1ac63e42cd25528183011328497f1a9d5902a0810a958
---

# response:

Yes, you absolutely **do need to implement synchronizations for authentication** if you exclude the auth-related routes from passthrough.

Here's why, based on the provided documentation:

1. **Excluding a Passthrough Route Changes its Behavior:**
   The document states: "Any routes that you **exclude** or do not match a passthrough route will automatically fire a `Request.request` action..."
   This means if you exclude, say, `/api/UserAuthentication/login` from passthrough, an incoming HTTP request to that path will *not* directly call the `UserAuthentication.login` action. Instead, it will cause a `Requesting.request` action to occur, containing the path and any other parameters from the HTTP request body.

2. **Synchronizations are the Mechanism to Handle `Requesting.request`:**
   The purpose of the `Requesting` concept and `Requesting.request` actions is to "reify requests," giving you the opportunity to apply custom logic before any underlying concept actions are performed. You do this by writing synchronizations that `when` a `Requesting.request` occurs.

3. **Implementing Auth Logic via Syncs:**
   For authentication, you would typically:
   * Create a synchronization that `when` a `Requesting.request` for your login/register path occurs.
   * In the `where` clause (or `then` clause), you would then call your `UserAuthentication` concept's actions (e.g., `login` or `register`) or queries (e.g., to check credentials).
   * Based on the success or failure of the `UserAuthentication` actions, you would then `then` trigger `Requesting.respond` to send an appropriate HTTP response back to the client (e.g., a session ID, an error message).

**In essence:**
If you exclude an auth route from passthrough, you are explicitly choosing *not* to allow direct execution of the underlying concept action. This is usually done precisely because you *want* to intercept the request and apply custom logic, such as:

* Adding authorization checks.
* Logging the request/response flow.
* Integrating with other concepts (e.g., creating a session after successful login).

Synchronizations are the designated way to implement this custom logic for reified requests.
