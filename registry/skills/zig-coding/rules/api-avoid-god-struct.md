# api-avoid-god-struct

> Split responsibilities across focused structs instead of accumulating one god-struct with unrelated fields and methods

## Why It Matters

A struct that grows to hold "everything the application needs" (configuration, caches, connection pools, business logic, logging state) becomes hard to test in isolation, since every test needs the whole thing constructed; hard to reason about, since any field can be touched from any method; and hard to change, since every consumer depends on the entire type even if it only uses one part.

## Bad

```zig
const std = @import("std");

// Database access, HTTP handling, caching, and logging all crammed into
// one struct — every part of the app now depends on all of it.
const App = struct {
    allocator: std.mem.Allocator,
    db_connection: []const u8,
    cache: std.StringHashMap([]const u8),
    request_count: u64,
    log_level: u8,

    fn handleRequest(self: *App, path: []const u8) void {
        self.request_count += 1;
        _ = self.cache.get(path);
    }

    fn queryDb(self: *App, sql: []const u8) void {
        _ = self.db_connection;
        _ = sql;
    }
};
```

## Good

```zig
const std = @import("std");

const Cache = struct {
    entries: std.StringHashMap([]const u8),

    fn get(self: *Cache, key: []const u8) ?[]const u8 {
        return self.entries.get(key);
    }
};

const Database = struct {
    connection: []const u8,

    fn query(self: Database, sql: []const u8) void {
        _ = self.connection;
        _ = sql;
    }
};

const RequestHandler = struct {
    cache: *Cache,
    db: *Database,
    request_count: u64 = 0,

    fn handle(self: *RequestHandler, path: []const u8) void {
        self.request_count += 1;
        _ = self.cache.get(path);
    }
};
```

## Each Piece Is Now Independently Testable

`Cache` and `Database` can be constructed and tested on their own, with no need to spin up the whole application, and `RequestHandler`'s tests can substitute a small fake `Cache`/`Database` where needed.

## See Also

- [proj-package-boundaries](proj-package-boundaries.md) - the module-level version of the same decomposition principle
- [api-namespace-file](api-namespace-file.md) - organizing focused structs into their own files
- [api-struct-methods](api-struct-methods.md) - keeping methods scoped to the struct they actually belong to
