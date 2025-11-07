---
timestamp: 'Thu Nov 06 2025 10:02:58 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_100258.b4c9a359.md]]'
content_id: ad76c017a05af7e17139779a1d2da9296ba6c3c997cffb98729e92f8c6821c28
---

# file: src/PasswordAuthentication/PasswordAuthenticationConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

/**
 * @concept PasswordAuthentication
 * @purpose limit access to known users
 * @principle after a user registers with a username and password,
 * they can authenticate with that same username and password
 * and be treated each time as the same user
 */

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuthentication" + ".";

// Generic types of this concept. User is an external identifier.
type User = ID;

/**
 * @state
 * a set of Users with
 *   a username String
 *   a password String
 */
interface UserDoc {
  _id: User; // The unique identifier for the user
  username: string; // The user's chosen username
  password: string; // The user's password (NOTE: In a real app, this MUST be hashed and salted!)
}

export default class PasswordAuthenticationConcept {
  // MongoDB collection to store user authentication data
  private users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection<UserDoc>(PREFIX + "users");
  }

  /**
   * @action register
   * @param {object} args - The input arguments for the action.
   * @param {string} args.username - The desired username for the new user.
   * @param {string} args.password - The desired password for the new user.
   * @returns {Promise<{user: User} | {error: string}>} Returns the ID of the new user on success, or an error message.
   *
   * @requires this username doesn't already exist
   * @effects creates a new User with this username and this password
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Precondition check: username must not already exist
    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already exists." };
    }
    if (!username) {
      return { error: "Username cannot be empty." };
    }

    // Effect: Create a new user record
    const newUser: UserDoc = {
      _id: freshID() as User, // Generate a fresh unique ID for the new user
      username,
      password, // WARNING: In a production application, passwords must be securely hashed and salted!
    };

    // Insert the new user into the database
    await this.users.insertOne(newUser);

    // Return the ID of the newly registered user
    return { user: newUser._id };
  }

  /**
   * @action authenticate
   * @param {object} args - The input arguments for the action.
   * @param {string} args.username - The username provided for authentication.
   * @param {string} args.password - The password provided for authentication.
   * @returns {Promise<{user: User} | {error: string}>} Returns the ID of the authenticated user on success, or an error message.
   *
   * @requires this username exists in the Users set, input password matches username's preexisting password
   * @effects User is successfully authenticated and returns the User
   */
  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Find the user by their username
    const user = await this.users.findOne({ username });

    // Precondition check: user must exist and provided password must match
    if (!user || user.password !== password) {
      // NOTE: In a real application, password comparison should be constant-time to prevent timing attacks.
      return { error: "Invalid username or password." };
    }

    // Effect: (Authentication is a read-only operation; no state change for this action.)
    // Return the ID of the successfully authenticated user
    return { user: user._id };
  }

  /**
   * @query _getUserById
   * @param {object} args - The input arguments for the query.
   * @param {User} args.user - The ID of the user to find.
   * @returns {Promise<Array<{userDoc: UserDoc}>>} Returns an array containing the user document if found.
   * @effects returns the user document if found by ID
   */
  async _getUserById({ user }: { user: User }): Promise<{ userDoc: UserDoc }[]> {
    const foundUser = await this.users.findOne({ _id: user });
    return foundUser ? [{ userDoc: foundUser }] : [];
  }

  /**
   * @query _getUserByUsername
   * @param {object} args - The input arguments for the query.
   * @param {string} args.username - The username to search for.
   * @returns {Promise<Array<{userDoc: UserDoc}>>} Returns an array containing the user document if found.
   * @effects returns the user document if found by username
   */
  async _getUserByUsername({ username }: { username: string }): Promise<{ userDoc: UserDoc }[]> {
    const user = await this.users.findOne({ username });
    return user ? [{ userDoc: user }] : [];
  }
}
```

Now, here are the synchronizations that orchestrate the `Requesting`, `PasswordAuthentication`, and `Sessioning` concepts together.
