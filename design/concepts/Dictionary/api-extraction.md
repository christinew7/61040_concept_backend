[@api-extraction-from-spec](../../tools/api-extraction-from-spec.md)

[@implementation](../../../src/concepts/Dictionary/DictionaryConcept.ts)
# Extracting from code

The following is an explanation of how concepts are implemented, for the purposes of understanding how to extract an API.

[@implementing-concepts](../../background/implementing-concepts.md)

# prompt: 

Now, analyze the following Concept Implementation and generate the API documentation based on these instructions.
# response:

# API Specification: Dictionary Concept

**Purpose:** provide a translation between two specific languages

---

## API Endpoints

### POST /api/Dictionary/addTerm

**Description:** Adds a new term pair (a word in one language and its translation in another) to the dictionary.

**Requirements:**
- this language1 and language2 isn't already in the set of terms

**Effects:**
- creates a new Term with this language1 and this language2

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
---

### POST /api/Dictionary/deleteTerm

**Description:** Deletes a specific term pair (a word in one language and its translation in another) from the dictionary.

**Requirements:**
- this language 1 and this language 2 exist in the set of terms

**Effects:**
- deletes this language1 and this language2 from the set of terms

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
---

### POST /api/Dictionary/translateTermFromL1

**Description:** Translates a given word from language1 to language2.

**Requirements:**
- this language1 exists in the set of Terms

**Effects:**
- returns this language2 associated with this language1

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
---

### POST /api/Dictionary/translateTermFromL2

**Description:** Translates a given word from language2 to language1.

**Requirements:**
- this language2 exists in the set of Terms

**Effects:**
- returns this language1 associated with this language2

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
---