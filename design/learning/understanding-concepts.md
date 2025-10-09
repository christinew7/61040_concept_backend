[@concept-design-overview](../background/concept-design-overview.md)

# question: How should concepts be formatted 


# response:

Based on the provided text, a concept should be formatted as a self-contained specification that defines its purpose, state, actions, and user-facing behavior, while explicitly highlighting its independence and reusability.

Here's a suggested structured format for defining a "concept":

---

### **Concept Name:** [e.g., Upvote, RestaurantReservation, Post, Comment]

*   **Identifier:** A unique name for the concept.

#### 1. Purpose & Description
*   A concise, user-intelligible explanation of the concept's core function and value.
*   *Example:* "To allow users to express approval or disapproval of items, thereby ranking them by popularity."

#### 2. State
*   Describes the kinds of objects and relationships the concept maintains.
*   Emphasize *only* the information necessary for the concept's behavior, and *nothing more*.
*   Specify the properties/attributes associated with these objects/relationships *within this concept*.
*   *Example (Upvote):*
    *   **Objects:**
        *   `Item`: Represents any entity that can be upvoted/downvoted. (Only its identity is relevant to `Upvote`.)
        *   `User`: Represents an individual performing the vote. (Only their identity is relevant to `Upvote`.)
    *   **Relationships:**
        *   `Vote`: Maps a `User` to an `Item` with a `VoteType` (e.g., 'up', 'down').
    *   *Rationale for State:* The `Vote` relationship is essential to prevent double voting and track overall popularity. No other user or item details are needed by `Upvote`.

#### 3. Actions
*   Lists all atomic actions that can be performed *on* or *by* the concept.
*   Each action should specify:
    *   **Name:** A verb or verb phrase.
    *   **Type:** User-initiated (performed by a user) or Spontaneous Output (performed by the concept itself).
    *   **Parameters:** The input arguments required for the action. Emphasize polymorphic types (e.g., `itemId: ID`, `userId: ID`) to maintain independence.
    *   **Preconditions:** Any conditions that must be true for the action to succeed (related to the concept's state).
    *   **Postconditions / Effects:** The changes to the concept's state, and any output actions that occur spontaneously *from within this concept*.
*   *Example (Upvote):*
    *   **`upvote(itemId: ID, userId: ID)`**
        *   **Type:** User-initiated
        *   **Parameters:** `itemId` (the ID of the item being voted on), `userId` (the ID of the user voting).
        *   **Preconditions:** `userId` has not previously voted on `itemId` OR `userId` previously downvoted `itemId`.
        *   **Effects:** If no prior vote, a `Vote` of type 'up' is recorded for `itemId` by `userId`. If prior downvote, existing `Vote` is changed to 'up'.
    *   **`downvote(itemId: ID, userId: ID)`**
        *   **Type:** User-initiated
        *   **Parameters:** `itemId`, `userId`
        *   **Preconditions:** `userId` has not previously voted on `itemId` OR `userId` previously upvoted `itemId`.
        *   **Effects:** If no prior vote, a `Vote` of type 'down' is recorded for `itemId` by `userId`. If prior upvote, existing `Vote` is changed to 'down'.
    *   **`retractVote(itemId: ID, userId: ID)`**
        *   **Type:** User-initiated
        *   **Parameters:** `itemId`, `userId`
        *   **Preconditions:** `userId` has previously voted on `itemId`.
        *   **Effects:** The `Vote` associated with `itemId` and `userId` is removed.

#### 4. Human Protocol / User Experience
*   Describes the observable pattern of behavior from a human user's perspective. How does the user typically interact with this concept?
*   *Example (RestaurantReservation):* "Users reserve a table, optionally cancel it, and are then seated upon arrival at the restaurant."

#### 5. Design Principles & Rationale
*   **Reusability:**
    *   Examples of diverse applications where this concept can be applied.
    *   *Example (Upvote):* "Applicable to comments in news articles, answers on Q&A sites, products in e-commerce, social media posts, etc."
*   **Independence:**
    *   Explicitly states that the concept is defined without reference to other concepts and makes minimal assumptions about its environment or parameters.
    *   Highlights polymorphism in action arguments.
    *   *Example (Upvote):* "The concept does not know *what* an `Item` is beyond its identifier, nor *how* a `User` is authenticated. It focuses purely on the voting mechanism."
*   **Completeness:**
    *   Confirms that the concept handles all aspects of its described functionality without relying on other concepts to complete its behavior.
    *   *Example (Notification):* "The `Notification` concept itself handles the delivery mechanism (e.g., email, SMS) and doesn't 'call out' to a separate Emailing concept."
*   **Separation of Concerns:**
    *   Briefly explains which concerns *this* concept addresses, and which it explicitly *does not*.
    *   *Example (Upvote):* "Addresses ranking and user expression of approval. Does not handle user profiles, content management, or authentication."

#### 6. Implementation Notes (Optional)
*   Briefly describe the typical backend implementation and persistence strategy.
*   *Example (Upvote):* "Typically implemented as a backend service with a database table storing (itemId, userId, voteType, timestamp)."

#### 7. Related Concepts (Via Synchronizations) (Optional)
*   Lists other concepts that commonly interact with this one through *synchronizations* (not direct dependencies). This can hint at potential concept catalog entries.
*   *Example (Upvote):* "Often synced with `Session` (for identifying users), `UserAuthentication` (for authenticating users), and the specific content concept (e.g., `Post`, `Comment`)."

---

**In summary, a concept format should emphasize clarity, self-containment, and abstraction, making it evident that it's a modular, reusable building block defined by its behavior and state, independent of its specific application context.**