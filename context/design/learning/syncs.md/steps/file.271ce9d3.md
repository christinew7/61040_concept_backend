---
timestamp: 'Thu Nov 06 2025 18:58:41 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_185841.2e8e7f23.md]]'
content_id: 271ce9d34b7aea79a8f9720dd0b96d2ce89c7dc1dd2ee3ce04c89fa64ae8fdbb
---

# file: src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts

```typescript
/*
 * @concept PasswordAuthentication
 * @purpose limit access to known users
 * @principle after a user registers with a username and password,
 * they can authenticate with that same username and password
 * and be treated each time as the same user
 */

import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Declare collection prefix, use concept name
const PREFIX = "PasswordAuthentication" + ".";

// Generic types of this concept. User is an external identifier.
type User = ID;

/**
 * a set of Users with
 *   a username String
 *   a password String
 */
interface UserDoc {
  _id: User;
  username: string;
  password: string; // (NOTE: In a real app, this MUST be hashed and salted!)
}

/**
 * @concept PasswordAuthentication
 * @purpose Limit access to known users
 */
export default class PasswordAuthenticationConcept {
  private users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection<UserDoc>(PREFIX + "users");
  }

  /**
   * @action register
   * @param username - The desired username for the new user.
   * @param password - The desired password for the new user.
   * @returns {Promise<{user: User} | {error: string}>} Returns the ID of the new user on success, or an error message.
   *
   * @requires a User with the given username doesn't already exist, this username is not empty
   * @effects creates a new User with the given username and password and a unique ID
   */
  async register(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    if (!username) {
      return { error: "Username cannot be empty." };
    }

    const existingUser = await this.users.findOne({ username });
    if (existingUser) {
      return { error: "Username already exists." };
    }

    const newUser: UserDoc = {
      _id: freshID(),
      username,
      password,
    };
    await this.users.insertOne(newUser);
    return { user: newUser._id };
  }

  /**
   * @action authenticate
   * @param username - The username provided for authentication.
   * @param password - The password provided for authentication.
   * @returns {Promise<{user: User} | {error: string}>} Returns the ID of the authenticated user on success, or an error message.
   *
   * @requires the user with the given username exists, input password matches username's preexisting password
   * @effects User is successfully authenticated and returns the User
   */
  async authenticate(
    { username, password }: { username: string; password: string },
  ): Promise<{ user: User } | { error: string }> {
    // Find the user by their username
    const user = await this.users.findOne({ username });

    if (!user) {
      return {
        error: `Invalid username: there is no user with username ${username}`,
      };
    }
    if (user.password !== password) {
      return { error: "Password does not match!" };
    }

    return { user: user._id };
  }

  /**
   * @query _getUserByUsername
   * @param username - The username to search for.
   * @returns {Promise<{user?: UserDoc}>} Returns the full user document if found, otherwise an empty object.
   *
   * @effects returns the user document if found by username
   */
  async _getUserByUsername(
    { username }: { username: string },
  ): Promise<{ user?: UserDoc }> {
    const user = await this.users.findOne({ username });
    return user ? { user } : {};
  }

  /**
   * @query _getUsername
   * @param userId - the userId of the user
   * @returns {Promise<{ username?: string }>} username of the user with userId if found, otherwise an empty object
   */
  async _getUsername(
    { userId }: { userId: User },
  ): Promise<{ username?: string }> {
    const user = await this.users.findOne({ _id: userId });
    return user ? { username: user.username } : {};
  }
}

```
