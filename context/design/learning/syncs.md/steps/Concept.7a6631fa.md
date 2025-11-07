---
timestamp: 'Wed Nov 05 2025 23:47:06 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251105_234706.6c20ac3a.md]]'
content_id: 7a6631fa02321cf391402743d41edfcecbf04d33a5c77b379ea1859ab726cc0f
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
    * **requires** this `username` doesn't already exist, this username is not empty
    * **effects** creates a new User with this `username` and this `password`
  * `authenticate (username: String, password: String): (user: User)`
    * **requires** this `username` exists in the Users set, input `password` matches username's preexisting password
    * **effects** User is successfully authenticated and returns the User
