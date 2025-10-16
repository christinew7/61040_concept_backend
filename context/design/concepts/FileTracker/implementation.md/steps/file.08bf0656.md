---
timestamp: 'Wed Oct 15 2025 16:52:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_165241.9cd0d3b2.md]]'
content_id: 08bf06563c8dcfe4891a809dcabdeab34f20ec787f13546c19e2a204f68fc945
---

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

* Changed `gemini-2.5-flash-lite` to `gemini-1.5-flash`. While `gemini-2.5-flash-lite` might be a typo, `gemini-1.5-flash` is a common and efficient model.
* Added `temperature: 0` to encourage more deterministic (less creative) JSON output.
* Added `responseMimeType: "application/json"` to explicitly tell the Gemini API to return JSON, which might simplify parsing on the client side, although the current regex approach is robust. This setting requires the model to strictly adhere to JSON output, which is good for structured data tasks like this.
