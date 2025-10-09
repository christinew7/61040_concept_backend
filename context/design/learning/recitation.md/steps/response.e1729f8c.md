---
timestamp: 'Thu Oct 09 2025 10:53:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251009_105359.cb66fbe3.md]]'
content_id: e1729f8c50638d16173be8c55b0f5624d6050bcc437fb128abc0f78ce67d6227
---

# response:

Great start! Let's work through the `createPlayer` method step by step, following the TODOs and refining your existing code.

You're on the right track with checking for an existing player!

Your current line:

```typescript
const player = await this.players.findOne(name=name);
```

has a small syntax issue for how you pass the query to `findOne`. In JavaScript/TypeScript, when you're looking for a document where a field matches a value, you pass an object.

**Hint:** How would you write an object that has a property `name` with the value of the `name` argument?

Give that a try, and then we can look at the next part!
