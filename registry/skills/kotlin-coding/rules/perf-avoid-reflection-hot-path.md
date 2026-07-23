# perf-avoid-reflection-hot-path

> Avoid reflection-based calls in hot paths

## Why It Matters

Kotlin reflection (`KClass`, `callBy`, annotation scanning) and Java reflection (`Method.invoke`) bypass JIT inlining and pay lookup, access-check, and boxing costs on every call. Using them inside per-request or per-frame code can dominate latency compared to a direct call or a cached lookup.

## Bad

```kotlin
fun invokeHandler(target: Any, methodName: String, arg: Any): Any? {
    val method = target::class.java.getMethod(methodName, arg::class.java) // reflection lookup on every call
    return method.invoke(target, arg) // boxing + access check on every call
}

fun serialize(obj: Any): String {
    val props = obj::class.memberProperties // Kotlin reflection scan, done on every call
    return props.joinToString { "${it.name}=${it.call(obj)}" }
}
```

## Good

```kotlin
// Cache the Method lookup once, reuse across calls
private val methodCache = ConcurrentHashMap<Pair<Class<*>, String>, Method>()

fun invokeHandler(target: Any, methodName: String, arg: Any): Any? {
    val method = methodCache.getOrPut(target::class.java to methodName) {
        target::class.java.getMethod(methodName, arg::class.java)
    }
    return method.invoke(target, arg)
}

// Better still: avoid reflection entirely with a compile-time serializer
@Serializable
data class Event(val name: String, val payload: String)

fun serialize(event: Event): String = Json.encodeToString(event) // kotlinx.serialization generates code, no reflection
```

## Alternatives

- kotlinx.serialization or Moshi codegen instead of reflective JSON mapping.
- Sealed classes with a `when` dispatch instead of a reflective method lookup.
- Cache `KClass`/`Method`/`Field` lookups outside the loop if reflection is unavoidable.

## See Also

- [`perf-profile-before-optimize`](perf-profile-before-optimize.md) - confirm reflection is actually the bottleneck first
- [`perf-jvmstatic-jvmfield`](perf-jvmstatic-jvmfield.md) - another call-overhead micro-optimization
- [`api-inline-reified-generic`](api-inline-reified-generic.md) - reified generics avoid reflective type checks
