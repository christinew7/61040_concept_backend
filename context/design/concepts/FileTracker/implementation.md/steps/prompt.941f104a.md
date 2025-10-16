---
timestamp: 'Wed Oct 15 2025 21:39:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251015_213900.7c02dd75.md]]'
content_id: 941f104ab873440d2df4d13c8d1e7c504a3a9177e3de19455428f6cb11b28351
---

# prompt: how do i avoid addFile from taking a composite object of a list of strings:

* **Composite objects**. Make sure that all of the arguments and results of your actions are either primitive values (strings, numbers, etc) or object identifiers (actually document identifiers in MongoDB). Composite objects should be used only inside concept implementations and never exposed.
