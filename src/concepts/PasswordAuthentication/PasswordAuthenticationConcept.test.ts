import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import PasswordAuthenticationConcept from "./PasswordAuthenticationConcept.ts";

const USERNAME_A = "Alice";
const PASSWORD_A = "password";
const USERNAME_B = "Bob";
const PASSWORD_B = "bob";

Deno.test("PasswordAuthentication: Principle: User registers with a username and password, then they can login with the same username and password and be treated as the same user", async (t) => {
  const [db, client] = await testDb();
  const passwordAuthConcept = new PasswordAuthenticationConcept(db);

  let registeredUserId: ID;

  await t.step(
    "1. User successfully creates account with username and password",
    async () => {
      const registerUserResult = await passwordAuthConcept.register({
        username: USERNAME_A,
        password: PASSWORD_A,
      });
      assertNotEquals(
        "error" in registerUserResult,
        true,
        "Register new user should not fail.",
      );
      const { user } = registerUserResult as { user: ID };
      assertExists(user);
      registeredUserId = (registerUserResult as { user: ID }).user;
    },
  );

  await t.step(
    "2. User can authenticate with the same username and password",
    async () => {
      const authenticateResult = await passwordAuthConcept.authenticate({
        username: USERNAME_A,
        password: PASSWORD_A,
      });
      assertNotEquals(
        "error" in authenticateResult,
        true,
        "Authentication with correct credentials should succeed.",
      );
      const authenticatedUserId = (authenticateResult as { user: ID }).user;
      assertExists(authenticatedUserId, "Authenticated user ID should exist.");
    },
  );

  await t.step(
    "3. Verify Identity: Re-authentication confirms the user is treated as the same user.",
    async () => {
      const reAuthResult = await passwordAuthConcept.authenticate({
        username: USERNAME_A,
        password: PASSWORD_A,
      });
      assertNotEquals(
        "error" in reAuthResult,
        true,
        "Re-authentication should succeed.",
      );
      assertEquals(
        (reAuthResult as { user: ID }).user,
        registeredUserId,
        "Re-authenticated user ID should still match the original registered ID.",
      );
    },
  );
  await client.close();
});

Deno.test("Action: register", async (t) => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);

  let bRegisterId: ID;
  await t.step(
    "1. Effects: successful registration creates a user and its state is verifiable.",
    async () => {
      const result = await concept.register({
        username: USERNAME_B,
        password: PASSWORD_B,
      });
      assertNotEquals(
        "error" in result,
        true,
        `Registration of ${USERNAME_B} should succeed.`,
      );
      const userId = (result as { user: ID }).user;
      assertExists(userId, "A user ID should be returned.");
      const { user: storedUser } = await concept._getUserByUsername({
        username: USERNAME_B,
      });
      assertExists(
        storedUser,
        `User ${USERNAME_B} should be found in the database.`,
      );
      assertEquals(
        storedUser!._id,
        userId,
        "Stored user ID should match returned ID.",
      );
      assertEquals(
        storedUser!.username,
        USERNAME_B,
        "Stored username should match input username.",
      );
      assertEquals(
        storedUser!.password,
        PASSWORD_B,
        "Stored password should match input password.",
      );
      bRegisterId = (result as { user: ID }).user;
    },
  );

  await t.step("2. Cannot register with an existing username", async () => {
    // attempting to rereg with username b
    const result = await concept.register({
      username: USERNAME_B,
      password: "diff password",
    });
    assertEquals(
      "error" in result,
      true,
      "Registering with an existing username should return an error.",
    );
    assertEquals(
      (result as { error: string }).error,
      "Username already exists.",
      "Error message should state username already exists.",
    );

    // verify no new user has been created, and original user and password remains
    const { user: storedUser } = await concept._getUserByUsername({
      username: USERNAME_B,
    });
    assertExists(storedUser, `User ${USERNAME_B} should still exist.`);
    assertEquals(
      storedUser!._id,
      bRegisterId,
      "The user ID should remain the same (no new user).",
    );
    assertEquals(
      storedUser!.password,
      PASSWORD_B,
      "The original user's password should not have changed.",
    );
  });
  await client.close();
});

Deno.test("Action: authenticate", async (t) => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);
  concept.register({ username: USERNAME_A, password: PASSWORD_A });

  await t.step(
    "1. User cannot authenticate with incorrect password",
    async () => {
      const authResult = await concept.authenticate({
        username: USERNAME_A,
        password: PASSWORD_B,
      });
      assertEquals(
        "error" in authResult,
        true,
        "Authentication with wrong password should fail.",
      );
      assertEquals(
        (authResult as { error: string }).error,
        "Password does not match!",
        "Error message for wrong password should be correct.",
      );
    },
  );

  await t.step(
    "2. User cannot authenticate with a nonexistent username",
    async () => {
      const authResult = await concept.authenticate({
        username: "alice?",
        password: PASSWORD_A,
      });
      assertEquals(
        "error" in authResult,
        true,
        "Authentication with wrong password should fail.",
      );
      assertEquals(
        (authResult as { error: string }).error,
        `Invalid username: there is no user with username alice?`,
        "Error message for non-existent username should be correct.",
      );
    },
  );
  await client.close();
});

