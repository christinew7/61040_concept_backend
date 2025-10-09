---
timestamp: 'Wed Oct 08 2025 17:59:43 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_175943.7d3cae8b.md]]'
content_id: 1a0a193b690111eee073ac0506ce12d0c7d9937375d70e00fbb1e8b80a145808
---

# Concept: FileTracker

**concept** FileTracker \[User, File]

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
