---
timestamp: 'Thu Nov 06 2025 00:14:51 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_001451.f79b3688.md]]'
content_id: 38487c58f2f58642cc0d956ccd0b24b7a03152913bedf8a6ef26fc771cdd9851
---

# prompt: can you help me \_get all Files and \_create on register?  i don't have a Sessioning in my concepts, I just have PasswordAuthentication, and Library, but I can pass it in a session as a parameter? am I supposed to pass in the user for getUserId? how does this work ?

This is one of the primary motivations behind assignment A4C - to actually add synchronizations that do this! I would first review last Wednesday's lecture, which goes into the background for this very problem. As you say, if you were to augment all existing concept actions to accept a session ID, this would violate concept modularity. So the new backend suggests that instead you reify what's really going on: you're making a **request to do concept action**, which then itself independently has some session token. **When** that request occurs, **where** the session is associated with a valid user login, **then** your actual concept action fires.

There's an entire repository for the example app we demoed last Wednesday that demonstrates exactly how UserAuthentication, Sessioning, and Requesting work together. For a top level architecture and an example synchronization, check out:

<https://github.com/61040-fa25/conceptbox/blob/main/design/background/architecture.md>

The rest of the repository is an informative look into this pattern and further motivates the Requesting concept and how to do authentication/authorization in a robust and modular way.
