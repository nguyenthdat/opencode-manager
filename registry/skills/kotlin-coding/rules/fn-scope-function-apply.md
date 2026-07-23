# fn-scope-function-apply

> Use `apply` to configure an object and return the receiver

## Why It Matters

Object configuration ("set these five properties, then use the object") is common enough to deserve its own idiom: `apply` runs the lambda with `this` bound to the receiver and always returns that same receiver, so you can build-and-configure an object in one expression instead of declaring a `val`, mutating it across several statements, and then referencing it again.

## Bad

```kotlin
fun createButton(): Button {
    val button = Button()
    button.text = "Submit"
    button.isEnabled = true
    button.onClick = { println("clicked") }
    return button  // extra explicit return of a variable we just configured
}

val paint = Paint()
paint.color = Color.RED
paint.strokeWidth = 4f
paint.style = Paint.Style.STROKE
canvas.drawCircle(cx, cy, radius, paint)
```

## Good

```kotlin
fun createButton(): Button = Button().apply {
    text = "Submit"
    isEnabled = true
    onClick = { println("clicked") }
}

val paint = Paint().apply {
    color = Color.RED
    strokeWidth = 4f
    style = Paint.Style.STROKE
}
canvas.drawCircle(cx, cy, radius, paint)
```

## Chaining `apply` in Builders

```kotlin
class RequestBuilder {
    var url: String = ""
    var method: String = "GET"
}

fun request(configure: RequestBuilder.() -> Unit): RequestBuilder =
    RequestBuilder().apply(configure)
// apply(configure) is the standard entry point for lambda-with-receiver DSLs
```

## `apply` vs `also`

```kotlin
// apply: `this`-style access, returns receiver -> configuring an object's own properties
val list = mutableListOf<Int>().apply { add(1); add(2) }

// also: `it`-style access, returns receiver -> side effects unrelated to the object's own API
val list2 = mutableListOf(1, 2, 3).also { println("created list with ${it.size} items") }
```

## See Also

- [`fn-scope-function-also`](fn-scope-function-also.md) - the `it`-style sibling for side effects
- [`api-dsl-lambda-receiver`](api-dsl-lambda-receiver.md) - `apply` is the mechanism behind most builder DSLs
- [`fn-scope-function-run`](fn-scope-function-run.md) - use when you need a computed result instead of the receiver back
