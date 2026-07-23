# fn-scope-function-with

> Use `with` for grouped calls on a non-null receiver already in scope

## Why It Matters

When you need to make several calls against the same non-null object that's already available as a local variable (not the result of a nullable chain), `with` avoids repeating the receiver name on every line without the ceremony of an extension-style scope function - it's a plain non-extension function that takes the receiver as its first argument.

## Bad

```kotlin
val canvas = Canvas(width = 800, height = 600)
canvas.drawBackground(Color.WHITE)
canvas.drawLine(0, 0, 800, 600)
canvas.drawText("Hello", 10, 10)
canvas.save()
// Repeating `canvas.` on every line is noisy when it's the same non-null object each time
```

## Good

```kotlin
val canvas = Canvas(width = 800, height = 600)
with(canvas) {
    drawBackground(Color.WHITE)
    drawLine(0, 0, 800, 600)
    drawText("Hello", 10, 10)
    save()
}
```

## Returning a Computed Value

```kotlin
val summary = with(StringBuilder()) {
    append("Name: ").append(user.name).append("\n")
    append("Age: ").append(user.age)
    toString()  // with() returns the lambda's last expression
}
```

## `with` Requires a Non-Null, Already-Scoped Receiver

```kotlin
// with() is a plain function, not an extension - it can't be chained off a
// nullable value with ?. the way let/run/also/apply can.
val config: Config? = loadConfig()

// Won't compile as a null-safe chain:
// with(config) { ... }  // NPE risk if config is null and body assumes non-null

// Use run instead when the receiver might be null:
config?.run {
    validate()
    apply()
}
```

## See Also

- [`fn-scope-function-run`](fn-scope-function-run.md) - the extension-function sibling, usable in null-safe chains
- [`fn-scope-function-apply`](fn-scope-function-apply.md) - use when configuring and returning the receiver itself
- [`fn-scope-function-also`](fn-scope-function-also.md) - use for side effects that shouldn't change the return value
