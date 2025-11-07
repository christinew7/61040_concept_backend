---
timestamp: 'Thu Nov 06 2025 12:42:27 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_124227.a648b3ad.md]]'
content_id: c4637a9d26f9ecd1b2fff4ae1cd0f600ce75e1fe8971f2821b18b5d8a8c35d66
---

# file: src/syncs/dictionary.sync.ts

```typescript
import { actions, Frames, Sync } from "@engine";
import { Dictionary, Requesting } from "@concepts";

/**
 * @sync TranslatePageRequest
 * @when Requesting.request(path: "/dictionary/translate", page)
 * @where
 *  1. Fetches all terms from the Dictionary.
 *  2. Creates a translation map for fast lookups.
 *  3. Splits the incoming 'page' text into words.
 *  4. Translates each word if it exists in the map.
 *  5. Reassembles the text into a 'translatedPage'.
 * @then Requesting.respond(request, translatedPage)
 * @purpose Translates all known words in a block of text and returns the result.
 */
export const TranslatePageRequest: Sync = ({ request, page, translatedPage, terms }) => ({
  when: actions([
    Requesting.request,
    { path: "/dictionary/translate", page },
    { request },
  ]),
  where: async (frames) => {
    // Step 1: Query the dictionary to get all known translation pairs.
    // This is much more efficient than querying for each word individually.
    frames = await frames.query(Dictionary._getAllTerms, {}, { terms });

    // The query returns an array of term documents. We only expect one frame here.
    const termDocs = frames[0][terms] as { language1: string; language2: string }[];

    // Step 2: Create a simple Map for quick lookups.
    const translationMap = new Map<string, string>();
    for (const term of termDocs) {
      // Store translations in lowercase to handle case-insensitivity.
      translationMap.set(term.language1.toLowerCase(), term.language2);
    }

    // Step 3: Get the page content and process it.
    const originalPage = frames[0][page] as string;
    const words = originalPage.split(/\s+/); // Split by whitespace

    // Step 4: Translate each word, keeping the original if no translation exists.
    const translatedWords = words.map((word) => {
      // Preserve original word if no translation is found.
      return translationMap.get(word.toLowerCase()) ?? word;
    });

    // Step 5: Join the words back together and create the result.
    const finalTranslatedText = translatedWords.join(" ");

    // Return a new frame with the original request and the translated page.
    return new Frames({
      ...frames[0],
      [translatedPage]: finalTranslatedText,
    });
  },
  then: actions([
    Requesting.respond,
    { request, translatedPage },
  ]),
});
```

### How to Use This

1. Save the corrected `DictionaryConcept.ts` file in `src/concepts/Dictionary/`.
2. Save the new `dictionary.sync.ts` file in `src/syncs/`.
3. Run `deno task build` to update the imports.
4. Run `deno task start` to start your server.
5. You can now send a `POST` request to `/api/dictionary/translate` with a JSON body like this:
   ```json
   {
     "page": "Hello world this is a test"
   }
   ```
   Assuming you have added terms like (`hello` -> `hola`) and (`world` -> `mundo`), the server will respond with:
   ```json
   {
     "translatedPage": "hola mundo this is a test"
   }
   ```
