---
timestamp: 'Sat Oct 18 2025 11:12:07 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_111207.b1738dec.md]]'
content_id: faaeb4ea6a5d5efa8a53bd6c5f04d59bde8e1a8526fc6863f89c0fb20a5c4673
---

# API Specification: FileTracker Concept

**Purpose:** track current position and enable navigation within files

***

## API Endpoints

### POST /api/FileTracker/startTracking

**Description:** A user can create a FileTracker to keep track of their position in various files.

**Requirements:**

* this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles

**Effects:**

* create a new TrackedFile with this owner and this file, curentIndex is initialized to 0, `maxIndex` is the length of the file's items , `isVisible` set to true

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "maxIndex": "number"
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

### POST /api/FileTracker/deleteTracking

**Description:** Deletes tracking for a specific owner and file.

**Requirements:**

* this `owner` and this `file` is in the set of TrackedFiles

**Effects:**

* delete the `TrackedFile` with this `owner` and this `file`

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

### POST /api/FileTracker/jumpTo

**Description:** Updates the current index of a tracked file to a specified position.

**Requirements:**

* this `owner` and this `file` exists in the TrackedFiles
* this `index` is a valid index between 0 and the `maxIndex`

**Effects:**

* updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`

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

### POST /api/FileTracker/next

**Description:** Increments the current index of a tracked file by 1.

**Requirements:**

* this `owner` and this `file` exists in the TrackedFiles
* the `currentIndex` of this TrackedFile is less than the `maxIndex`

**Effects:**

* increments the TrackedFile with this owner and this file by 1

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

### POST /api/FileTracker/back

**Description:** Decrements the current index of a tracked file by 1.

**Requirements:**

* this owner and this file exists in the TrackedFiles
* the currentIndex of this TrackedFile is greater than 0

**Effects:**

* decrements the TrackedFile with this owner and this file by 1

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

### POST /api/FileTracker/setVisibility

**Description:** Sets the visibility status of a tracked file.

**Requirements:**

* this owner and this file exists in the TrackedFiles

**Effects:**

* in the TrackedFile with this owner and this file, set isVisible to this visible

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "visible": "boolean"
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

### POST /api/FileTracker/startTrackingUsingLLM

**Description:** Starts tracking a file for a user, using an LLM to determine an initial current index based on file content.

**Requirements:**

* this `owner` exists
* this `file` (referencing `fildId`) exists
* this `owner` and this `file` isn't already in the set of `TrackedFiles`
* this `fileInput` is in JSON format.

**Effects:**

* uses an internal `llm` to determine a more accurate `currentIndex` for the file
* then creates a new `TrackedFile` document in the database.

**Request Body:**

```json
{
  "owner": "string",
  "file": "string",
  "fileInput": "string",
  "fileMaxIndex": "number"
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

### POST /api/FileTracker/\_getCurrentItem

**Description:** Retrieves the current index of a tracked file for a specific owner and file.

**Requirements:**

* this owner and this file exists in the TrackedFiles

**Effects:**

* in the TrackedFile with this owner and this file, return the currentIndex

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
    "index": "number"
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
