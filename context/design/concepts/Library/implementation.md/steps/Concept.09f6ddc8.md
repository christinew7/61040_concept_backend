---
timestamp: 'Thu Oct 30 2025 19:56:55 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_195655.e9df8ae8.md]]'
content_id: 09f6ddc8d6213967e27cf442f0313b25b86ed6db4297abb7c8563f1ae528cab2
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
    * an `image` `String (optional)`
    * a `dateAdded` `DateTime`
* **actions**
  * `create (owner: User): (library: Library)`
    * **requires** this `owner` doesn't already have a `Library`
    * **effects** creates a new `Library` with this `owner` and an empty set of `Files`
  * `delete (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** deletes this `owner`'s `Library` and all associated `Files`
  * `createFile (owner: User)`
    * **requires** this `owner` has a `Library`
    * **effects** creates a `File` with the current `DateTime`, an empty `items`, and no `image` and adds this `File` to this `owner`'s `Library`
* `addItemToFile (owner: User, file: File, item: String)`
  * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
  * **effects** adds `item` to the `items` list of this `file`
* `modifyItemInFile (owner: User, file: File, index: Number, newItem: String)`
  * **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, `index` is a valid index for `file.items` (in \[ 0, items.length() ) )
  * **effects** replaces the item at `index` in `file.items` with `newItem`
* `removeItemFromFile (owner: User, file: File, index: Number)`
  * **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, and `index` is a valid index for `file.items` (in \[ 0, items.length() ) )
  * **effects** removes the item at `index` from `file.items`
* `setImageToFile (owner: User, file: File, image: String)`
  * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
  - **effects** sets the `image` field of this `file` to `image`

- `clearImageFromFile (owner: User, file: File)`
  \*   **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
  \*   **effects** clears the `image` field of this `file` (sets to `null`)
  * `deleteFile (owner: User, file: File)`
    * **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`
    * **effects** deletes this `file` from this `owner`'s `Library`
  * `getAllFiles (owner: User): (files: Set<File>)`
    * **requires** this `owner` has a `Library`
    * **effects** returns all `Files` in this `owner`'s `Library`
