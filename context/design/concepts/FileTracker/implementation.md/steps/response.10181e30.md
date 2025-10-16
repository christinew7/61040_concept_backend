---
timestamp: 'Wed Oct 15 2025 16:52:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_165241.9cd0d3b2.md]]'
content_id: 10181e30d4408d4d8a0b5ec825dae33bd56b3f1ed400e82e10a3b799e12e223a
---

# response:

The error message `Import "@google/generative-ai" not a dependency and not in import map` indicates that Deno cannot resolve the package.

According to the `Technology stack details` section:

* "Use the Deno runtime to minimize setup, and **qualified imports** such as `import { Collection, Db } from "npm:mongodb";`"

Your `gemini-llm.ts` file uses a bare import specifier:
`import { GoogleGenerativeAI } from "@google/generative-ai";`

This needs to be changed to a qualified npm import.

Here's the corrected `src/utils/gemini-llm.ts` file:
