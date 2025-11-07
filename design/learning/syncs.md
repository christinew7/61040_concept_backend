[@sync-background](../tools/sync-background.md)

%% [@Password-implementation](../../src/concepts/PasswordAuthentication/PasswordAuthenticationConcept.ts) %%

 [@Dictionary-implementation](../concepts/Dictionary/implementation.md)

 %% [@Library-implementation](../../src/concepts/Library/LibraryConcept.ts) 

 [@FileTracker-implementation](../../src/concepts/FileTracker/FileTrackerConcept.ts) 
 %%

[@Sessioning](../concepts/Sessioning/Sessioning.md)

%% [@auth sync](../../src/syncs/auth.sync.ts) %%
# prompt:  can you write the syncs for dictionary translateTermFromL1 and translateTermFromL2?
# response:

Of course! I can help with that.

First, looking at the `DictionaryConcept.ts` file you provided, it seems you've already correctly implemented the actions to take a single dictionary argument. For example, `addTerm` is defined as `async addTerm({ type, language1, language2 }: { ... })`, which correctly takes one object and destructures its properties. This is the standard pattern, so no fixes are needed on the concept implementation itself.

Here are the synchronizations to handle requests for the `translateTermFromL1` and `translateTermFromL2` actions. These syncs create a complete request/response cycle, including handling success and error cases.

# file: src/syncs/dictionary.sync.ts

```typescript
import { actions, Sync } from "@engine";
import { Dictionary, Requesting } from "@concepts";

// --- Translate from Language 1 to Language 2 ---

/**
 * @sync TranslateTermFromL1Request
 * @description Catches a request to translate a term and calls the corresponding Dictionary action.
 */
export const TranslateTermFromL1Request: Sync = ({ request, type, language1 }) => ({
  when: actions([
    Requesting.request,
    { path: "/Dictionary/translateTermFromL1", type, language1 },
    { request },
  ]),
  then: actions([Dictionary.translateTermFromL1, { type, language1 }]),
});

/**
 * @sync TranslateTermFromL1Response
 * @description Responds to the original request with the successful translation result.
 */
export const TranslateTermFromL1Response: Sync = ({ request, language2 }) => ({
  when: actions(
    [Requesting.request, { path: "/Dictionary/translateTermFromL1" }, { request }],
    [Dictionary.translateTermFromL1, {}, { language2 }],
  ),
  then: actions([Requesting.respond, { request, language2 }]),
});

/**
 * @sync TranslateTermFromL1ResponseError
 * @description Responds to the original request with an error if the translation failed.
 */
export const TranslateTermFromL1ResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Dictionary/translateTermFromL1" }, { request }],
    [Dictionary.translateTermFromL1, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});

// --- Translate from Language 2 to Language 1 ---

/**
 * @sync TranslateTermFromL2Request
 * @description Catches a request to translate a term and calls the corresponding Dictionary action.
 */
export const TranslateTermFromL2Request: Sync = ({ request, type, language2 }) => ({
  when: actions([
    Requesting.request,
    { path: "/Dictionary/translateTermFromL2", type, language2 },
    { request },
  ]),
  then: actions([Dictionary.translateTermFromL2, { type, language2 }]),
});

/**
 * @sync TranslateTermFromL2Response
 * @description Responds to the original request with the successful translation result.
 */
export const TranslateTermFromL2Response: Sync = ({ request, language1 }) => ({
  when: actions(
    [Requesting.request, { path: "/Dictionary/translateTermFromL2" }, { request }],
    [Dictionary.translateTermFromL2, {}, { language1 }],
  ),
  then: actions([Requesting.respond, { request, language1 }]),
});

/**
 * @sync TranslateTermFromL2ResponseError
 * @description Responds to the original request with an error if the translation failed.
 */
export const TranslateTermFromL2ResponseError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/Dictionary/translateTermFromL2" }, { request }],
    [Dictionary.translateTermFromL2, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```