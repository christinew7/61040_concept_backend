[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-specifications](../../background/concept-specifications.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@Library](Library.md)

[@Library implementation](../../../src/concepts/Library/LibraryConcept.ts)

# context: 
- **Composite objects**. Make sure that all of the arguments and results of your actions are either primitive values (strings, numbers, etc) or object identifiers (actually document identifiers in MongoDB). Composite objects should be used only inside concept implementations and never exposed.

# prompt: can you fix this query for me? and add a typestring for it
async _getFileString(

{ owner, file }: { owner: User; file: File },

): Promise<{ fileString: string } | { error: string }> {

const ownerLibrary = await this.libraries.findOne({ owner });

if (!ownerLibrary) {

return { error: `User ${owner} does not have a library.` };

}

  

const fileInDoc = await this.files.find({

library: ownerLibrary._id,

_id: file,

});

if (!fileInDoc) {

return { error: `File ${file} not found in the user ${owner}'s library` };

}

const items = fileInDoc.items;

return { fileString: JSON.stringify(items) };

}
# response:

```typescript
/**
 * @query _getFileString
 * @requires this owner has a Library, and this file is in this owner's Library
 * @effects returns the items list of the specified file as a JSON string
 */
async _getFileString(
  { owner, file }: { owner: User; file: File },
): Promise<{ fileString: string } | { error: string }> {
  const ownerLibrary = await this.libraries.findOne({ owner });
  if (!ownerLibrary) {
    return { error: `User ${owner} does not have a library.` };
  }

  // Use findOne to get a single document, as we expect a specific file
  const fileDoc = await this.files.findOne({
    _id: file,
    library: ownerLibrary._id,
  });

  if (!fileDoc) { // Check if a document was actually found
    return { error: `File ${file} not found in the user ${owner}'s library` };
  }

  // Access the items array from the found document
  const items = fileDoc.items;
  return { fileString: JSON.stringify(items) };
}
```