---
timestamp: 'Wed Oct 08 2025 18:03:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_180335.bff20a99.md]]'
content_id: 8054ac46ecb6f4100fbb96a1a3446fca0e2f563441b6143b1ad603d434084e22
---

# Concept: FileTracker

* **concept**: FileTracker \[User]
* **purpose**: manage the tracking of reading positions and navigation within files for users
* **principle**: a user can create a FileTracker to keep track of their position in various files; they can track or untrack files, move through file items sequentially or skip to a specific item; and they can control how their progress is displayed.
* **state**
  * a set of `FileTrackers` with
    * an `owner` `User`
  * a set of `TrackedFiles` with
    * a `fileTracker` `FileTracker` (the parent `FileTracker` instance)
    * a `file` `File` (the file being tracked, assumed to have an `items: List<String>` property similar to `Library`'s `File` structure)
    * a `currentIndex` `Number`
    * a `maxIndex` `Number` (derived from `file.items.length - 1`)
    * a `isVisible` `Flag`
* **actions**
  * `create (owner: User): (fileTracker: FileTracker)`
    * **requires** this `owner` doesn't already have a `FileTracker`
    * **effects** creates a new `FileTracker` with this `owner` and an empty set of `TrackedFiles`
  * `delete (owner: User)`
    * **requires** this `owner` has a `FileTracker`
    * **effects** deletes this `owner`'s `FileTracker` and all associated `TrackedFiles`
  * `trackFile (owner: User, file: File)`
    * **requires** this `owner` has a `FileTracker`, this `file` exists (e.g., in their `Library`), and a `TrackedFile` for this `file` doesn't already exist in this `owner`'s `FileTracker`. This `file` must have items.
    * **effects** creates a new `TrackedFile` for this `file`, initializes its `currentIndex` to 0, sets its `maxIndex` to `file.items.length - 1`, sets `isVisible` to true, and adds this `TrackedFile` to this `owner`'s `FileTracker`.
  * `untrackFile (owner: User, file: File)`
    * **requires** this `owner` has a `FileTracker`, and a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`
    * **effects** deletes the `TrackedFile` associated with this `file` from this `owner`'s `FileTracker`
  * `jumpToItem (owner: User, file: File, index: Number)`
    * **requires** this `owner` has a `FileTracker`, a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`, and this `index` is a valid index between 0 and the `TrackedFile`'s `maxIndex`
    * **effects** updates the `currentIndex` of the `TrackedFile` for this `file` to this `index`
  * `nextItem (owner: User, file: File)`
    * **requires** this `owner` has a `FileTracker`, a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`, and the `currentIndex` of this `TrackedFile` is less than its `maxIndex`
    * **effects** increments the `currentIndex` of the `TrackedFile` for this `file` by 1
  * `previousItem (owner: User, file: File)`
    * **requires** this `owner` has a `FileTracker`, a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`, and the `currentIndex` of this `TrackedFile` is greater than 0
    * **effects** decrements the `currentIndex` of the `TrackedFile` for this `file` by 1
  * `getCurrentItemIndex (owner: User, file: File): (index: Number)`
    * **requires** this `owner` has a `FileTracker`, and a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`
    * **effects** returns the `currentIndex` of the `TrackedFile` for this `file`
  * `setVisibility (owner: User, file: File, visible: Flag)`
    * **requires** this `owner` has a `FileTracker`, and a `TrackedFile` for this `file` exists in this `owner`'s `FileTracker`
    * **effects** sets the `isVisible` flag of the `TrackedFile` for this `file` to this `visible` value
  * `getAllTrackedFiles (owner: User): (trackedFiles: Set<TrackedFile>)`
    * **requires** this `owner` has a `FileTracker`
    * **effects** returns all `TrackedFiles` in this `owner`'s `FileTracker`
