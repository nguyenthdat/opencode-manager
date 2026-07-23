# mem-lazy-var-init

> Use `lazy var` to defer expensive/circular initialization

## Why It Matters

`lazy var` defers a property's initial value until it's first accessed, which avoids paying for expensive setup (parsing, network setup, large allocations) that a given instance may never actually need. It also solves a real ordering problem: a stored property that needs `self` to already exist (e.g. to pass `self` into another object) cannot be computed in `init` before `self` is fully initialized, but a `lazy var` initializer runs later, after `self` is available.

## Bad

```swift
final class ImageProcessor {
    // Built eagerly in init, even for processors that never actually
    // resize an image — pays for a large lookup table every time.
    let resizeKernel: [[Double]] = ImageProcessor.buildResizeKernel()

    static func buildResizeKernel() -> [[Double]] {
        // expensive: computes a large convolution kernel
        Array(repeating: Array(repeating: 0.0, count: 256), count: 256)
    }
}
```

## Good

```swift
final class ImageProcessor {
    lazy var resizeKernel: [[Double]] = ImageProcessor.buildResizeKernel()

    static func buildResizeKernel() -> [[Double]] {
        Array(repeating: Array(repeating: 0.0, count: 256), count: 256)
    }

    func resize(_ image: Image) -> Image {
        apply(resizeKernel, to: image)   // only computed the first time this runs
    }

    func apply(_ kernel: [[Double]], to image: Image) -> Image { image }
}
```

## Breaking Circular Self-Reference

A `lazy var` can reference `self` in its initializer expression, which a regular stored property cannot do before `init` completes:

```swift
final class EventBus {
    lazy var logger = EventLogger(bus: self)   // needs `self`; only legal because it's lazy
}

final class EventLogger {
    unowned let bus: EventBus
    init(bus: EventBus) { self.bus = bus }
}
```

Be aware that `lazy var` is not thread-safe: concurrent first access from multiple threads can run the initializer more than once or race on the backing storage. For lazily-initialized state shared across tasks, isolate it behind an `actor` instead.

## See Also

- [`mem-deinit-verify`](mem-deinit-verify.md) - confirming lazily-created cycles still deallocate
- [`async-actor-isolated-state`](async-actor-isolated-state.md) - the thread-safe alternative for concurrent lazy state
- [`mem-class-when-identity`](mem-class-when-identity.md) - lazy var is most useful on reference types with real lifecycles
