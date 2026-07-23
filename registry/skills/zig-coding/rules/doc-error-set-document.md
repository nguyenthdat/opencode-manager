# doc-error-set-document

> Document error sets and precisely when each member is returned

## Why It Matters

An error carries no payload (`err-error-payload`), so the *only* place a caller can learn "under what exact condition does this specific error occur" is the documentation next to the error set or the function returning it. Skipping this documentation means every caller who needs to handle a specific error has to read the implementation to find out when it fires.

## Bad

```zig
const std = @import("std");

/// Loads a user by id.
pub const LoadError = error{ NotFound, InvalidData, OutOfMemory };
pub fn loadUser(id: u64) LoadError!User {
    _ = id;
    return error.NotFound;
}

const User = struct {};
```

## Good

```zig
const std = @import("std");

pub const LoadError = error{
    /// No user record exists with the given id.
    NotFound,
    /// The stored record exists but failed to parse as valid JSON,
    /// or is missing a required field.
    InvalidData,
    OutOfMemory,
};

/// Loads a user by id from the on-disk user store.
///
/// Returns `error.NotFound` if no record exists for `id`, or
/// `error.InvalidData` if the record exists but is corrupt.
pub fn loadUser(id: u64) LoadError!User {
    _ = id;
    return error.NotFound;
}

const User = struct {};
```

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - defining the sets this rule documents
- [err-error-payload](err-error-payload.md) - why documentation is the only source of this detail
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc-comment mechanism used here
