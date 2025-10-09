---
timestamp: 'Thu Oct 09 2025 10:41:29 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251009_104129.9f2ec32a.md]]'
content_id: fc50f96b8635fd5c81d23ae434a4eeb00ee290d83b24243c37a4ed7ecde30971
---

# file: src/Library/LibraryConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";

// Mocking utils for demonstration purposes in a standalone file.
// In a real project, these would be imported from `@utils/types.ts` and `@utils/database.ts`
type ID = string & { _brand: "ID" };
type Empty = Record<PropertyKey, never>;
const freshID = () => `id:${Math.random().toString(36).substring(2, 15)}` as ID;


/**
 * @concept Library [User, Item]
 * @purpose allow users to borrow and return items, and manage item availability.
 * @principle If a user borrows an available item, they become its borrower until they return it, making it available again. If an item is not available, a user can request it and be notified when it becomes available.
 */
const PREFIX = "Library" + ".";

// Generic types for this concept, typically IDs from other concepts.
type User = ID;
type Item = ID;

/**
 * Represents an item in the library's state.
 * Corresponds to: "a set of Items with a title String, an author String,
 * a borrower User (optional), a requests list of User"
 */
interface LibraryItem {
  _id: Item;
  title: string;
  author: string;
  borrower?: User; // Optional: an item might not be borrowed
  requests: User[]; // List of users requesting the item
}

export default class LibraryConcept {
  private items: Collection<LibraryItem>;

  constructor(private readonly db: Db) {
    this.items = this.db.collection(PREFIX + "items");
  }

  /**
   * @action addItem (title: String, author: String): (item: Item)
   * @requires true
   * @effects creates a new Item with the given title and author, initially not borrowed and no requests.
   */
  async addItem({
    title,
    author,
  }: {
    title: string;
    author: string;
  }): Promise<{ item: Item }> {
    const newItem: LibraryItem = {
      _id: freshID(), // Generate a new ID for the item
      title,
      author,
      requests: [],
    };
    await this.items.insertOne(newItem);
    return { item: newItem._id };
  }

  /**
   * @action removeItem (item: Item): (error: String) (success: Empty)
   * @requires item exists and has no borrower and no pending requests.
   * @effects removes the item from the library.
   */
  async removeItem({ item }: { item: Item }): Promise<Empty | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }
    if (existingItem.borrower) {
      return { error: "Cannot remove item while it is borrowed." };
    }
    if (existingItem.requests && existingItem.requests.length > 0) {
      return { error: "Cannot remove item while it has pending requests." };
    }

    await this.items.deleteOne({ _id: item });
    return {};
  }

  /**
   * @action borrowItem (user: User, item: Item): (error: String) (success: Empty)
   * @requires item exists, item is not borrowed.
   * @effects sets the item's borrower to the user. If the user was in the item's request list, they are removed.
   */
  async borrowItem({
    user,
    item,
  }: {
    user: User;
    item: Item;
  }): Promise<Empty | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }
    if (existingItem.borrower) {
      return { error: `Item is already borrowed by ${existingItem.borrower}.` };
    }

    // Update item: set borrower and remove user from requests if present
    await this.items.updateOne(
      { _id: item },
      { $set: { borrower: user }, $pull: { requests: user } },
    );
    return {};
  }

  /**
   * @action returnItem (user: User, item: Item): (error: String) (success: Empty)
   * @requires item exists, and user is the item's borrower.
   * @effects sets the item's borrower to null.
   */
  async returnItem({
    user,
    item,
  }: {
    user: User;
    item: Item;
  }): Promise<Empty | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }
    if (existingItem.borrower !== user) {
      return { error: "Item is not currently borrowed by this user." };
    }

    // Unset the borrower field
    await this.items.updateOne({ _id: item }, { $unset: { borrower: "" } });
    return {};
  }

  /**
   * @action requestItem (user: User, item: Item): (error: String) (success: Empty)
   * @requires item exists, and user is not already borrowing or in the requests list for this item.
   * @effects adds the user to the item's requests list (at the end).
   */
  async requestItem({
    user,
    item,
  }: {
    user: User;
    item: Item;
  }): Promise<Empty | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }
    if (existingItem.borrower === user) {
      return { error: "User is currently borrowing this item." };
    }
    if (existingItem.requests && existingItem.requests.includes(user)) {
      return { error: "User has already requested this item." };
    }

    // Add user to the requests list
    await this.items.updateOne({ _id: item }, { $push: { requests: user } });
    return {};
  }

  /**
   * @action cancelRequest (user: User, item: Item): (error: String) (success: Empty)
   * @requires item exists, and user is in the item's requests list.
   * @effects removes the user from the item's requests list.
   */
  async cancelRequest({
    user,
    item,
  }: {
    user: User;
    item: Item;
  }): Promise<Empty | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }
    if (!existingItem.requests || !existingItem.requests.includes(user)) {
      return { error: "User has not requested this item." };
    }

    // Remove user from the requests list
    await this.items.updateOne({ _id: item }, { $pull: { requests: user } });
    return {};
  }

  /**
   * @query _getAvailableItems (): (items: Item[])
   * @effects returns a list of items that are currently not borrowed.
   */
  async _getAvailableItems(): Promise<{ items: Item[] }> {
    const availableItems = await this.items
      .find({ borrower: { $exists: false } }) // Items with no 'borrower' field
      .project({ _id: 1 }) // Only return the ID
      .toArray();
    return { items: availableItems.map((item) => item._id) };
  }

  /**
   * @query _getBorrowedItemsByUser (user: User): (items: Item[])
   * @effects returns a list of items currently borrowed by the specified user.
   */
  async _getBorrowedItemsByUser({
    user,
  }: {
    user: User;
  }): Promise<{ items: Item[] }> {
    const borrowedItems = await this.items
      .find({ borrower: user })
      .project({ _id: 1 })
      .toArray();
    return { items: borrowedItems.map((item) => item._id) };
  }

  /**
   * @query _getItemDetails (item: Item): (title: String, author: String, borrower: User, requests: User[])
   * @effects returns the details of a specific item.
   */
  async _getItemDetails({
    item,
  }: {
    item: Item;
  }): Promise<{
    title: string;
    author: string;
    borrower?: User;
    requests: User[];
  } | { error: string }> {
    const existingItem = await this.items.findOne({ _id: item });

    if (!existingItem) {
      return { error: "Item not found." };
    }

    return {
      title: existingItem.title,
      author: existingItem.author,
      borrower: existingItem.borrower,
      requests: existingItem.requests,
    };
  }
}
```
