# opt-optional-pointer

> Use `?*T` for an optional pointer rather than a sentinel address or a separate "has value" flag

## Why It Matters

Zig guarantees `?*T` has the same size as `*T` — the compiler uses the pointer's own null representation, so there's no hidden tag byte and no reason to invent a sentinel pointer value (like a magic address) or a parallel boolean to track "is this pointer valid." `?*T` is exactly as cheap as a raw nullable pointer in C, but type-checked.

## Bad

```zig
const std = @import("std");

const Node = struct {
    value: i32,
    next: *Node, // no way to represent "no next node" except an unsafe sentinel
    has_next: bool, // parallel flag that can drift out of sync with `next`
};
```

## Good

```zig
const std = @import("std");

const Node = struct {
    value: i32,
    next: ?*Node, // null means "no next node" — same size as a raw pointer
};

fn sumList(head: ?*Node) i32 {
    var total: i32 = 0;
    var current = head;
    while (current) |node| {
        total += node.value;
        current = node.next;
    }
    return total;
}

test "optional pointer linked list" {
    var b = Node{ .value = 2, .next = null };
    var a = Node{ .value = 1, .next = &b };
    try std.testing.expectEqual(@as(i32, 3), sumList(&a));
}
```

## Optional Pointer Parameters for "Maybe Provided" Arguments

```zig
fn render(buffer: []u8, override_style: ?*const Style) void {
    const style = if (override_style) |s| s.* else Style.default();
    _ = buffer;
    _ = style;
}
const Style = struct {
    fn default() Style {
        return .{};
    }
};
```

## See Also

- [opt-optional-type](opt-optional-type.md) - the general optional type `?*T` specializes
- [slice-many-item-ptr](slice-many-item-ptr.md) - other pointer flavors and when each applies
- [interop-opaque-type](interop-opaque-type.md) - optional opaque pointers at FFI boundaries
