---
timestamp: 'Wed Oct 08 2025 17:32:41 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251008_173241.d8f70110.md]]'
content_id: 8ec4d6e4c91b595e351f7881062956fcde15d6c2de9185ab75bec2443033b1eb
---

# Concept: PasswordAuthentication

## Purpose

limit access to known users

## Principle

after a user registers with a username and password,
they can authenticate with that same username and password
and be treated each time as the same user

## State

```
a set of Users with
  a username String
  a password String
```

## Actions

### `register`

```
register (username: String, password: String): (user: User)
```

* **Requires:** This username doesn't already exist
* **Effects:** Creates a new User with this username and this password

### `authenticate`

```
authenticate (username: String, password: String): (user: User)
```

* **Requires:** This username exists in the Users set, input password matches username's preexisting password
* **Effects:** User is successfully authenticated and returns the User
