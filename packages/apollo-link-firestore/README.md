# `apollo-link-firebase-firestore`

an Apollo link to firebase's firestore.

## Directives

This Apollo link uses directives to provide hints within the query on how to interface with firestore. The following directives can be used in queries and mutations.

- `@field`
- `@mutation`
- `@query`
- `@ref`

### Common directive arguments

-

### `field`

`@field` is only permitted on leaf fields.

- `key: String | true` (optional)

`key` saves the result of the field it is attached to in a special data bag that can be used in other parts of the query using the format `$field{key}`. When `true`, the `fieldName` will be used as the key name.

- `serverTimestamps: 'estimate' | 'previous' | 'none'` (optional)

controls the return value for server timestamps (see `SnapshotOptions` for more details)

### `mutation`

- `dataArg`
- `dataVar`
- `merge`
- `mergeFields`
- `mutationType`

### `query`

### `ref`

similar to `@field` but not permitted on leaf fields, similar to `@query` but does not include `rootType` and is only valid for sub-collections on a document. `ref` can be used to control how sub components of the query interact with firestore.
