
[@api-extraction-from-spec](../../tools/api-extraction-from-spec.md)

[@implementation](../../../src/concepts/FileTracker/FileTrackerConcept.ts)
# Extracting from code

The following is an explanation of how concepts are implemented, for the purposes of understanding how to extract an API.

[@implementing-concepts](../../background/implementing-concepts.md)

# prompt:

Now, analyze the following Concept Implementation and generate the API documentation based on these instructions.

# response:

# API Specification: FileTracker Concept

**Purpose:** track current position and enable navigation within files

---

## API Endpoints

### POST /api/FileTracker/startTracking

**Description:** Creates a new tracker for a user and a file, initializing the position.

**Requirements:**
- this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles

**Effects:**
- create a new TrackedFile with this owner and this file, curentIndex is initialized to 0,
- `maxIndex` is the length of the file's items , `isVisible` set to true

**Request Body:**
```json
{
  "owner": "User",
  "file": "File",
  "maxIndex": "number"
}
```

**Success Response Body (Action):**
```json
{
  "id": "TrackedFile"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/FileTracker/deleteTracking

**Description:** Deletes an existing file tracker for a given user and file.

**Requirements:**
- this `owner` and this `file` is in the set of TrackedFiles

**Effects:**
- delete the `TrackedFile` with this `owner` and this `file`

**Request Body:**
```json
{
  "owner": "User",
  "file": "File"
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
---
### POST /api/FileTracker/jumpTo

**Description:** Updates the current position within a tracked file to a specific index.

**Requirements:**
- this `owner` and this `file` exists in the TrackedFiles, this `index` is a valid index between 0 and the `maxIndex`

**Effects:**
- updates the `currentIndex` of the TrackedFile with this `owner` and this `file` to this `index`

**Request Body:**
```json
{
  "owner": "User",
  "file": "File",
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
---
### POST /api/FileTracker/next

**Description:** Moves the current position in a tracked file to the next item.

**Requirements:**
- this `owner` and this `file` exists in the TrackedFiles, the `currentIndex` of this TrackedFile is less than the `maxIndex`

**Effects:**
- increments the TrackedFile with this owner and this file by 1

**Request Body:**
```json
{
  "owner": "User",
  "file": "File"
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
---
### POST /api/FileTracker/back

**Description:** Moves the current position in a tracked file to the previous item.

**Requirements:**
- this owner and this file exists in the TrackedFiles, the currentIndex of this TrackedFile is greater than 0

**Effects:**
- decrements the TrackedFile with this owner and this file by 1

**Request Body:**
```json
{
  "owner": "User",
  "file": "File"
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
---
### POST /api/FileTracker/setVisibility

**Description:** Sets the visibility of the progress tracker for a specific file.

**Requirements:**
- this owner and this file exists in the TrackedFiles

**Effects:**
- in the TrackedFile with this owner and this file, set isVisible to this visible

**Request Body:**
```json
{
  "owner": "User",
  "file": "File",
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
---
### POST /api/FileTracker/startTrackingUsingLLM

**Description:** Uses an LLM to intelligently determine a starting position and then begins tracking a file.

**Requirements:**
- this `owner` exists, this `file` (referencing `fildId`) exists,
- this `owner` and this `file` isn't already in the set of `TrackedFiles`,
- this `fileInput` is in JSON format.

**Effects:**
- uses an internal `llm` to determine a more accurate `currentIndex` for the file,
- then creates a new `TrackedFile` document in the database.

**Request Body:**
```json
{
  "owner": "User",
  "file": "File",
  "fileInput": "string",
  "fileMaxIndex": "number"
}
```

**Success Response Body (Action):**
```json
{
  "id": "TrackedFile"
}
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
### POST /api/FileTracker/_getCurrentItem

**Description:** Retrieves the current tracking index for a user and file.

**Requirements:**
- this owner and this file exists in the TrackedFiles

**Effects:**
- in the TrackedFile with this owner and this file, return the currentIndex

**Request Body:**
```json
{
  "owner": "User",
  "file": "File"
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
---
### POST /api/FileTracker/_getVisibility

**Description:** Retrieves the visibility status for a tracked file.

**Requirements:**
- This owner and this file exists in the TrackedFiles.

**Effects:**
- Returns the visibility flag of the file.

**Request Body:**
```json
{
  "owner": "User",
  "file": "File"
}
```

**Success Response Body (Query):**
```json
[
  {
    "isVisible": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---

### POST /api/FileTracker/_getVisibility

**Description:** Retrieves the visibility of a tracked file for a specific owner and file.

**Requirements:**
- this owner and this file exists in the TrackedFiles

**Effects:**
- in the TrackedFile with this owner and this file, return the currentIndex

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
    "isVisible": "boolean"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---