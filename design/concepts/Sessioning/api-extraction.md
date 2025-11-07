[@api-extraction-from-spec](../../tools/api-extraction-from-spec.md)

[@implementation](../../../src/concepts/Sessioning/SessioningConcept.ts)
# Extracting from code

The following is an explanation of how concepts are implemented, for the purposes of understanding how to extract an API.

[@implementing-concepts](../../background/implementing-concepts.md)

# prompt:

Now, analyze the following Concept Implementation and generate the API documentation based on these instructions.

# response:

# API Specification: Sessioning Concept

**Purpose:** To maintain a user's logged-in state across multiple requests without re-sending credentials.

---

## API Endpoints

### POST /api/Sessioning/create

**Description:** Creates a new session and associates it with the given user.

**Requirements:**
- true.

**Effects:**
- creates a new Session `s`.
- associates it with the given `user`.
- returns `s` as `session`.

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
---

### POST /api/Sessioning/delete

**Description:** Removes the specified session.

**Requirements:**
- the given `session` exists.

**Effects:**
- removes the session `s`.

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
---

### POST /api/Sessioning/_getUser

**Description:** Returns the user associated with the specified session.

**Requirements:**
- the given `session` exists.

**Effects:**
- returns the user associated with the session.

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
---