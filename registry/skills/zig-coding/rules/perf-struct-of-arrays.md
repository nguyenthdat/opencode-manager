# perf-struct-of-arrays

> Prefer struct-of-arrays layout over array-of-structs for cache-friendly iteration over large datasets

## Why It Matters

An array of structs (`[]Entity`) interleaves every field of every element in memory — iterating just one field (say, only `position` out of a large `Entity`) still pulls the whole struct into cache line by line, wasting bandwidth on fields you don't touch. A struct of arrays (one array per field) packs each field contiguously, so an iteration over just `positions` streams through memory with no wasted cache-line bytes.

## Bad

```zig
const std = @import("std");

const Entity = struct {
    position: [3]f32,
    velocity: [3]f32,
    health: u32,
    name: [16]u8,
};

// Iterating positions for physics still drags velocity, health, and name
// through cache on every element.
fn updatePositions(entities: []Entity, dt: f32) void {
    for (entities) |*e| {
        e.position[0] += e.velocity[0] * dt;
        e.position[1] += e.velocity[1] * dt;
        e.position[2] += e.velocity[2] * dt;
    }
}
```

## Good

```zig
const std = @import("std");

const Entities = struct {
    positions: [][3]f32,
    velocities: [][3]f32,
    healths: []u32,
    count: usize,

    // Iterating positions/velocities now streams through two tightly
    // packed arrays with nothing unrelated interleaved in between.
    fn updatePositions(self: *Entities, dt: f32) void {
        for (self.positions[0..self.count], self.velocities[0..self.count]) |*pos, vel| {
            pos[0] += vel[0] * dt;
            pos[1] += vel[1] * dt;
            pos[2] += vel[2] * dt;
        }
    }
};
```

## This Is a Real Trade-off, Not a Free Win

Struct-of-arrays makes per-entity operations that touch *many* fields at once (serializing a whole entity) more awkward, since the fields are no longer adjacent. Apply it specifically to large collections with a proven hot iteration pattern over a subset of fields — confirm with a profiler first.

## See Also

- [perf-benchmark-before](perf-benchmark-before.md) - confirming the access pattern justifies this restructuring
- [perf-packed-struct](perf-packed-struct.md) - a complementary memory-density technique
- [opt-cache-friendly](../rust-coding/rules/opt-cache-friendly.md) - the analogous Rust rule, for comparison
