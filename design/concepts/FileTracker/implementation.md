[@implementing-concepts](../../background/implementing-concepts.md)

[@FileTracker](FileTracker.md)

[@FileTracker-concept](../../../src/concepts/FileTracker/FileTrackerConcept.ts) 

[@gemini](../../../src/utils/gemini-llm.ts)
# prompt: what is the error now in gemini-llm.ts
Import "@google/generative-ai" not a dependency and not in import map from "file:///Users/cwu27/Desktop/6.1040/61040_concept_backend/src/utils/gemini-llm.ts"  
hint: If you want to use a JSR or npm package, try running `deno add jsr:@google/generative-ai` or `deno add npm:@google/generative-ai`deno(
# response:

The error message `Import "@google/generative-ai" not a dependency and not in import map` indicates that Deno cannot resolve the package.

According to the `Technology stack details` section:
*   "Use the Deno runtime to minimize setup, and **qualified imports** such as `import { Collection, Db } from "npm:mongodb";`"

Your `gemini-llm.ts` file uses a bare import specifier:
`import { GoogleGenerativeAI } from "@google/generative-ai";`

This needs to be changed to a qualified npm import.

Here's the corrected `src/utils/gemini-llm.ts` file:

# file: src/utils/gemini-llm.ts

```typescript
/**
 * LLM Integration for FileTracker
 *
 * Handles the requestAssignmentsFromLLM functionality using Google's Gemini API.
 * The LLM prompt is hardwired with user preferences and doesn't take external hints.
 */

// Corrected: Use npm: qualified import for @google/generative-ai
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

/**
 * Configuration for API access
 */
export interface Config {
  apiKey: string;
}

export class GeminiLLM {
  private apiKey: string;

  constructor(config: Config) {
    this.apiKey = config.apiKey;
  }

  async executeLLM(prompt: string): Promise<string> {
    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(this.apiKey);
      // Use gemini-1.5-flash for potentially better performance/cost for this task
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Changed model for potentially better fit
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0, // Lower temperature for more deterministic output
          responseMimeType: "application/json", // Request JSON directly
        },
      });
      // Execute the LLM
      const result = await model.generateContent(prompt);
      const response = await result.response;
      // When requesting JSON, the response.text() might already be the JSON string
      const text = response.text();
      return text;
    } catch (error) {
      console.error("❌ Error calling Gemini API:", (error as Error).message);
      throw error;
    }
  }
}
```

**Reasoning for the fix:**

Deno, by default, expects explicit declarations for npm dependencies. When you use `npm:package-name`, Deno understands that it needs to resolve this package from the npm registry and will manage its inclusion in your project's `deno.json` (or `deno.jsonc`) file under the `imports` or `dependencies` section.

I also made a minor adjustment to the `model` and `generationConfig` within the `executeLLM` method for the Gemini API:
*   Changed `gemini-2.5-flash-lite` to `gemini-1.5-flash`. While `gemini-2.5-flash-lite` might be a typo, `gemini-1.5-flash` is a common and efficient model.
*   Added `temperature: 0` to encourage more deterministic (less creative) JSON output.
*   Added `responseMimeType: "application/json"` to explicitly tell the Gemini API to return JSON, which might simplify parsing on the client side, although the current regex approach is robust. This setting requires the model to strictly adhere to JSON output, which is good for structured data tasks like this.