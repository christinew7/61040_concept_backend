---
timestamp: 'Mon Oct 13 2025 20:40:47 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_204047.b7aa96c1.md]]'
content_id: 02e1a7c737a62ddf76abae1c6302afa17535bc8bf41957c819122b0d8709c1e8
---

# response:

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import LikertSurveyConcept from "./LikertSurveyConcept.ts";

const authorA = "author:Alice" as ID;
const respondentB = "respondent:Bob" as ID;
const respondentC = "respondent:Charlie" as ID;

Deno.test("Principle: Author creates survey, respondent answers, author views results", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // 1. Author creates a survey with a 1-5 scale
    const createSurveyResult = await surveyConcept.createSurvey({ author: authorA, title: "Customer Satisfaction", scaleMin: 1, scaleMax: 5 });
    assertNotEquals("error" in createSurveyResult, true, "Survey creation should not fail.");
    const { survey } = createSurveyResult as { survey: ID };
    assertExists(survey);

    // 2. Author adds several questions
    const addQ1Result = await surveyConcept.addQuestion({ survey, text: "How satisfied are you with our product?" });
    assertNotEquals("error" in addQ1Result, true, "Adding question 1 should not fail.");
    const { question: q1 } = addQ1Result as { question: ID };

    const addQ2Result = await surveyConcept.addQuestion({ survey, text: "How likely are you to recommend us?" });
    assertNotEquals("error" in addQ2Result, true, "Adding question 2 should not fail.");
    const { question: q2 } = addQ2Result as { question: ID };

    const questions = await surveyConcept._getSurveyQuestions({ survey });
    assertEquals(questions.length, 2, "There should be two questions in the survey.");

    // 3. A respondent submits their answers to those questions
    const submitR1Result = await surveyConcept.submitResponse({ respondent: respondentB, question: q1, value: 5 });
    assertEquals("error" in submitR1Result, false, "Submitting response 1 should succeed.");

    const submitR2Result = await surveyConcept.submitResponse({ respondent: respondentB, question: q2, value: 4 });
    assertEquals("error" in submitR2Result, false, "Submitting response 2 should succeed.");

    // 4. The author can view the collected responses
    const surveyResponses = await surveyConcept._getSurveyResponses({ survey });
    assertEquals(surveyResponses.length, 2, "There should be two responses for the survey.");
    assertEquals(surveyResponses.find((r) => r.question === q1)?.value, 5);
    assertEquals(surveyResponses.find((r) => r.question === q2)?.value, 4);

    const respondentAnswers = await surveyConcept._getRespondentAnswers({ respondent: respondentB });
    assertEquals(respondentAnswers.length, 2, "The respondent should have two answers recorded.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: createSurvey requires scaleMin < scaleMax", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    const invalidResult = await surveyConcept.createSurvey({ author: authorA, title: "Invalid Survey", scaleMin: 5, scaleMax: 1 });
    assertEquals("error" in invalidResult, true, "Should fail when scaleMin > scaleMax.");
    assertEquals((invalidResult as { error: string }).error, "scaleMin must be less than scaleMax");

    const equalResult = await surveyConcept.createSurvey({ author: authorA, title: "Invalid Survey", scaleMin: 3, scaleMax: 3 });
    assertEquals("error" in equalResult, true, "Should fail when scaleMin == scaleMax.");
    assertEquals((equalResult as { error: string }).error, "scaleMin must be less than scaleMax");
  } finally {
    await client.close();
  }
});

Deno.test("Action: addQuestion requires an existing survey", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  const nonExistentSurveyId = "survey:fake" as ID;

  try {
    const result = await surveyConcept.addQuestion({ survey: nonExistentSurveyId, text: "This will fail" });
    assertEquals("error" in result, true, "Adding a question to a non-existent survey should fail.");
    assertEquals((result as { error: string }).error, `Survey with ID ${nonExistentSurveyId} not found.`);
  } finally {
    await client.close();
  }
});

