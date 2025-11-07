---
timestamp: 'Thu Nov 06 2025 20:55:49 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_205549.33ed410d.md]]'
content_id: 7fdaa9e093ca7c83191edc69aebd21652a3f3c472f920a50ee2af7b5a248e8c3
---

# solution:

To fix this, you need to ensure that you create an instance of the `GeminiLLM` utility and pass it to the `FileTrackerConcept` constructor when you are initializing all of your concepts.

Here is an example of what your `src/main.ts` (or equivalent entry-point file) should look like to correctly initialize the concept:

```typescript
// file: src/main.ts

import "https://deno.land/std@0.219.0/dotenv/load.ts";
import { ConceptEngine } from "@engine";
import { getDb } from "@utils/database.ts";
import { concepts } from "@concepts";
import { syncs } from "@syncs";
import { GeminiLLM } from "@utils/gemini-llm.ts"; // 1. Import the GeminiLLM utility

async function main() {
  console.log("🚀 Starting concept server...");
  const [db, client] = await getDb();
  const llm = new GeminiLLM(); // 2. Create an instance of the LLM

  try {
    const engine = new ConceptEngine(db, client);

    // Pass the `llm` instance when creating the FileTrackerConcept
    const conceptInstances = concepts.map((C) => {
      if (C.name === "FileTrackerConcept") {
        return new C(db, llm); // 3. Pass the LLM instance here
      }
      return new C(db);
    });

    engine.addConcepts(...conceptInstances);
    engine.addSyncs(...syncs);
    await engine.run();
    console.log("✅ All systems go!");
  } catch (e) {
    console.error("💥 Failed to start server", e);
    await client.close();
  }
}

main();
```

By making these three changes, you ensure that the `FileTrackerConcept` receives the `GeminiLLM` instance it needs, `this.llm` will be correctly initialized, and the `executeLLM` method can be called without error.
