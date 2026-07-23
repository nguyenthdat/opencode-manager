# android-avoid-context-leak

> Avoid holding an `Activity` `Context` in a long-lived object

## Why It Matters

An `Activity` Context is destroyed and recreated on configuration changes and on `finish()`. If a singleton, static field, or other long-lived object keeps a reference to it, the entire Activity view tree is kept alive after it should be garbage collected, causing a memory leak that can crash the app under memory pressure.

## Bad

```kotlin
object ImageLoader {
    lateinit var context: Context // leaks whatever Activity calls init()

    fun init(context: Context) {
        this.context = context // if this is an Activity, it now lives forever
    }
}

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ImageLoader.init(this) // leaks MainActivity across configuration changes
    }
}
```

## Good

```kotlin
object ImageLoader {
    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext // application Context outlives every Activity safely
    }
}

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ImageLoader.init(applicationContext)
    }
}
```

## Other Common Leak Sources

- Anonymous listeners/callbacks capturing `this` (Activity) registered on a static/singleton event bus and never unregistered.
- A `Handler` with a non-static inner class holding an implicit Activity reference across a delayed message.
- Passing `this` (Activity) into a coroutine scope, WorkManager input, or DI singleton that outlives the Activity.

## See Also

- [`android-viewmodel-scope`](android-viewmodel-scope.md) - a safer, lifecycle-aware place to hold references instead
- [`anti-mutable-shared-state`](anti-mutable-shared-state.md) - the broader anti-pattern of unmanaged shared state
- [`anti-companion-object-god`](anti-companion-object-god.md) - singletons growing responsibilities that invite leaks
