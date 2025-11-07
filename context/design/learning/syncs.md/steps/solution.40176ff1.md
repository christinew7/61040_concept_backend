---
timestamp: 'Thu Nov 06 2025 22:34:17 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_223417.44e9d1f4.md]]'
content_id: 40176ff111d889fa8109beea3e6edc49ad07df078e2fde716ed17a18d705c897
---

# solution:

The correct and idiomatic way to call concept queries within a synchronization is to use the `frames.query()` method. This method understands how to work with the symbol variables, automatically looking up their bound values from the current frames and passing them as arguments to the query. It then enriches the frames with the results of the query.

The `where` clause should be refactored to chain the `frames.query()` calls. This makes the logic clearer, more robust, and aligns with the intended design pattern of the framework.

Here is the corrected implementation for `src/syncs/library.sync.ts`:
