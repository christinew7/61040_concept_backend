---
timestamp: 'Thu Nov 06 2025 00:07:21 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_000721.99f6c3c7.md]]'
content_id: 78e49741e0661e3c93b41399115292f02be6423864aad02b6fcffabeae827073
---

# prompt: can you help me \_get all Files and \_create on register?  i don't have a Sessioning in my concepts, I just have PasswordAuthentication, and Library, but I can pass it in a session as a parameter?

This is one of the primary motivations behind assignment A4C - to actually add synchronizations that do this! I would first review last Wednesday's lecture, which goes into the background for this very problem. As you say, if you were to augment all existing concept actions to accept a session ID, this would violate concept modularity. So the new backend suggests that instead you reify what's really going on: you're making a **request to do concept action**, which then itself independently has some session token. **When** that request occurs, **where** the session is associated with a valid user login, **then** your actual concept action fires.

There's an entire repository for the example app we demoed last Wednesday that demonstrates exactly how UserAuthentication, Sessioning, and Requesting work together. For a top level architecture and an example synchronization, check out:

<https://github.com/61040-fa25/conceptbox/blob/main/design/background/architecture.md>

The rest of the repository is an informative look into this pattern and further motivates the Requesting concept and how to do authentication/authorization in a robust and modular way.
