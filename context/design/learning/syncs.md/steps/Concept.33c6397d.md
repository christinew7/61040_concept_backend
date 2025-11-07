---
timestamp: 'Thu Nov 06 2025 01:25:17 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_012517.14271996.md]]'
content_id: 33c6397d999b2c1745e696eb3669e1e03a84018526755a2b8a33124ab957cfef
---

# Concept: Sessioning \[User,  Session]

* **concept**: Sessioning
* **purpose**: maintain a user's logged-in state across multiple requests without resending credentials
* **principle** after a user is authenticated, a session is created for them <br> subsequent requests using that session's ID are treated as being performed by that user, until the session is deleted (logout)
* **state**
  * a set of `Sessions` with
    * a `user` User
* **actions**
  * `create (user: User): (session: Session)`
    * **requires**  true
    * **effects**  creates a new Session `s`; associates it with the given `user`; returns `s` as `session`
  * `delete (session: Session): ()`
    * **requires**: the given `session` exists.
    * **effects**: removes the session `s`.
