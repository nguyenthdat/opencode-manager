# name-funcs-camelcase

> Use `camelCase` for ordinary functions, methods, and variables

## Why It Matters

Following the standard library's own convention consistently — `camelCase` for anything that isn't a type — means code reads uniformly across your project and any Zig library you depend on. Mixing styles (`snake_case` in your code next to `camelCase` in `std`) creates visual noise and makes it harder to tell types from values from function calls at a glance.

## Bad

```zig
const std = @import("std");

fn Parse_Config(allocator: std.mem.Allocator, input: []const u8) !Config { // wrong case
    _ = allocator;
    _ = input;
    return Config{};
}

const Config = struct {};

var Global_Counter: u32 = 0; // variables are camelCase too, not TitleCase or snake_case
```

## Good

```zig
const std = @import("std");

fn parseConfig(allocator: std.mem.Allocator, input: []const u8) !Config {
    _ = allocator;
    _ = input;
    return Config{};
}

const Config = struct {};

var globalCounter: u32 = 0;

test "camelCase functions" {
    const config = try parseConfig(std.testing.allocator, "");
    _ = config;
}
```

## See Also

- [name-types-titlecase](name-types-titlecase.md) - the complementary convention for types
- [name-consts-screaming-or-camel](name-consts-screaming-or-camel.md) - the exception for true global constants
- [name-bool-is-has](name-bool-is-has.md) - a naming refinement specific to boolean-returning functions
