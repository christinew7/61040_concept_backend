---
timestamp: 'Tue Oct 14 2025 12:12:38 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251014_121238.1f6167dd.md]]'
content_id: 93a9668be81bf563a4b5437555bce782614107c1a21102aa158852eff5f775ba
---

# context:

/\*\*

* @action addFile

* @requires this owner has a Library, and a File with these items doesn't already exist in this owner's Library

* @effects creates a File with these items and the current Date, and adds this File to this owner's Library

\*/

async addFile(

{ owner, items }: { owner: User; items: string\[] },

): Promise<{ id: File } | { error: string }> {
