---
timestamp: 'Wed Oct 15 2025 11:58:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_115801.e8df6251.md]]'
content_id: d4381579d185726607f38949e8ba5ca2185a203f53e4a9ec375af7bfce4262a2
---

# context:

Action: duplicate library and duplicate files ...

1. Duplicate library is not allowed ... FAILED (5ms)
2. Duplicate file is not allowed ... FAILED (1ms)
   Action: duplicate library and duplicate files ... FAILED (due to 2 failed steps) (612ms)

ERRORS

Action: duplicate library and duplicate files ... 2. Duplicate file is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:159:5
error: Started test step while another test step with sanitizers was running:

* Action: duplicate library and duplicate files ... 1. Duplicate library is not allowed

Action: duplicate library and duplicate files ... 1. Duplicate library is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:149:5
error: MongoExpiredSessionError: Use of expired sessions is not permitted
at executeOperation (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/operations/execute\_operation.js:46:15)
at eventLoopTick (ext:core/01\_core.js:179:7)
at async FindCursor.\_initialize (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cursor/find\_cursor.js:51:26)
at async FindCursor.cursorInit (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cursor/abstract\_cursor.js:495:27)
at async FindCursor.fetchBatch (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cursor/abstract\_cursor.js:527:13)
at async FindCursor.next (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/cursor/abstract\_cursor.js:239:13)
at async Collection.findOne (file:///Users/cwu27/Library/Caches/deno/npm/registry.npmjs.org/mongodb/6.10.0/lib/collection.js:274:21)
at async LibraryConcept.create (file:///Users/cwu27/Desktop/6.1040/61040\_concept\_backend/src/concepts/Library/LibraryConcept.ts:68:29)
at async file:///Users/cwu27/Desktop/6.1040/61040\_concept\_backend/src/concepts/Library/LibraryConcept.test.ts:150:5

FAILURES

Action: duplicate library and duplicate files ... 2. Duplicate file is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:159:5
Action: duplicate library and duplicate files ... 1. Duplicate library is not allowed => ./src/concepts/Library/LibraryConcept.test.ts:149:5
