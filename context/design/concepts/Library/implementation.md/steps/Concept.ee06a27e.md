---
timestamp: 'Thu Oct 09 2025 10:41:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251009_104158.08e7e7a8.md]]'
content_id: ee06a27e03635073df1407a83c4faf75b82a6f153d8537f7951ca0c7e4d9ce58
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
    * an `items` `List<String>`
    * a `dateAdded` `DateTime`
* **actions**
  * `create (owner: User): (library: Library)`
    * **requires** this `owner` doesn't already have a `Library`
    * **effects** creates a new `Library` with this `owner` and an empty set of `Files`
  * `delete (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** deletes this `owner`'s `Library` and all associated `Files`
  * `addFile (owner: User, items: List<String>)`
    * **requires** this `owner` has a `Library`, and a `File` with these `items` doesn't already exist in this `owner`'s `Library`
    * **effects** creates a `File` with these `items` and the current `DateTime`, and adds this `File` to this `owner`'s `Library`
  * `modifyFile (owner: User, file: File, items: List<String>)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** changes this `file`'s `items` to these `items`
  * `deleteFile (owner: User, file: File)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** deletes this `file` from this `owner`'s `Library`
  * `getAllFiles (owner: User): (files: Set<File>)`
    * **requires** this `owner` has a `Library`
    * **effects** returns all `Files` in this `owner`'s `Library`