Deno.test("Action: submitResponse requirements are enforced", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    // Setup a valid survey and question
    const { survey } = (await surveyConcept.createSurvey({ author: authorA, title: "Test Survey", scaleMin: 1, scaleMax: 5 })) as { survey: ID };
    const { question } = (await surveyConcept.addQuestion({ survey, text: "A question" })) as { question: ID };

    // Requires: question must exist
    const nonExistentQuestionId = "question:fake" as ID;
    const res1 = await surveyConcept.submitResponse({ respondent: respondentB, question: nonExistentQuestionId, value: 3 });
    assertEquals("error" in res1, true, "Submitting a response to a non-existent question should fail.");
    assertEquals((res1 as { error: string }).error, `Question with ID ${nonExistentQuestionId} not found.`);

    // Requires: respondent must not have already submitted a response
    await surveyConcept.submitResponse({ respondent: respondentB, question, value: 3 }); // First submission is OK
    const res2 = await surveyConcept.submitResponse({ respondent: respondentB, question, value: 4 }); // Second submission fails
    assertEquals("error" in res2, true, "Submitting a response twice for the same question should fail.");
    assertEquals((res2 as { error: string }).error, "Respondent has already answered this question. Use updateResponse to change it.");

    // Requires: value must be within survey's scale
    const res3 = await surveyConcept.submitResponse({ respondent: respondentC, question, value: 0 }); // Below min
    assertEquals("error" in res3, true, "Submitting a value below the minimum scale should fail.");
    assertEquals((res3 as { error: string }).error, "Response value 0 is outside the survey's scale [1, 5].");

    const res4 = await surveyConcept.submitResponse({ respondent: respondentC, question, value: 6 }); // Above max
    assertEquals("error" in res4, true, "Submitting a value above the maximum scale should fail.");
    assertEquals((res4 as { error: string }).error, "Response value 6 is outside the survey's scale [1, 5].");
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateResponse successfully updates a response and enforces requirements", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  try {
    // Setup
    const { survey } = (await surveyConcept.createSurvey({ author: authorA, title: "Test Survey", scaleMin: 1, scaleMax: 5 })) as { survey: ID };
    const { question } = (await surveyConcept.addQuestion({ survey, text: "A question" })) as { question: ID };
    await surveyConcept.submitResponse({ respondent: respondentB, question, value: 3 });

    // Requires: A response must already exist to be updated
    const res1 = await surveyConcept.updateResponse({ respondent: respondentC, question, value: 4 });
    assertEquals("error" in res1, true, "Updating a non-existent response should fail.");
    assertEquals((res1 as { error: string }).error, "No existing response found to update. Use submitResponse to create one.");

    // Requires: value must be within survey's scale
    const res2 = await surveyConcept.updateResponse({ respondent: respondentB, question, value: 6 });
    assertEquals("error" in res2, true, "Updating with a value outside the scale should fail.");
    assertEquals((res2 as { error: string }).error, "Response value 6 is outside the survey's scale [1, 5].");

    // Successful update
    const successResult = await surveyConcept.updateResponse({ respondent: respondentB, question, value: 5 });
    assertEquals("error" in successResult, false, "A valid update should succeed.");

    // Verify the update
    const answers = await surveyConcept._getRespondentAnswers({ respondent: respondentB });
    assertEquals(answers.length, 1, "There should still be only one answer.");
    assertEquals(answers[0].value, 5, "The answer's value should be updated to 5.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: case sensitivity for descriptive string fields", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    await t.step("1. createSurvey: Different casing for title results in different surveys", async () => {
      const createSurveyResult1 = await surveyConcept.createSurvey({ author: authorA, title: "My Survey", scaleMin: 1, scaleMax: 5 });
      assertNotEquals("error" in createSurveyResult1, true, "First survey creation should succeed.");
      const { survey: survey1 } = createSurveyResult1 as { survey: ID };

      const createSurveyResult2 = await surveyConcept.createSurvey({ author: authorA, title: "my survey", scaleMin: 1, scaleMax: 5 });
      assertNotEquals("error" in createSurveyResult2, true, "Second survey creation with different case should succeed.");
      const { survey: survey2 } = createSurveyResult2 as { survey: ID };

      assertNotEquals(survey1, survey2, "Surveys with different casing in title should have different IDs.");

      const allSurveys = await surveyConcept.surveys.find({}).toArray();
      assertEquals(allSurveys.length, 2, "There should be two distinct surveys.");
      assertEquals(allSurveys.some(s => s._id === survey1 && s.title === "My Survey"), true, "Survey 1 with exact title should exist.");
      assertEquals(allSurveys.some(s => s._id === survey2 && s.title === "my survey"), true, "Survey 2 with exact title should exist.");
    });

    await t.step("2. addQuestion: Different casing for text results in different questions", async () => {
      const { survey } = (await surveyConcept.createSurvey({ author: authorA, title: "Case Test Survey", scaleMin: 1, scaleMax: 5 })) as { survey: ID };

      const addQ1Result = await surveyConcept.addQuestion({ survey, text: "How satisfied are you?" });
      assertNotEquals("error" in addQ1Result, true, "First question addition should succeed.");
      const { question: q1 } = addQ1Result as { question: ID };

      const addQ2Result = await surveyConcept.addQuestion({ survey, text: "how satisfied are you?" });
      assertNotEquals("error" in addQ2Result, true, "Second question addition with different case should succeed.");
      const { question: q2 } = addQ2Result as { question: ID };

      assertNotEquals(q1, q2, "Questions with different casing in text should have different IDs.");

      const allQuestions = await surveyConcept._getSurveyQuestions({ survey });
      assertEquals(allQuestions.length, 2, "There should be two distinct questions.");
      assertEquals(allQuestions.some(q => q._id === q1 && q.text === "How satisfied are you?"), true, "Question 1 with exact text should exist.");
      assertEquals(allQuestions.some(q => q._id === q2 && q.text === "how satisfied are you?"), true, "Question 2 with exact text should exist.");
    });

    await t.step("3. submitResponse/updateResponse: IDs are case-sensitive by nature.", async () => {
      const { survey } = (await surveyConcept.createSurvey({ author: authorA, title: "ID Case Test", scaleMin: 1, scaleMax: 5 })) as { survey: ID };
      const { question: qCaseSensitive } = (await surveyConcept.addQuestion({ survey, text: "Question for ID test" })) as { question: ID };

      const respondentBob = "respondent:Bob" as ID;
      const respondentbob = "respondent:bob" as ID; // Different ID due to casing

      // Submit for respondentBob
      const submitResult1 = await surveyConcept.submitResponse({ respondent: respondentBob, question: qCaseSensitive, value: 3 });
      assertEquals("error" in submitResult1, false, "Submission for respondent:Bob should succeed.");

      // Submit for respondent:bob (different ID)
      const submitResult2 = await surveyConcept.submitResponse({ respondent: respondentbob, question: qCaseSensitive, value: 4 });
      assertEquals("error" in submitResult2, false, "Submission for respondent:bob should succeed as it's a different ID.");

      // Update for respondent:bob
      const updateResultBob = await surveyConcept.updateResponse({ respondent: respondentbob, question: qCaseSensitive, value: 5 });
      assertEquals("error" in updateResultBob, false, "Update for respondent:bob should succeed.");

      // Verify states
      const responses = await surveyConcept._getSurveyResponses({ survey });
      assertEquals(responses.length, 2, "There should be two responses for two different respondent IDs.");
      assertEquals(responses.find(r => r.respondent === respondentBob)?.value, 3, "Respondent:Bob's response should be 3.");
      assertEquals(responses.find(r => r.respondent === respondentbob)?.value, 5, "Respondent:bob's (lowercase) response should be 5 after update.");
    });

  } finally {
    await client.close();
  }
});
```
