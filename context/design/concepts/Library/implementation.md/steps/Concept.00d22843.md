---
timestamp: 'Thu Oct 16 2025 14:49:53 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251016_144953.ec1c016f.md]]'
content_id: 00d2284399e0c52c5907c0c4776532527e4eff94507d32ff26b1a7dca1e0bfcb
---

# Concept: Library (Revised)

* **concept**: Library \[User]
* **purpose**: manage a collection of files, where each file can contain multiple string items, for users.
* **principle**: a user creates a library to store their files; they can create new files (initially with one item), add more items to existing files, modify specific items within a file, or remove items from a file; they can also delete entire files or the whole library if no longer needed.
* **state**
  * a set of `Libraries` with
    * an `owner` `User`
  * a set of `Files` with
    * a `library` `Library`
    * an `items` `List<String>` (representing the content of the file)
    * a `dateAdded` `DateTime`
* **actions**
  * `create (owner: User): (library: Library)`
    * **requires** this `owner` doesn't already have a `Library`
    * **effects** creates a new `Library` with this `owner`
  * `delete (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** deletes this `owner`'s `Library` and all associated `Files`
  * `createFile (owner: User, initialItem: String): (file: File)`
    * **requires** this `owner` has a `Library`, and a `File` with `[initialItem]` as its `items` does not already exist in this `owner`'s `Library`
    * **effects** creates a new `File` with `[initialItem]` as its content and the current `DateTime`, and adds this `File` to this `owner`'s `Library`
  * `addItemToFile (owner: User, file: File, item: String)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`, and the `item` is not already present in the `file`'s `items` list
    * **effects** adds `item` to the `items` list of this `file`
  * `modifyItemInFile (owner: User, file: File, index: Number, newItem: String)`
    * **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, `index` is a valid index for `file.items`, and `newItem` is not already present in the `file`'s `items` list (excluding the item at `index`)
    * **effects** replaces the item at `index` in `file.items` with `newItem`
  * `removeItemFromFile (owner: User, file: File, index: Number)`
    * **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, and `index` is a valid index for `file.items`
    * **effects** removes the item at `index` from `file.items`
  * `deleteFile (owner: User, file: File)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** deletes this `file` from this `owner`'s `Library`
  * `_getAllFiles (owner: User): (files: Set<File>)`
    * **requires** this `owner` has a `Library`
    * **effects** returns all `Files` (full `FileDoc` objects) in this `owner`'s `Library`

***
