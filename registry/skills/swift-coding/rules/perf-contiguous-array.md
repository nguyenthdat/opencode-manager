# perf-contiguous-array

> Use `ContiguousArray` for performance-critical non-bridged storage

## Why It Matters

`Array<Element>` is capable of bridging to `NSArray` when `Element` is a class or `@objc` protocol type, which means the compiler must keep that bridging path available even if you never use it, adding a small but real overhead to element access in tight loops. `ContiguousArray` never bridges to Objective-C, guaranteeing contiguous native storage and slightly faster element access—useful for numeric buffers and other performance-critical code that never crosses an Objective-C boundary.

## Bad

```swift
final class Particle {
    var x: Double
    var y: Double
    init(x: Double, y: Double) { self.x = x; self.y = y }
}

// Array<Particle> keeps the NSArray-bridging path available even though
// this simulation never touches Objective-C.
func simulate(_ particles: inout [Particle], steps: Int) {
    for _ in 0..<steps {
        for particle in particles {
            particle.x += 0.1
            particle.y += 0.1
        }
    }
}
```

## Good

```swift
final class Particle {
    var x: Double
    var y: Double
    init(x: Double, y: Double) { self.x = x; self.y = y }
}

// ContiguousArray never bridges to NSArray: guaranteed contiguous storage
// and no bridging-check overhead in the hot loop.
func simulate(_ particles: inout ContiguousArray<Particle>, steps: Int) {
    for _ in 0..<steps {
        for particle in particles {
            particle.x += 0.1
            particle.y += 0.1
        }
    }
}
```

## When `Array` Is Still the Right Choice

```swift
// Value-type elements (Int, Double, structs) already get most of
// ContiguousArray's benefit from Array, since bridging only applies to
// class/@objc-protocol elements. Prefer plain Array unless profiling
// shows a measurable difference for your specific Element type.
func sum(_ numbers: [Double]) -> Double {
    numbers.reduce(0, +) // Array<Double> is already contiguous, no bridging concern
}

// Use ContiguousArray specifically when Element is a class type AND
// the code is a proven hot path that never needs NSArray interop.
struct ParticleSystem {
    var particles: ContiguousArray<Particle> = []
}
```

## See Also

- [`perf-avoid-bridging-overhead`](perf-avoid-bridging-overhead.md) - General bridging-cost avoidance
- [`perf-reserve-capacity`](perf-reserve-capacity.md) - Preallocating contiguous storage
- [`perf-profile-instruments`](perf-profile-instruments.md) - Verifying the switch actually helps
