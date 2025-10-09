---
timestamp: 'Wed Oct 08 2025 17:55:39 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_175539.74f27cd5.md]]'
content_id: c012f9748111302ea17bd4f302354f377e68e6f3c818a26a3513b58263cd0ee6
---

# Concept: FileTracker

**concept** FileTracker \[User, File] <br>

**purpose** track current position and enable navigation within files <br>

**principle** a user can move through file items sequentially without losing their place, or skip to a file item <br> the user can control how progress is displayed <br>

**state** <br>

a set of TrackedFiles with <br>

  an owner User <br>

  a file File <br>

  a currentIndex Number <br>

  a maxIndex Number <br>

  a isVisible Flag

**actions** <br>

startTracking(owner: User, file: File): <br>

  **requires** this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles <br>

  **effect** create a new TrackedFile with this owner and this file, currentIndex is initialized to 0, maxIndex is the length of the file's items, isVisible set to true<br>

deleteTracking(owner: User, file: File): <br>

  **requires** this owner and this file is in the set of TrackedFiles <br>

  **effect** delete this TrackedFile <br>

jumpTo(owner: User, file: File, index: Number): <br>

  **requires** this owner and this file exists in the TrackedFiles, this index is a valid index between 0 and the maxIndex <br>

  **effect** updates the currentIndex of the TrackedFile with this owner and this file to this index <br>

next(owner: User, file: File) <br>

  **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is less than the maxIndex <br>

  **effect** increments the TrackedFile with this owner and this file by 1 <br>

back(owner: User, file: File) <br>

  **requires** this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0 <br>

  **effect** decrements the TrackedFile with this owner and this file by 1 <br>

getCurrentItem(owner: User, file: File): (index: Number) <br>

  **requires** this owner and this file exists in the TrackedFiles <br>

  **effect** in the TrackedFile with this owner and this file, return the currentIndex <br>

setVisibility(owner: User, file: File, visible: Flag) <br>

  **requires** this owner and this file exists in the TrackedFiles <br>

  **effect** in the TrackedFile with this owner and this file, set isVisible to this visible<br>

## Synchronizations

**sync** createLibrary <br>

**when** PasswordAuthentication.register(username: String, password: String)<br>

**then** Library.create(owner: User) <br>

**sync** addFile <br>

**when** Library.addFile(user, items: List\<Items>)<br>

**then** FileTracker.startTracking(user, file) <br>

**sync** stopTrackingOnDeleteFile <br>

**when** Library.deleteFile(user, file) <br>

**then** FileTracker.deleteTracking(user, file) <br>

**sync** stopTrackingOnDeleteLibrary <br>

**when** Library.delete(user) <br>

**where** file in FileTracker.TrackedFiles with owner = user <br>

**then** FileTracker.deleteTracking(user, file) <br>

**sync** translate <br>

**when** Request.translate(page) <br>

**where** word is in page <br>

**then** Dictionary.translate(word) <br>