Deno.test("Edge Cases: Empty/Case sensitive inputs", async (t) => {
  const [db, client] = await testDb();
  const concept = new PasswordAuthenticationConcept(db);

  const USERNAME_CASE_SENSITIVE = "CaseSensitiveUser";
  const USERNAME_LOWER_CASE = "casesensitiveuser";
  const PASSWORD_NORMAL = "secret123";
  const PASSWORD_CASE_SENSITIVE = "MyPassword123";
  const PASSWORD_LOWER_CASE = "mypassword123";

  await t.step("1. Register with empty username", async () => {
    const resultEmptyUser = await concept.register({
      username: "",
      password: PASSWORD_NORMAL,
    });
    assertEquals(
      "error" in resultEmptyUser,
      true,
      "Registering with an empty username is not allowed",
    );
  });

  await t.step("2. Register with empty password", async () => {
    const resultEmptyPass = await concept.register({
      username: USERNAME_A,
      password: "",
    });
    assertNotEquals(
      "error" in resultEmptyPass,
      true,
      "Registering with an empty password should not implicitly fail.",
    );
    const emptyPassId = (resultEmptyPass as { user: ID }).user;
    assertExists(
      emptyPassId,
      "An ID should be returned for empty password registration.",
    );
  });

  await t.step("3. Usernames are case sensitive", async () => {
    const regResult = await concept.register({
      username: USERNAME_CASE_SENSITIVE,
      password: PASSWORD_NORMAL,
    });
    assertNotEquals(
      "error" in regResult,
      true,
      "Initial registration with case sensitive username should succeed.",
    );
    const registeredUserId = (regResult as { user: ID }).user;

    // LOGGING WITH DIFFERENT CASE USERNAME
    const authResultDiffCase = await concept.authenticate({
      username: USERNAME_LOWER_CASE,
      password: PASSWORD_CASE_SENSITIVE,
    });
    assertEquals(
      "error" in authResultDiffCase,
      true,
      "Authentication with different case username should fail.",
    );
    assertEquals(
      (authResultDiffCase as { error: string }).error,
      `Invalid username: there is no user with username ${USERNAME_LOWER_CASE}`,
      "Error message should indicate non-existent username.",
    );

    // REGISTERING WITH DIFFERENT CASE USERNAME
    const registerDiffCaseResult = await concept.register({
      username: USERNAME_LOWER_CASE,
      password: PASSWORD_CASE_SENSITIVE,
    });
    assertNotEquals(
      "error" in registerDiffCaseResult,
      true,
      "Registering a different-cased username should succeed as it's distinct.",
    );
    const registeredUserIdDiffCase =
      (registerDiffCaseResult as { user: ID }).user;
    assertNotEquals(
      registeredUserId,
      registeredUserIdDiffCase,
      "Different-cased usernames should have different IDs.",
    );

    // AUTHENTICATE WITH LOWERCASE USERNAME - SHOULD WORK
    const authResultLowerCase = await concept.authenticate({
      username: USERNAME_LOWER_CASE,
      password: PASSWORD_CASE_SENSITIVE,
    });
    assertNotEquals(
      "error" in authResultLowerCase,
      true,
      "Authentication for the newly registered lower-case user should succeed.",
    );
    assertEquals(
      (authResultLowerCase as { user: ID }).user,
      registeredUserIdDiffCase,
      "Authenticated ID should match.",
    );

    // should not work with lowercase username and case sensitive password
    const authLowerUserCasePassResult = await concept.authenticate({
      username: USERNAME_LOWER_CASE,
      password: PASSWORD_NORMAL,
    });
    assertEquals(
      "error" in authLowerUserCasePassResult,
      true,
      "User cannot authenticate with the lowercase username and the case sensitive's password",
    );
  });

  await t.step("4. Passwords are case sensitive", async () => {
    const username = "user";
    await concept.register({ username, password: PASSWORD_CASE_SENSITIVE });

    const authCorrectPass = await concept.authenticate({
      username,
      password: PASSWORD_CASE_SENSITIVE,
    });
    assertNotEquals(
      "error" in authCorrectPass,
      true,
      "Authentication with correct case password should succeed.",
    );

    const authWrongPass = await concept.authenticate({
      username,
      password: PASSWORD_LOWER_CASE,
    });
    assertEquals(
      "error" in authWrongPass,
      true,
      "Authentication with wrong case password should fail.",
    );
    assertEquals(
      (authWrongPass as { error: string }).error,
      "Password does not match!",
      "Error message for wrong password should be correct.",
    );
  });
  await client.close();
});
