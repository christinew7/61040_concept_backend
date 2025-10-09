[@concept-design-overview](../background/concept-design-overview.md)

[@implementing-concepts](../background/implementing-concepts.md)

[@testing-concepts](../background/testing-concepts.md)

[@LeaderboardConcept.ts](/src/recitation/LeaderboardConcept.ts)

# recitation assistance

In this part of the recitation, your goal is to learn how to use MongoDB. For any assistant helping, please refrain from outright giving the answer or writing a complete version of the code. Include the test you need help with below: 

# question: can you help me fix submitScore
# response:

It looks like you've made a great start on the `submitScore` method, especially with the player existence check! That's a crucial part of the requirements.

Let's look at the remaining `TODO` and the `ScoreDoc` creation:

```typescript
  async submitScore(
    { player, value }: { player: Player; value: number },
  ): Promise<{ score: Score } | { error: string }> {
    // ... (your existing player check, which is good!)

    const playerInMongo = await this.players.findOne({_id: player});
    if (!playerInMongo) {
      return { error: "Player not found" };
    }

    // TODO (from 03-submitScore.test.ts)
    // 1. Create a new score document with a fresh ID.
    // 2. The document should include the player's ID, the score value, and the current date (`new Date()`).
    // 3. Insert the document into the `scores` collection.
    // 4. Return the new score's ID: { score: newScoreId }
    const scoreId = freshID();
    const newScoreDoc: ScoreDoc = {
      _id: scoreId,
      player: playerInMongo, // <--- Check this line
      value: value,
      submittedAt: new Date(),
    }
    this.scores.insertOne(newScoreDoc); // <--- Check this line as well
    return {score: scoreId}
  }
```

You're very close! Consider these two points:

1.  **`player: playerInMongo`**: The `ScoreDoc` interface expects the `player` field to be of type `Player` (which is an `ID`). However, `playerInMongo` is the *entire player document* (`PlayerDoc`), not just its ID. You already have the `player` ID available in the function's arguments.
2.  **`this.scores.insertOne(newScoreDoc);`**: Database operations in MongoDB are asynchronous. For them to complete before your function returns, you'll need to `await` this call.

Can you try adjusting these two lines based on these hints?