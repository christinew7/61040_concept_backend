---
timestamp: 'Thu Nov 06 2025 10:20:34 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_102034.0a11ce98.md]]'
content_id: 059723769df955e337fbe31d5746b681b92737ffdbf76d8a1815ee7499038325
---

# file: src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts

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

    // Return the ID of the successfully authenticated user
    return { user: user._id };
  }

  /**
   * @query _getUsername
   * @param {object} args - The input arguments for the query.
   * @param {User} args.user - The ID of the user to look up.
   * @returns {Promise<Array<{username: string}>>} Returns an array containing the username if the user is found.
   *
   * @requires user exists
   * @effects returns the username of the user
   */
  async _getUsername({ user }: { user: User }): Promise<{ username: string }[]> {
    const foundUser = await this.users.findOne({ _id: user });

    if (!foundUser) {
      return []; // Return an empty array if the user is not found, as per query return type requirement.
    }

    return [{ username: foundUser.username }];
  }

  /**
   * @query _getUserByUsername
   * @param {object} args - The input arguments for the query.
   * @param {string} args.username - The username to search for.
   * @returns {Promise<Array<{user: UserDoc}>>} Returns an array with the user document if found by username.
   *
   * @effects returns the user document if found by username
   */
  async _getUserByUsername(
    { username }: { username: string },
  ): Promise<{ user: UserDoc }[]> {
    const user = await this.users.findOne({ username });
    return user ? [{ user }] : [];
  }
}
```

Now, here is the synchronization that uses this new query to handle the request.
