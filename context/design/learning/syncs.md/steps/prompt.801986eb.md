---
timestamp: 'Thu Nov 06 2025 12:24:10 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_122410.2636b18d.md]]'
content_id: 801986eb2b6db7e7c9127cc1b1b8a82323b351b866cfc52a2d28f9f5d5ebad20
---

# prompt:

I have this sync for my dictionary
**sync** translate\
**when** Request.translate(page)\
**where** word is in page\
**then** Dictionary.translate(word)
where I look at the file, and go through the word in the file, if the word is in the dictionary terms, then I translate it for all the words. how can i do this? in a dictionary sync?
