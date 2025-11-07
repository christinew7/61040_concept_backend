---
timestamp: 'Fri Nov 07 2025 00:40:55 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_004055.b7c9e50f.md]]'
content_id: ed220f210a3ec9a201b3ff0ba83f7c4c9ad56f6624b3cdcbc9abd922530db8e0
---

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
