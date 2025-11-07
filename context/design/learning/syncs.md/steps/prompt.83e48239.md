---
timestamp: 'Thu Nov 06 2025 12:41:49 GMT-0500 (Eastern Standard Time)'
parent: '[[../20251106_124149.70dba942.md]]'
content_id: 83e48239d9f47249675260392213d4c4d9670a09454d9a567531246118a839bb
---

# prompt:

I have this sync for my dictionary
**sync** translate\
**when** Request.translate(page)\
**where** word is in page\
**then** Dictionary.translate(word)
where I look at the file, and go through the word in the file, if the word is in the dictionary terms, then I translate it for all the words. how can i do this? in a dictionary sync? i want to keep all the functions actions
