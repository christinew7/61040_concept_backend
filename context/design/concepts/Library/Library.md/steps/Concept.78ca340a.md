---
timestamp: 'Wed Oct 08 2025 17:50:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_175035.dd11686f.md]]'
content_id: 78ca340a24dd84dbe1690f59e525b4b071774736dcec9a8173157586510dba8e
---

# Concept: Library

**concept** Library \[User] <br>

**purpose** manage collection of files for users <br>

**principle** a user creates a library to store their files, <br> the user can add files to their library, <br> the user can retrieve any file in their library to view its contents, <br> and modify or delete the file as needed, <br> they can also delete the library if it's no longer needed<br>

**state** <br>

a set of Libraries with <br>

  an owner User <br>

  a set of Files <br>

a set of Files with <br>

  an items List\<String> <br>

  a dateAdded DateTime <br>

**actions** <br>

create(owner: User): (library: Library) <br>

  **requires** this owner doesn't already have a library<br>

  **effect** creates a new library with this owner and an empty set of files <br>

delete(owner: User): <br>

  **requires** this owner has a library<br>

  **effect** deletes this owner's library<br>

addFile(owner: User, items: List\<String>) <br>

  **requires** this owner has a library, this items doesn't exist in this owner's library of files<br>

  **effect** creates a file with this items and the DateTime it was added, adds this file to this owner's library<br>

modifyFile(owner: User, file: File, items: List\<String>) <br>

  **requires** this owner has a library, this file is in this owner's library <br>

  **effect** change this file's items to this items<br>

deleteFile(owner: User, file: File) <br>

  **requires** this owner has a library, this file is in this owner's library<br>

  **effect** deletes this file from this owner's library<br>

getAllFiles(owner: User): (files: Set\<File>) <br>

  **requires** this owner has a library<br>

  **effect** returns all files in this owner's library<br>
