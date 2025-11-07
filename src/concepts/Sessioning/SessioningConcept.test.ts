import { assertEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { Empty, ID } from "@utils/types.ts";
import SessioningConcept from "./SessioningConcept.ts";

// Define some dummy IDs for testing
const MOCK_USER_ID = "testUser123" as ID;
const MOCK_OTHER_USER_ID = "anotherUser456" as ID;
const MOCK_NON_EXISTENT_SESSION_ID = "nonExistentSessionID789" as ID; // Unique ID to ensure it doesn't accidentally collide with freshID

Deno.test("Sessioning Concept Tests", async (test) => {
  // Initialize database and concept for the entire test suite
  const [db, client] = await testDb();
  const concept = new SessioningConcept(db);

  await test.step("Action: create - Creates a new session and associates it with a user", async () => {
    const { session: newSessionId } = await concept.create({
      user: MOCK_USER_ID,
    });

    // Confirm 'effects': A session ID is returned
    assertEquals(
      typeof newSessionId,
      "string",
      "Effect: A string session ID should be returned.",
    );

    // Further confirm 'effects': The session document exists in the database with the correct user
    const sessionDoc = await concept.sessions.findOne({ _id: newSessionId });
    assertEquals(
      sessionDoc?._id,
      newSessionId,
      "Effect: Session document should exist with the returned ID in the database.",
    );
    assertEquals(
      sessionDoc?.user,
      MOCK_USER_ID,
      "Effect: Session document should be associated with the correct user in the database.",
    );
  });

  let sharedExistingSessionId: ID; // This variable will store a session ID created for a positive _getUser test.

  await test.step("Action: _getUser - Returns the user for an existing session (positive case)", async () => {
    // Prerequisite: Create a session to retrieve
    const { session: tempSessionId } = await concept.create({
      user: MOCK_USER_ID,
    });
    sharedExistingSessionId = tempSessionId; // Store for potential later use if needed, though subsequent tests will create their own
    const [result] = await concept._getUser({
      session: sharedExistingSessionId,
    });

    // Confirm 'requires': The session existed
    assertEquals(
      "user" in result,
      true,
      "Requirement: Session must exist. Expected to return user data, not an error.",
    );

    // Confirm 'effects': Returns the correct user
    assertEquals(
      result,
      { user: MOCK_USER_ID },
      "Effect: Should return the user associated with the session.",
    );
  });

  await test.step("Action: _getUser - Returns error for a non-existent session (requires not met)", async () => {
    const [result] = await concept._getUser({
      session: MOCK_NON_EXISTENT_SESSION_ID,
    });

    // Confirm 'requires' not met: Session did not exist
    assertEquals(
      "error" in result,
      true,
      "Requirement: Session does not exist. Expected to return an error.",
    );

    // Confirm 'effects': Returns an error message
    assertEquals(
      result,
      { error: `Session with id ${MOCK_NON_EXISTENT_SESSION_ID} not found` },
      "Effect: Should return an error message for a non-existent session.",
    );
  });

  await test.step("Action: delete - Removes an existing session (positive case)", async () => {
    // Prerequisite: Create a session to delete
    const { session: sessionToDelete } = await concept.create({
      user: MOCK_OTHER_USER_ID,
    }); // Using a different user to emphasize isolation
    const deleteResult: Empty | { error: string } = await concept.delete({
      session: sessionToDelete,
    });

    // Confirm 'requires': The session existed
    assertEquals(
      deleteResult,
      {},
      "Requirement: Session existed. Expected successful deletion (empty object).",
    );
    // Confirm 'effects': Returns empty object
    assertEquals(
      deleteResult,
      {},
      "Effect: Should return an empty object on successful deletion.",
    );

    // Further confirm 'effects': The session no longer exists in the database
    const sessionDoc = await concept.sessions.findOne({ _id: sessionToDelete });
    assertEquals(
      sessionDoc,
      null,
      "Effect: Session document should no longer exist in the database after deletion.",
    );
  });

  await test.step("Action: delete - Returns error for a non-existent session (requires not met)", async () => {
    const deleteResult: Empty | { error: string } = await concept.delete({
      session: MOCK_NON_EXISTENT_SESSION_ID,
    });

    // Confirm 'requires' not met: Session did not exist
    assertEquals(
      "error" in deleteResult,
      true,
      "Requirement: Session does not exist. Expected to return an error.",
    );

    // Confirm 'effects': Returns an error message
    assertEquals(
      deleteResult,
      { error: `Session with id ${MOCK_NON_EXISTENT_SESSION_ID} not found` },
      "Effect: Should return an error message for a non-existent session.",
    );
  });

  // # trace: User Journey for Sessioning
  await test.step("Principle: User Journey - Login, Access, Logout", async () => {
    // 1. User logs in (implies creating a session)
    console.log("Trace Step 1: User logs in using user ID 'testUser123'.");
    const { session: userSessionId } = await concept.create({
      user: MOCK_USER_ID,
    });
    assertEquals(
      typeof userSessionId,
      "string",
      "Step 1: A valid session ID should be returned upon successful login (create action).",
    );

    // 2. User makes a subsequent request, authenticated by the session
    console.log(
      "Trace Step 2: User makes a subsequent request, relying on the session to identify them.",
    );
    const [retrievedUserBeforeLogout] = await concept._getUser({
      session: userSessionId,
    });
    assertEquals(
      retrievedUserBeforeLogout,
      { user: MOCK_USER_ID },
      "Step 2: The correct user should be retrieved from the session (_getUser action).",
    );

    // 3. User logs out (implies deleting the session)
    console.log("Trace Step 3: User logs out, invalidating their session.");
    const deleteResult: Empty | { error: string } = await concept.delete({
      session: userSessionId,
    });
    assertEquals(
      deleteResult,
      {},
      "Step 3: Session deletion should return an empty object, indicating success (delete action).",
    );

    // 4. Verify the session is no longer valid after logout
    console.log(
      "Trace Step 4: Attempt to access resources using the invalidated session.",
    );
    const [verifyDeleted] = await concept._getUser({ session: userSessionId });
    assertEquals(
      verifyDeleted,
      { error: `Session with id ${userSessionId} not found` },
      "Step 4: The session should no longer exist after logout (_getUser action should now fail).",
    );
  });
  await client.close();
});
