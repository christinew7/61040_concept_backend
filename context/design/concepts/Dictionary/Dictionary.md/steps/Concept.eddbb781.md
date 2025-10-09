---
timestamp: 'Wed Oct 08 2025 17:43:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_174302.21687741.md]]'
content_id: eddbb7817e4a582fe2b41d4d921dacb46ee70bb3dbc9e70e9da8e4101c73be43
---

# Concept: Dictionary

**concept** Dictionary <br>

**purpose** provide a translation between two specific languages <br>

**principle** the dictionary maintains a mapping of terms between two languages, <br> a user can request the translation of a term and the dictionary will provide the appriopriate term in the other language <br>

**state** <br>

a set of Terms with <br>

  a language1 String <br>

  a language2 String <br>

**actions** <br>

addTerm(language1: String, language2: String) <br>

  **requires** this language1 and this language2 as a set isn't already in the set of Terms <br>

  **effect** adds this language1 and this language2 to the set of Terms <br>

deleteTerm(language1: String, language2: String) <br>

  **requires** this language1 and this language2 exist in the set of Terms<br>

  **effect** deletes this language1 and this language2 from the set of Terms <br>

translateTerm(language1: String): (language2: String) <br>

  **requires** this language1 exists in the set of Terms<br>

  **effect** returns this language2 associated with this language1<br>
