---
timestamp: 'Fri Nov 07 2025 13:14:43 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251107_131443.3341eb11.md]]'
content_id: 01e15dd01c7b53eec09de2077c1cc682caec742b4948a2adf961a3f63c0960b1
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
* **queries**:
  * `_getUser (session: Session): (user: User)`
    * **requires**: the given `session` exists.
    * **effects**: returns the user associated with the session.

%% [@auth sync](../../src/syncs/auth.sync.ts) %%
