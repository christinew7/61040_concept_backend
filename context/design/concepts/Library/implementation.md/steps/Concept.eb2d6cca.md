---
timestamp: 'Thu Oct 16 2025 15:12:27 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_151227.29eae03f.md]]'
content_id: eb2d6cca99a5dd095596bfe43ef2c1e45958f0fb2d71ae63f3d5231fe8ead8ad
---

# Concept: Library (Revised Spec)

* **concept**: Library \[User]
* **purpose**: manage collection of files for users
* **principle**: a user creates a library to store their files; the user can add, retrieve, modify, or delete files within their library; and they can delete the library if it's no longer needed
* **state**
  * a set of `Libraries` with
    * an `owner` `User`
  * a set of `Files` with
    * a `library` `Library`
    * a `content` `String`
    * a `dateAdded` `DateTime`
* **actions**
  * `create (owner: User): (library: Library)`
    * **requires** this `owner` doesn't already have a `Library`
    * **effects** creates a new `Library` with this `owner` and an empty set of `Files`
  * `delete (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** deletes this `owner`'s `Library` and all associated `Files`
  * `createFile (owner: User, content: String): (file: File)`
    * **requires** this `owner` has a `Library`, and a `File` with this `content` doesn't already exist in this `owner`'s `Library`
    * **effects** creates a `File` with the given `content` and the current `DateTime`, and adds this `File` to this `owner`'s `Library`
  * `modifyFileContent (owner: User, file: File, newContent: String)`
    * **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, and a *different* `File` with `newContent` doesn't already exist in this `owner`'s `Library`
    * **effects** replaces the `content` of this `file` with `newContent`
  * `deleteFile (owner: User, file: File)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** deletes this `file` from this `owner`'s `Library`
* **queries**
  * `_getAllFiles (owner: User): (files: Set<File>)`
    * **requires** this `owner` has a `Library`
    * **effects** returns all `Files` in this `owner`'s `Library`

***
