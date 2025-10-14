---
timestamp: 'Mon Oct 13 2025 19:39:20 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251013_193920.0c09ffd3.md]]'
content_id: bba8e070934219148467d2c90b0171f49124d4d49c112f665f2373fd0cce6d62
---

# response:

The error message `Expected ';', got ')'` at line 76 of `src/concepts/Dictionary/DictionaryConcept.ts` indicates a syntax issue within the `deleteTerm` method.

The problematic line is:

```typescript
    return { error: `Term pair "${language1}" -> "${language2}" not found.`});
```

There's an extra closing parenthesis `)` right before the semicolon. It should be `}` instead.

**Here's the fix:**

Change line 76 from:

```typescript
    return { error: `Term pair "${language1}" -> "${language2}" not found.`});
```

to:

```typescript
    return { error: `Term pair "${language1}" -> "${language2}" not found.`};
```
