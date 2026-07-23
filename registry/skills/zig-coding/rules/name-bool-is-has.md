# name-bool-is-has

> Use `is`/`has`/`can`/`should` prefixes for boolean-returning functions and boolean fields

## Why It Matters

A boolean name that reads as a question (`isValid`, `hasChildren`, `canRetry`) makes call sites self-documenting: `if (user.isActive())` reads naturally, while `if (user.active())` leaves ambiguity about whether `active()` returns a bool, an enum, or something else entirely until you check its signature.

## Bad

```zig
const std = @import("std");

const Connection = struct {
    open: bool, // reads ambiguously as a field name — open what? open how?

    fn connected(self: Connection) bool { // is this a query or an action?
        return self.open;
    }
};
```

## Good

```zig
const std = @import("std");

const Connection = struct {
    is_open: bool,

    fn isConnected(self: Connection) bool {
        return self.is_open;
    }

    fn canReconnect(self: Connection) bool {
        return !self.is_open;
    }
};

test "boolean naming reads as a question" {
    const conn = Connection{ .is_open = true };
    try std.testing.expect(conn.isConnected());
}
```

## Consistency With Field Naming Case

Combine with `name-fields-snake-or-camel`: a boolean field is `is_open` (snake_case, per field convention), while a boolean-returning method is `isOpen` (camelCase, per function convention) — same semantic prefix, different case per the surrounding rule.

## See Also

- [name-fields-snake-or-camel](name-fields-snake-or-camel.md) - the casing convention this rule's field examples follow
- [name-funcs-camelcase](name-funcs-camelcase.md) - the casing convention this rule's method examples follow
- [opt-optional-type](opt-optional-type.md) - `?T` as an alternative to a paired bool + value when relevant
