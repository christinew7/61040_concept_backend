---
timestamp: 'Wed Oct 08 2025 17:38:34 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_173834.9527c4c3.md]]'
content_id: 3caf0ea6da2254e281968465b64d95e4022c60db0c9e87d98eedc5b40d19cc84
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
