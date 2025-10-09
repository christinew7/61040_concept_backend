---
timestamp: 'Thu Oct 09 2025 10:41:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251009_104129.9f2ec32a.md]]'
content_id: 823b1cf6147abba2f9dd64aeda505a57c3e4ad7dac5833076bf57289f2a07f44
---

# concept: Library \[User, Item]

**purpose** allow users to borrow and return items, and manage item availability.

**principle** If a user borrows an available item, they become its borrower until they return it, making it available again. If an item is not available, a user can request it and be notified when it becomes available.

**state**
a set of Items with
a title String
an author String
a borrower User (optional)
a requests list of User
// Note: The `Library` concept itself doesn't explicitly manage users beyond their IDs.
// User IDs are external references provided by other concepts (e.g., `UserAuthentication`).

**actions**
addItem (title: String, author: String): (item: Item)
**requires** true
**effects** creates a new Item with the given title and author, initially not borrowed and no requests.

removeItem (item: Item): (error: String) (success: Empty)
**requires** item exists and has no borrower and no pending requests.
**effects** removes the item from the library.

borrowItem (user: User, item: Item): (error: String) (success: Empty)
**requires** item exists, item is not borrowed.
**effects** sets the item's borrower to the user. If the user was in the item's request list, they are removed.

returnItem (user: User, item: Item): (error: String) (success: Empty)
**requires** item exists, and user is the item's borrower.
**effects** sets the item's borrower to null.

requestItem (user: User, item: Item): (error: String) (success: Empty)
**requires** item exists, and user is not already borrowing or in the requests list for this item.
**effects** adds the user to the item's requests list (at the end).

cancelRequest (user: User, item: Item): (error: String) (success: Empty)
**requires** item exists, and user is in the item's requests list.
**effects** removes the user from the item's requests list.

**queries**
\_getAvailableItems (): (items: Item\[])
**effects** returns a list of items that are currently not borrowed.

\_getBorrowedItemsByUser (user: User): (items: Item\[])
**effects** returns a list of items currently borrowed by the specified user.

\_getItemDetails (item: Item): (title: String, author: String, borrower: User, requests: User\[])
**effects** returns the details of a specific item.

***
