---
timestamp: 'Sat Oct 18 2025 11:11:35 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_111135.62aae742.md]]'
content_id: d8e8dee498cb1a057a46c6f099bb9c86ebc95b2c950a1b86fe224bdd446339d3
---

# API Specification: Dictionary Concept

**Purpose:** provide a translation between two specific languages

***

## API Endpoints

### POST /api/Dictionary/addTerm

**Description:** Adds a new term pair (a word in one language and its translation in another) to the dictionary.

**Requirements:**

* this language1 and language2 isn't already in the set of terms

**Effects:**

* creates a new Term with this language1 and this language2

**Request Body:**

```json
{
  "language1": "string",
  "language2": "string"
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

### POST /api/Dictionary/deleteTerm

**Description:** Deletes a specific term pair (a word in one language and its translation in another) from the dictionary.

**Requirements:**

* this language 1 and this language 2 exist in the set of terms

**Effects:**

* deletes this language1 and this language2 from the set of terms

**Request Body:**

```json
{
  "language1": "string",
  "language2": "string"
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

### POST /api/Dictionary/translateTermFromL1

**Description:** Translates a given word from language1 to language2.

**Requirements:**

* this language1 exists in the set of Terms

**Effects:**

* returns this language2 associated with this language1

**Request Body:**

```json
{
  "language1": "string"
}
```

**Success Response Body (Action):**

```json
{
  "language2": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Dictionary/translateTermFromL2

**Description:** Translates a given word from language2 to language1.

**Requirements:**

* this language2 exists in the set of Terms

**Effects:**

* returns this language1 associated with this language2

**Request Body:**

```json
{
  "language2": "string"
}
```

**Success Response Body (Action):**

```json
{
  "language1": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
