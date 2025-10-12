---
timestamp: 'Sun Oct 12 2025 19:30:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251012_193024.268932f9.md]]'
content_id: 6e9bcc3e786cb9342f7cf2c6ca291d028fc62dadfef793325a46d6b6f3aba2aa
---

# prompt: is there a way to get the maxIndex from the file using the file's id or is it easier to just pass it in?

/\*\*

* @action startTracking

* @param owner - The ID of the user.

* @param file - The ID of the file.

* @returns {Promise\<Empty | { error: string }>} An empty object on success, or an error object.

*

* @requires this owner exists, this file exists, this owner and this file isn't already in the set of TrackedFiles

* @effects create a new TrackedFile with this owner and this file, curentIndex is initialized to 0,

* `isVisible` set to true

\*/

async startTracking({ owner, file }: { owner: User; file: File; maxIndex: number }): Promise\<Empty | { error: string }> {

// Assumption: 'owner' and 'file' existence (i.e., they are valid IDs) is handled externally.

// Validate `maxIndex`

if (typeof maxIndex !== "number" || maxIndex < 0 || !Number.isInteger(maxIndex)) {

return { error: `Invalid maxIndex: ${maxIndex}. Must be a non-negative integer.` };

}
