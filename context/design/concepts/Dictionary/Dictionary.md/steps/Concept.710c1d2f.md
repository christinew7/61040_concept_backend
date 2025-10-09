---
timestamp: 'Wed Oct 08 2025 17:46:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_174624.4dba64a9.md]]'
content_id: 710c1d2f520ea3fa5f3bbe49a1daa12a94685a08ddf3adc26b56298eb5934b76
---

# Concept: PasswordAuthentication

* **concept**: PasswordAuthentication
* **purpose**: limit access to known users
* **principle** after a user registers with a username and password, <br>they can authenticate with that same username and password <br>and be treated each time as the same user
* **state**
  * a set of `Users` with
    * a `username` String
    * a `password` String
* **actions**
  * `register (username: String, password: String): (user: User)`
    * **requires** this `username` doesn't already exist
    * **effects** creates a new User with this `username` and this `password`
  * `authenticate (username: String, password: String): (user: User)`
    * **requires** this `username` exists in the Users set, input `password` matches username's preexisting password
    * **effects** User is successfully authenticated and returns the User

[concept-design-brief](../../background/concept-design-brief.md)

[concept-design-overview](../../background/concept-design-overview.md)

[concept-specifications](../../background/concept-specifications.md)
