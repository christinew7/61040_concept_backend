---
timestamp: 'Tue Oct 14 2025 11:38:33 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_113833.e5b1265c.md]]'
content_id: 2efe60c6f5342569ce7291d036b23d6e4104561d8383045520b681856b417b76
---

# file: src/likertsurvey/LikertSurveyConcept.test.ts

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
    let survey: ID;
    let q1: ID;
    let q2: ID;

    await t.step("1. Author creates a survey with a 1-5 scale", async () => {
      const createSurveyResult = await surveyConcept.createSurvey({ author: authorA, title: "Customer Satisfaction", scaleMin: 1, scaleMax: 5 });
      assertNotEquals("error" in createSurveyResult, true, "Survey creation should not fail.");
      survey = (createSurveyResult as { survey: ID }).survey;
      assertExists(survey, "A survey ID should be returned.");
    });

    await t.step("2. Author adds several questions", async () => {
      const addQ1Result = await surveyConcept.addQuestion({ survey, text: "How satisfied are you with our product?" });
      assertNotEquals("error" in addQ1Result, true, "Adding question 1 should not fail.");
      q1 = (addQ1Result as { question: ID }).question;
      assertExists(q1, "Question 1 ID should be returned.");

      const addQ2Result = await surveyConcept.addQuestion({ survey, text: "How likely are you to recommend us?" });
      assertNotEquals("error" in addQ2Result, true, "Adding question 2 should not fail.");
      q2 = (addQ2Result as { question: ID }).question;
      assertExists(q2, "Question 2 ID should be returned.");

      const questions = await surveyConcept._getSurveyQuestions({ survey });
      assertEquals(questions.length, 2, "There should be two questions in the survey.");
      
      // Explicitly check the IDs and their linkage
      const foundQ1 = questions.find((q) => q._id === q1);
      assertExists(foundQ1, "Question 1 should be retrievable by its ID.");
      assertEquals(foundQ1?.survey, survey, "Question 1 should be linked to the correct survey ID.");
      assertEquals(foundQ1?.text, "How satisfied are you with our product?");

      const foundQ2 = questions.find((q) => q._id === q2);
      assertExists(foundQ2, "Question 2 should be retrievable by its ID.");
      assertEquals(foundQ2?.survey, survey, "Question 2 should be linked to the correct survey ID.");
      assertEquals(foundQ2?.text, "How likely are you to recommend us?");
    });

    await t.step("3. A respondent submits their answers to those questions", async () => {
      const submitR1Result = await surveyConcept.submitResponse({ respondent: respondentB, question: q1, value: 5 });
      assertEquals("error" in submitR1Result, false, "Submitting response 1 should succeed.");

      const submitR2Result = await surveyConcept.submitResponse({ respondent: respondentB, question: q2, value: 4 });
      assertEquals("error" in submitR2Result, false, "Submitting response 2 should succeed.");
    });

    await t.step("4. The author can view the collected responses", async () => {
      const surveyResponses = await surveyConcept._getSurveyResponses({ survey });
      assertEquals(surveyResponses.length, 2, "There should be two responses for the survey.");
      
      // Explicitly check the IDs within the responses
      const resForQ1 = surveyResponses.find((r) => r.question === q1);
      assertExists(resForQ1, "Response for q1 should exist.");
      assertEquals(resForQ1?.value, 5, "Value for q1 response should be 5.");
      assertEquals(resForQ1?.respondent, respondentB, "Respondent for q1 response should be respondentB.");

      const resForQ2 = surveyResponses.find((r) => r.question === q2);
      assertExists(resForQ2, "Response for q2 should exist.");
      assertEquals(resForQ2?.value, 4, "Value for q2 response should be 4.");
      assertEquals(resForQ2?.respondent, respondentB, "Respondent for q2 response should be respondentB.");

      const respondentAnswers = await surveyConcept._getRespondentAnswers({ respondent: respondentB });
      assertEquals(respondentAnswers.length, 2, "The respondent should have two answers recorded.");
      
      // Explicitly check the IDs within respondent answers
      const bobResForQ1 = respondentAnswers.find(r => r.question === q1);
      assertExists(bobResForQ1, "Respondent B's response for q1 should be found.");
      assertEquals(bobResForQ1?.value, 5, "Respondent B's response for q1 should be 5.");
      assertEquals(bobResForQ1?.respondent, respondentB, "Respondent B's ID should be correct for q1.");

      const bobResForQ2 = respondentAnswers.find(r => r.question === q2);
      assertExists(bobResForQ2, "Respondent B's response for q2 should be found.");
      assertEquals(bobResForQ2?.value, 4, "Respondent B's response for q2 should be 4.");
      assertEquals(bobResForQ2?.respondent, respondentB, "Respondent B's ID should be correct for q2.");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: createSurvey requires scaleMin < scaleMax", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);

  try {
    await t.step("Should fail when scaleMin > scaleMax", async () => {
      const invalidResult = await surveyConcept.createSurvey({ author: authorA, title: "Invalid Survey", scaleMin: 5, scaleMax: 1 });
      assertEquals("error" in invalidResult, true, "Should fail when scaleMin > scaleMax.");
      assertEquals((invalidResult as { error: string }).error, "scaleMin must be less than scaleMax");
    });

    await t.step("Should fail when scaleMin == scaleMax", async () => {
      const equalResult = await surveyConcept.createSurvey({ author: authorA, title: "Invalid Survey", scaleMin: 3, scaleMax: 3 });
      assertEquals("error" in equalResult, true, "Should fail when scaleMin == scaleMax.");
      assertEquals((equalResult as { error: string }).error, "scaleMin must be less than scaleMax");
    });
  } finally {
    await client.close();
  }
});

