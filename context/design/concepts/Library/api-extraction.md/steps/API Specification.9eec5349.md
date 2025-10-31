---
timestamp: 'Thu Oct 30 2025 20:12:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251030_201234.50b9b542.md]]'
content_id: 9eec5349d6239136a37ffdf624669bf2f62d996aff6a5a1d7308a1a0f0ea7b2d
---

# API Specification: Library Concept

**Purpose:** manage collection of files for users

***

## API Endpoints

### POST /api/Library/create

**Description:** creates a new Library with this owner and an empty set of Files.

**Requirements:**

* this owner doesn't already have a Library

**Effects:**

* creates a new Library with this owner and an empty set of Files

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Action):**

```json
{
  "library": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/delete

**Description:** deletes this owner's Library and all associated Files.

**Requirements:**

* this owner has a Library

**Effects:**

* deletes this owner's Library and all associated Files

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/createFile

**Description:** creates a File with the current DateTime and an empty items, and adds this File to this owner's Library.

**Requirements:**

* this owner has a Library

**Effects:**

* creates a File with the current DateTime and an empty items, and adds this File to this owner's Library

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Action):**

```json
{
  "id": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/addItemToFile

**Description:** adds item to the items list of this file.

**Requirements:**

* this owner has a Library, and this file is in this owner's Library

**Effects:**

* adds item to the items list of this file

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "item": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/modifyItemInFile

**Description:** replaces the item at index in file.items with newItem.

**Requirements:**

* this owner has a Library, this file is in this owner's Library, index is a valid index for file.items (in \[0, items.length()))

**Effects:**

* replaces the item at index in file.items with newItem

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "index": "number",
  "newItem": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/removeItemFromFile

**Description:** removes the item at index from file.items.

**Requirements:**

* this owner has a Library, this file is in this owner's Library, and index is a valid index for file.items (in \[0, items.length()))

**Effects:**

* removes the item at index from file.items

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "index": "number"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/setImageToFile

**Description:** sets the image field of this file to image.

**Requirements:**

* this owner has a Library, and this file is in this owner's Library

**Effects:**

* sets the image field of this file to image

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "image": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/clearImageFromFile

**Description:** clears the image field of this file (sets to null).

**Requirements:**

* this owner has a Library, and this file is in this owner's Library

**Effects:**

* clears the image field of this file (sets to null)

**Request Body:**

```json
{
  "owner": "string",
  "file": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/deleteFile

**Description:** deletes this file from this owner's Library.

**Requirements:**

* this owner has a Library, and this file is in this owner's Library

**Effects:**

* deletes this file from this owner's Library

**Request Body:**

```json
{
  "owner": "string",
  "file": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/\_getAllFiles

**Description:** returns all Files in this owner's Library (full FileDoc objects, not just IDs).

**Requirements:**

* this owner has a Library

**Effects:**

* returns all Files in this owner's Library (full FileDoc objects, not just IDs)

**Request Body:**

```json
{
  "owner": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "string",
    "library": "string",
    "items": ["string"],
    "image": "string | null",
    "dateAdded": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Library/\_getFileString

**Description:** returns the items list of the specified file as a JSON string.

**Requirements:**

* this owner has a Library, and this file is in this owner's Library

**Effects:**

* returns the items list of the specified file as a JSON string

**Request Body:**

```json
{
  "owner": "string",
  "file": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "fileString": "string"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
