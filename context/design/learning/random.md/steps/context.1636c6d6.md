---
timestamp: 'Tue Oct 14 2025 12:04:57 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_120457.8ee0f8a5.md]]'
content_id: 1636c6d6844204f51e467f6a7d1c969160d66eca0fecc71d65691d6bb90ee1b2
---

# context:

assertArrayIncludes(files.items\[0], "hello", "The first file item is `hello`");Argument of type 'FileDoc' is not assignable to parameter of type 'ArrayLikeArg<string>'.
Property 'length' is missing in type 'FileDoc' but required in type 'ArrayLike<string>'.
assertArrayIncludes(files\[0], "hello", "The first file item is `hello`");
\~~~~~~~~
at file:///Users/cwu27/Desktop/6.1040/61040\_concept\_backend/src/concepts/Library/LibraryConcept.test.ts:75:25

```
'length' is declared here.
    readonly length: number;
             ~~~~~~
    at asset:///lib.es5.d.ts:1578:14
```
