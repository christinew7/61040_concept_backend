---
timestamp: 'Sat Oct 18 2025 11:11:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_111154.b7fe3583.md]]'
content_id: a2276aaa91e44b8b868cc9ef1fd96ee2e4a3d57a62310e3271d79f105c51e2bf
---

# API Specification: FileTracker Concept

**Purpose:** track current position and enable navigation within files

***

## API Endpoints

### POST /api/FileTracker/startTracking

**Description:** Creates a new file tracking record for a user and file, initializing the current position.

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

**Description:** Deletes an existing file tracking record for a user and file.

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

**Description:** Updates the current tracking position to a specified index within a file.

**Requirements:**

* this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`

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

**Description:** Advances the current tracking position to the next item in the file.

**Requirements:**

* this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`

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

**Description:** Moves the current tracking position to the previous item in the file.

**Requirements:**

* this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0

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

**Description:** Sets the visibility status of a tracked file for a user.

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

**Description:** Starts tracking a file, leveraging an LLM to determine an initial current index based on file content.

**Requirements:**

* this `owner` exists, this `file` (referencing `fildId`) exists,
* this `owner` and this `file` isn't already in the set of `TrackedFiles`,
* this `fileInput` is in JSON format.

**Effects:**

* uses an internal `llm` to determine a more accurate `currentIndex` for the file,
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

**Description:** Retrieves the current tracking index for a specific file being tracked by a user.

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
