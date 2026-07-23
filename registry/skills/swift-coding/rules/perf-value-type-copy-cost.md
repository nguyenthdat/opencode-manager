# perf-value-type-copy-cost

> Be aware of copy cost for large value types; consider indirection

## Why It Matters

Swift structs get value semantics via copy-on-write for stdlib containers, but a struct with many stored properties (or large fixed-size buffers) that isn't backed by a COW container copies eagerly every time it's passed, assigned, or captured. For small structs this is free; for large ones it can dominate a hot path, and the fix is either to box the payload in a `class`/`indirect enum` or restructure to hold a COW-backed reference internally.

## Bad

```swift
// A "large" value type: 12 Doubles plus metadata, copied by value everywhere.
struct Mesh {
    var vertices: (Double, Double, Double, Double, Double, Double,
                   Double, Double, Double, Double, Double, Double)
    var transformCount: Int
    var name: String
}

func process(_ meshes: [Mesh]) -> [Mesh] {
    meshes.map { mesh in
        var copy = mesh          // full 96+ bytes copied on every iteration
        copy.transformCount += 1
        return copy
    }
}
```

## Good

```swift
// Store the bulky payload in a COW-backed container (Array) so copies are
// cheap until actually mutated, and share it across many logical copies.
struct Mesh {
    var vertices: [Double]   // Array already implements copy-on-write
    var transformCount: Int
    var name: String
}

func process(_ meshes: [Mesh]) -> [Mesh] {
    meshes.map { mesh in
        var copy = mesh          // cheap: vertices' buffer isn't copied yet
        copy.transformCount += 1 // only scalar fields touched, no COW trigger
        return copy
    }
}
```

## Boxing with a Class for Truly Large, Rarely-Mutated Payloads

```swift
// When a value type has an intrinsically large, immutable-in-practice
// payload (e.g. a big fixed buffer that isn't naturally COW), box it.
final class MeshStorage {
    let vertices: [SIMD3<Double>]
    init(vertices: [SIMD3<Double>]) { self.vertices = vertices }
}

struct Mesh {
    private var storage: MeshStorage  // reference: copying Mesh copies a pointer
    var transformCount: Int

    var vertices: [SIMD3<Double>] { storage.vertices }
}

// Measure with Instruments before reaching for this; see perf-profile-instruments.
```

## See Also

- [`mem-struct-value-semantics`](mem-struct-value-semantics.md) - When value semantics are the right default
- [`mem-class-when-identity`](mem-class-when-identity.md) - Choosing a class for identity/sharing
- [`perf-profile-instruments`](perf-profile-instruments.md) - Verifying copy cost is actually a bottleneck
