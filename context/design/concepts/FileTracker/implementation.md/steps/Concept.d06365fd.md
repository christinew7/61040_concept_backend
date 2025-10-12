---
timestamp: 'Sun Oct 12 2025 19:22:01 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_192201.197485bc.md]]'
content_id: d06365fdf5fc9232195621e5f3c370a1804f546aa12de3390859b0252bd0e77f
---

# Concept: FileTracker

* **concept**: FileTracker \[User, File]
* **purpose**: track current position and enable navigation within files
* **principle**: a user can create a FileTracker to keep track of their position in various files; they can track or untrack files, move through file items sequentially or skip to a specific file item; and they can control how their progress is displayed.
* **state**
  * a set of `TrackedFiles` with
    * an `owner` User
    * a `file` `File`
    * a `currentIndex` `Number`
    * a `maxIndex` `Number`
    * a `isVisible` `Flag`
* **actions**
  * `startTracking (owner: User, file: File)`
    * **requires** this `owner` exists, this `file` exists, this `owner` and this `file` isn't already in the set of `TrackedFiles`
    * **effects** create a new `TrackedFile` with this owner and this file, `currentIndex` is initialized to 0, `maxIndex` is the length of the file's items, `isVisible` set to true
  * `deleteTracking (owner: User, file: File)`
    * **requires** this `owner` and this `file` is in the set of TrackedFiles
    * **effects** delete the `TrackedFile` with this `owner` and this `file`
  * `jumpTo (owner: User, file: File, index: Number)`
    * **requires** this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`
    * **effects** updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`
  * `next (owner: User, file: File)`
    * **requires** this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`
    * **effects** increments the TrackedFile with this owner and this file by 1
  * back (owner: User, file: File)File)\`
    * **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
    * **effects** decrements the TrackedFile with this owner and this file by 1
  * getCurrentItem (owner: User, file: File): (index: Number)
    * **requires** this owner and this file exists in the TrackedFiles
    * **effects** in the TrackedFile with this owner and this file, return the currentIndex
  * `setVisibility (owner: User, file: File, visible: Flag)`
    * **requires** this owner and this file exists in the TrackedFiles
    * **effects** in the TrackedFile with this owner and this file, set isVisible to this visible

%% [@FileTracker-concept](src/concepts/FileTracker/FileTrackerConcept.ts) %%
