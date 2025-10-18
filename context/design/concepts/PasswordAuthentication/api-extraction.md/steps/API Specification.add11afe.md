---
timestamp: 'Sat Oct 18 2025 11:06:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_110659.9e70031d.md]]'
content_id: add11afedf653344b87fe5fac011186d3f733d0280adb0f448b3a2fef98027a5
---

# API Specification: PasswordAuthentication Concept

**Purpose:** limit access to known users

***

## API Endpoints

### POST /api/PasswordAuthentication/register

**Description:** Creates a new user account with the provided username and password.

**Requirements:**

* a User with the given username doesn't already exist
* this username is not empty

**Effects:**

* creates a new User with the given username and password and a unique ID

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/authenticate

**Description:** Authenticates a user with the provided username and password.

**Requirements:**

* the user with the given username exists
* input password matches username's preexisting password

**Effects:**

* User is successfully authenticated and returns the User

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/PasswordAuthentication/\_getUserByUsername

**Description:** Retrieves a user's document by their username.

**Requirements:**

* None explicit.

**Effects:**

* returns the user document if found by username

**Request Body:**

```json
{
  "username": "string"
}
```

**Success Response Body (Query):**

```json
[
  {
    "user": {
      "_id": "ID",
      "username": "string",
      "password": "string"
    }
  }
]
```

*(Returns an empty array `[]` if no user is found.)*

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
