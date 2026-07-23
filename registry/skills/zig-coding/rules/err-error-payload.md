# err-error-payload

> Errors carry no payload beyond their name — attach context via logging, out-parameters, or a side-channel

## Why It Matters

Unlike `thiserror`/exceptions in other languages, a Zig error value is just a tag from an error set — `error.InvalidSyntax` carries no line number, no offending byte, no message. If callers need more context than the error name provides, that context has to travel a different way: a log call at the failure site, an out-parameter struct the caller pre-allocates, or a "last error detail" field on a stateful parser.

## Bad

```zig
const std = @import("std");

// The caller learns *that* parsing failed, but not *where* or *why* —
// and there's no way to smuggle a formatted message into the error itself.
pub fn parseLine(line: []const u8) error{InvalidSyntax}!Entry {
    if (line.len == 0) return error.InvalidSyntax;
    // ...
    return error.InvalidSyntax;
}
```

## Good

```zig
const std = @import("std");

pub const ParseDiagnostics = struct {
    line: usize = 0,
    column: usize = 0,
    message: []const u8 = "",
};

pub fn parseLine(
    line: []const u8,
    line_no: usize,
    diagnostics: *ParseDiagnostics,
) error{InvalidSyntax}!Entry {
    if (line.len == 0) {
        diagnostics.* = .{ .line = line_no, .column = 0, .message = "empty line" };
        return error.InvalidSyntax;
    }
    // ...
    return error.InvalidSyntax;
}

pub fn main() !void {
    var diag: ParseDiagnostics = .{};
    _ = parseLine("", 12, &diag) catch |err| {
        std.log.err("{s} at {d}:{d}: {s}", .{ @errorName(err), diag.line, diag.column, diag.message });
    };
}
```

## Logging at the Point of Failure

When there's no natural out-parameter, log immediately where the detail is known, then propagate the plain error upward:

```zig
fn readRequired(path: []const u8) ![]const u8 {
    return std.fs.cwd().readFileAlloc(std.heap.page_allocator, path, 1 << 16) catch |err| {
        std.log.err("failed to read '{s}': {s}", .{ path, @errorName(err) });
        return err;
    };
}
```

## See Also

- [err-error-set-explicit](err-error-set-explicit.md) - naming the error itself precisely, since it's all callers get
- [doc-error-set-document](doc-error-set-document.md) - documenting what triggers each error, since the error can't say
- [err-return-vs-log](err-return-vs-log.md) - deciding whether to log locally or let the caller decide
