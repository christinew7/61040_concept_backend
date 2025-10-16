---
timestamp: 'Thu Oct 16 2025 14:46:14 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_144614.9787d2e6.md]]'
content_id: 1751ddafa979d1846d2be03f9a9328733c2baf2b89fe9613ec45744751e1f321
---

# Concept: Library

* **concept**: Library \[User]
* **purpose**: manage collection of files for users
* **principle**: a user creates a library to store their files; the user can add, retrieve, modify, or delete files within their library; and they can delete the library if it's no longer needed
* **state**
  * a set of `Libraries` with
    * an `owner` `User`
  * a set of `Files` with
    * a `library` `Library`
    * a `content` `String` (Changed from `items List<String>`)
    * a `dateAdded` `DateTime`
* **actions**
  * `create (owner: User): (library: Library)`
    * **requires** this `owner` doesn't already have a `Library`
    * **effects** creates a new `Library` with this `owner` and an empty set of `Files`
  * `delete (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** deletes this `owner`'s `Library` and all associated `Files`
  * `addFile (owner: User, content: String)` (Changed from `items: List<String>`)
    * **requires** this `owner` has a `Library`, and a `File` with this `content` doesn't already exist in this `owner`'s `Library`
    * **effects** creates a `File` with this `content` and the current `DateTime`, and adds this `File` to this `owner`'s `Library`
  * `modifyFile (owner: User, file: File, content: String)` (Changed from `items: List<String>`)
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`, and a `File` with this `content` doesn't already exist in this `owner`'s `Library` (excluding the `file` being modified)
    * **effects** changes this `file`'s `content` to this `content`
  * `deleteFile (owner: User, file: File)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** deletes this `file` from this `owner`'s `Library`
  * `_getAllFiles (owner: User): (files: Set<File>)`
    * **requires** this `owner` has a `Library`
    * **effects** returns all `Files` in this `owner`'s `Library`

***
