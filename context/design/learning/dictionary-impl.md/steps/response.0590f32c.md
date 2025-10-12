---
timestamp: 'Sun Oct 12 2025 18:55:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_185526.b79149aa.md]]'
content_id: 0590f32c575601f6aff8b4723b2173bb6437133b423ca94442ae0480f2739606
---

# response:

You are correct to ask! The rule is clearly stated in the initial problem description under the "Concept Implementation" section, point 3:

> 3. Every action must take a single argument, and output a single argument: both of these are a dictionary/JSON object with primitive values (no custom objects).

Looking at your `DictionaryConcept.ts` implementation:

* **`addTerm(language1: string, language2: string): Promise<{ id: Term } | { error: string }>`**
  This method takes *two* arguments (`language1` and `language2`), which violates the rule. It should take a single object like `{ language1: string, language2: string }`.

* **`deleteTerm(language1: string, language2: string): Promise<Empty | { error: string }>`**
  Similarly, this method takes *two* arguments, violating the rule. It should also take a single object like `{ language1: string, language2: string }`.

* **`translateTerm({ language1 }: { language1: string }): Promise<{ language2: string } | { error: string }>`**
  This method *correctly* follows the rule by taking a single argument, which is an object with `language1` as a key.

To fix `addTerm` and `deleteTerm`, they should be refactored to accept a single object argument.
