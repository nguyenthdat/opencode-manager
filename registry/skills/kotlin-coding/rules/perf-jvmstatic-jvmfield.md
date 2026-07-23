# perf-jvmstatic-jvmfield

> Use `@JvmStatic`/`@JvmField` to remove companion-object call overhead

## Why It Matters

Without `@JvmStatic`, calling a companion object member routes through a synthetic `Companion` singleton (`Companion.foo()`), adding an extra indirection and forcing Java callers to go through `ClassName.Companion.foo()` instead of a natural static call. `@JvmField` exposes a property as a raw field, skipping the generated getter/setter call entirely — valuable in tight loops, reflection-heavy frameworks, or Java-facing APIs.

## Bad

```kotlin
class Config {
    companion object {
        var counter = 0 // compiles to Companion.getCounter()/setCounter() - extra indirection

        fun create(): Config = Config() // Java must call Config.Companion.create()
    }
}
```

## Good

```kotlin
class Config {
    companion object {
        @JvmField
        var counter = 0 // direct field access, no getter/setter indirection

        @JvmStatic
        fun create(): Config = Config() // Java calls Config.create() directly
    }
}
```

## When It Matters Most

- Hot-path counters or fields read millions of times per second (game loops, codecs, parsers).
- Public APIs consumed from Java where ergonomics matter (`Config.create()` vs `Config.Companion.create()`).
- Reflection-based frameworks (Jackson, JUnit, some DI containers) that expect plain static fields or methods.

Not needed for pure-Kotlin internal code, where the JIT typically inlines the indirection away — apply these annotations at genuinely hot or Java-facing boundaries rather than everywhere by default.

## See Also

- [`interop-jvmstatic-companion`](interop-jvmstatic-companion.md) - the interop motivation for `@JvmStatic`
- [`interop-jvmoverloads-defaults`](interop-jvmoverloads-defaults.md) - another Java-ergonomics annotation
- [`perf-avoid-reflection-hot-path`](perf-avoid-reflection-hot-path.md) - related hot-path call-overhead concern
- [`interop-const-val-compile-time`](interop-const-val-compile-time.md) - compile-time constants avoid this overhead entirely
