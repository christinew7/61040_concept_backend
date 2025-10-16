# Rewriting Library

[Full Response](../context/design/concepts/Library/implementation.md/20251016_144953.ec1c016f.md)

## Relevant Changes in Spec

- `createFile (owner: User, initialItem: String): (file: File)`
    - **requires** this `owner` has a `Library`, and a `File` with `[initialItem]` as its `items` does not already exist in this `owner`'s `Library`
    - **effects** creates a new `File` with `[initialItem]` as its content and the current `DateTime`, and adds this `File` to this `owner`'s `Library`
- `addItemToFile (owner: User, file: File, item: String)`
    - **requires** this `owner` has a `Library`, and this `file` is in this `owner`'s `Library`, and the `item` is not already present in the `file`'s `items` list
    - **effects** adds `item` to the `items` list of this `file`
- `modifyItemInFile (owner: User, file: File, index: Number, newItem: String)`
    - **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, `index` is a valid index for `file.items`, and `newItem` is not already present in the `file`'s `items` list (excluding the item at `index`)
    - **effects** replaces the item at `index` in `file.items` with `newItem`
- `removeItemFromFile (owner: User, file: File, index: Number)`
    - **requires** this `owner` has a `Library`, this `file` is in this `owner`'s `Library`, and `index` is a valid index for `file.items`
    - **effects** removes the item at `index` from `file.items`

