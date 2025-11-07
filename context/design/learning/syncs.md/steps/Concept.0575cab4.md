---
timestamp: 'Thu Nov 06 2025 19:05:39 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_190539.3d736a01.md]]'
content_id: 0575cab421c3f70dc2a3d5dec2b903da2e9f2d6da6806de97cca7df78652000d
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

%% [@auth sync](../../src/syncs/auth.sync.ts) %%
