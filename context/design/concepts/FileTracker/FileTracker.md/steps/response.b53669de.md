---
timestamp: 'Wed Oct 08 2025 17:58:37 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_175837.9c44eedc.md]]'
content_id: b53669deec45c6d158b6ee81980da38d6474b8637719ccbbb012410172382277
---

# response:

My apologies for the misunderstanding. You are correct; the concept design methodology explicitly defines type parameters in the `concept` line for externally defined, polymorphically treated objects.

Here's the `FileTracker` concept with the generic types `User` and `File` restored to its definition:

```
# Concept: FileTracker

**concept** FileTracker [User, File]

**purpose** track current position and enable navigation within files

**principle** a user can move through file items sequentially without losing their place, or skip to a file item
the user can control how progress is displayed

**state**
  a set of TrackedFiles with
    an owner User
    a file File
    a currentIndex Number
    a maxIndex Number
    a isVisible Flag

**actions**
  startTracking(owner: User, file: File):
    **requires** this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles
    **effect** create a new TrackedFile with this owner and this file, currentIndex is initialized to 0, maxIndex is the length of the file's items, isVisible set to true

  deleteTracking(owner: User, file: File):
    **requires** this owner and this file is in the set of TrackedFiles
    **effect** delete this TrackedFile

  jumpTo(owner: User, file: File, index: Number):
    **requires** this owner and this file exists in the TrackedFiles, this index is a valid index between 0 and the maxIndex
    **effect** updates the currentIndex of the TrackedFile with this owner and this file to this index

  next(owner: User, file: File):
    **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is less than the maxIndex
    **effect** increments the TrackedFile with this owner and this file by 1

  back(owner: User, file: File):
    **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0
    **effect** decrements the TrackedFile with this owner and this file by 1

  getCurrentItem(owner: User, file: File): (index: Number)
    **requires** this owner and this file exists in the TrackedFiles
    **effect** in the TrackedFile with this owner and this file, return the currentIndex

  setVisibility(owner: User, file: File, visible: Flag):
    **requires** this owner and this file exists in the TrackedFiles
    **effect** in the TrackedFile with this owner and this file, set isVisible to this visible
```
