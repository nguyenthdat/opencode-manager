# alloc-arraylist-managed

> Know whether you're using managed or unmanaged `ArrayList`, and thread the allocator consistently

## Why It Matters

Zig's standard containers come in a "managed" form (stores its allocator, so mutating methods like `append` don't need one) and an "unmanaged" form (`ArrayListUnmanaged`, smaller struct, every mutating call takes the allocator explicitly). Mixing conventions — passing an allocator to a managed list's `append`, or forgetting to pass one to an unmanaged list — is a common source of confusion when std-lib APIs change between versions.

## Bad

```zig
const std = @import("std");

// Managed list already stores its allocator from init(); passing one again
// to a managed-style API (or using it like the Unmanaged variant) doesn't compile
// and signals the author doesn't know which flavor they're holding.
fn build(allocator: std.mem.Allocator) !std.ArrayList(u32) {
    var list = std.ArrayList(u32).init(allocator);
    try list.append(1); // fine for managed...
    return list;
}

// ...but then treating it as unmanaged elsewhere in the same codebase:
fn addMore(list: *std.ArrayListUnmanaged(u32), allocator: std.mem.Allocator) !void {
    try list.append(allocator, 2);
}
```

## Good

```zig
const std = @import("std");

// Pick one convention per type and stay consistent. Managed: allocator
// stored once, mutating calls stay short.
const Managed = struct {
    fn build(allocator: std.mem.Allocator) !std.ArrayList(u32) {
        var list = std.ArrayList(u32).init(allocator);
        errdefer list.deinit();
        try list.append(1);
        try list.append(2);
        return list;
    }
};

// Unmanaged: smaller struct (no stored allocator), every mutation is
// explicit about which allocator it uses — preferred inside other structs
// to avoid redundantly storing the same allocator many times over.
const Unmanaged = struct {
    items: std.ArrayListUnmanaged(u32) = .{},

    fn add(self: *Unmanaged, allocator: std.mem.Allocator, value: u32) !void {
        try self.items.append(allocator, value);
    }

    fn deinit(self: *Unmanaged, allocator: std.mem.Allocator) void {
        self.items.deinit(allocator);
    }
};
```

## Rule of Thumb

Use the managed form for a short-lived local variable that owns "its" allocator. Use the unmanaged form as a field inside a larger struct that already stores (or receives) the allocator elsewhere, to avoid duplicating the allocator pointer per field. Verify the exact API shape (`init()` vs `.{}` vs field defaults) against your project's declared Zig version — this has changed across releases.

## See Also

- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - storing an allocator once on an owning struct
- [alloc-capacity-hint](alloc-capacity-hint.md) - pre-sizing either flavor of ArrayList
- [proj-version-pin](proj-version-pin.md) - why the exact container API must be checked against your Zig version
