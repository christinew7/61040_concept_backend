---
timestamp: 'Thu Nov 06 2025 00:59:35 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_005935.446f7d88.md]]'
content_id: 98bff0c3b1580eaddf5c2fde272e6f01c890cfe60cdbd6bd082e02deca54e10c
---

# API Specification: Sessioning Concept

**Purpose:** To maintain a user's logged-in state across multiple requests without re-sending credentials.

***

## API Endpoints

### POST /api/Sessioning/create

**Description:** Creates a new session and associates it with the given user.

**Requirements:**

* true.

**Effects:**

* creates a new Session `s`.
* associates it with the given `user`.
* returns `s` as `session`.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{
  "session": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Sessioning/delete

**Description:** Removes the specified session.

**Requirements:**

* the given `session` exists.

**Effects:**

* removes the session `s`.

**Request Body:**

```json
{
  "session": "string"
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

### POST /api/Sessioning/\_getUser

**Description:** Returns the user associated with the specified session.

**Requirements:**

* the given `session` exists.

**Effects:**

* returns the user associated with the session.

**Request Body:**

```json
{
  "session": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": "string"
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
