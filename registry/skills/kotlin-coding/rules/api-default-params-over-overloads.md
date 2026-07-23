# api-default-params-over-overloads

> Use default parameter values instead of overloaded function variants

## Why It Matters

Java-style overloading requires duplicating the parameter list and body for every combination of optional arguments, and callers must pick the "right" overload from several near-identical signatures. Kotlin's default parameter values collapse all of that into a single function definition, reducing maintenance surface and making it obvious which parameters are optional and what their defaults are.

## Bad

```kotlin
fun connect(host: String, port: Int, timeoutMs: Long, useTls: Boolean): Connection =
    Connection(host, port, timeoutMs, useTls)

fun connect(host: String, port: Int, timeoutMs: Long): Connection =
    connect(host, port, timeoutMs, useTls = true)

fun connect(host: String, port: Int): Connection =
    connect(host, port, timeoutMs = 5000, useTls = true)

fun connect(host: String): Connection =
    connect(host, port = 443, timeoutMs = 5000, useTls = true)
// Four overloads to maintain, and adding a fifth parameter means touching all of them
```

## Good

```kotlin
fun connect(
    host: String,
    port: Int = 443,
    timeoutMs: Long = 5000,
    useTls: Boolean = true,
): Connection = Connection(host, port, timeoutMs, useTls)

// Callers only specify what differs from the default
connect("api.example.com")
connect("internal.example.com", port = 8080, useTls = false)
```

## Interop Consideration

```kotlin
// Java callers can't use default parameters directly - they see only the
// full-arity constructor/method unless you generate overloads explicitly.
@JvmOverloads
fun connect(
    host: String,
    port: Int = 443,
    timeoutMs: Long = 5000,
    useTls: Boolean = true,
): Connection = Connection(host, port, timeoutMs, useTls)
// @JvmOverloads generates the same overload chain shown in "Bad" automatically,
// so Kotlin callers get one clean signature and Java callers still get overloads.
```

## See Also

- [`api-named-arguments-clarity`](api-named-arguments-clarity.md) - pair default params with named arguments at call sites
- [`interop-jvmoverloads-defaults`](interop-jvmoverloads-defaults.md) - exposing default parameters to Java callers
- [`api-builder-dsl-optional-args`](api-builder-dsl-optional-args.md) - when the parameter count grows too large even for defaults