Deno.test("Action: addQuestion requires an existing survey", async (t) => {
  const [db, client] = await testDb();
  const surveyConcept = new LikertSurveyConcept(db);
  const nonExistentSurveyId = "survey:fake" as ID; // Using a manually created fake ID

  try {
    await t.step("Adding a question to a non-existent survey should fail", async () => {
      const result = await surveyConcept.addQuestion({ survey: nonExistentSurveyId, text: "This will fail" });
      assertEquals("error" in result, true, "Adding a question to a non-existent survey should fail.");
      assertEquals((result as { error: string }).error, `Survey with ID ${nonExistentSurveyId} not found.`);
    });
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

    await t.step("Requires: question must exist", async () => {
      const nonExistentQuestionId = "question:fake" as ID; // Using a manually created fake ID
      const res1 = await surveyConcept.submitResponse({ respondent: respondentB, question: nonExistentQuestionId, value: 3 });
      assertEquals("error" in res1, true, "Submitting a response to a non-existent question should fail.");
      assertEquals((res1 as { error: string }).error, `Question with ID ${nonExistentQuestionId} not found.`);
    });

    await t.step("Requires: respondent must not have already submitted a response for this question", async () => {
      await surveyConcept.submitResponse({ respondent: respondentB, question, value: 3 }); // First submission is OK
      const res2 = await surveyConcept.submitResponse({ respondent: respondentB, question, value: 4 }); // Second submission fails
      assertEquals("error" in res2, true, "Submitting a response twice for the same question should fail.");
      assertEquals((res2 as { error: string }).error, "Respondent has already answered this question. Use updateResponse to change it.");
    });

    await t.step("Requires: value must be within survey's scale", async () => {
      const res3 = await surveyConcept.submitResponse({ respondent: respondentC, question, value: 0 }); // Below min
      assertEquals("error" in res3, true, "Submitting a value below the minimum scale should fail.");
      assertEquals((res3 as { error: string }).error, "Response value 0 is outside the survey's scale [1, 5].");

      const res4 = await surveyConcept.submitResponse({ respondent: respondentC, question, value: 6 }); // Above max
      assertEquals("error" in res4, true, "Submitting a value above the maximum scale should fail.");
      assertEquals((res4 as { error: string }).error, "Response value 6 is outside the survey's scale [1, 5].");
    });
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

    await t.step("Requires: A response must already exist to be updated", async () => {
      const res1 = await surveyConcept.updateResponse({ respondent: respondentC, question, value: 4 });
      assertEquals("error" in res1, true, "Updating a non-existent response should fail.");
      assertEquals((res1 as { error: string }).error, "No existing response found to update. Use submitResponse to create one.");
    });

    await t.step("Requires: value must be within survey's scale", async () => {
      const res2 = await surveyConcept.updateResponse({ respondent: respondentB, question, value: 6 });
      assertEquals("error" in res2, true, "Updating with a value outside the scale should fail.");
      assertEquals((res2 as { error: string }).error, "Response value 6 is outside the survey's scale [1, 5].");
    });

    await t.step("Successful update should modify the stored value", async () => {
      const successResult = await surveyConcept.updateResponse({ respondent: respondentB, question, value: 5 });
      assertEquals("error" in successResult, false, "A valid update should succeed.");

      // Verify the update
      const answers = await surveyConcept._getRespondentAnswers({ respondent: respondentB });
      assertEquals(answers.length, 1, "There should still be only one answer.");
      assertEquals(answers[0].value, 5, "The answer's value should be updated to 5.");
      assertEquals(answers[0].question, question, "The question ID should remain correct after update.");
      assertEquals(answers[0].respondent, respondentB, "The respondent ID should remain correct after update.");
    });
  } finally {
    await client.close();
  }
});
```
