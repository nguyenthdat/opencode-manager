# type-lateinit-discipline

> Use `lateinit var` only for framework-assigned, guaranteed-non-null properties

## Why It Matters

`lateinit` tells the compiler "trust me, this will be set before it's read" and skips null-checking in exchange for a plain `UninitializedPropertyAccessException` if you're wrong. It exists specifically for frameworks (Android `Activity` views, dependency injection, JUnit `@BeforeEach` fixtures) that assign a property in a lifecycle callback the compiler can't see — using it as a general escape hatch from nullable types just relocates the null-safety bug to runtime.

## Bad

```kotlin
class CheckoutViewModel {
    lateinit var discount: Discount  // Never guaranteed to be set

    fun applyPromoCode(code: String) {
        discount = discountService.lookup(code) ?: return  // May never run
    }

    fun total(subtotal: Double): Double {
        return subtotal - discount.amount  // Crashes if applyPromoCode() was never called
    }
}
```

## Good

```kotlin
class CheckoutViewModel {
    var discount: Discount? = null

    fun applyPromoCode(code: String) {
        discount = discountService.lookup(code)
    }

    fun total(subtotal: Double): Double {
        return subtotal - (discount?.amount ?: 0.0)
    }
}

// lateinit fits its intended use: framework-guaranteed lifecycle assignment
class MainActivity : AppCompatActivity() {
    lateinit var binding: ActivityMainBinding  // Always set in onCreate() before any use

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
    }
}
```

## Checking Initialization

```kotlin
class Config {
    lateinit var endpoint: String

    fun isReady(): Boolean = ::endpoint.isInitialized
}
```

## Detekt/ktlint Rule

Detekt's `LateinitUsage` rule flags `lateinit` outside of test source sets and can be configured to allow it only for specific patterns (e.g. Android view bindings):

```yaml
style:
  LateinitUsage:
    active: true
    excludeAnnotatedProperties: []
    ignoreOnClassesPattern: '.*ViewModel|.*Activity|.*Fragment'
```

## See Also

- [`anti-lateinit-overuse`](anti-lateinit-overuse.md) - the broader anti-pattern this rule constrains
- [`type-avoid-not-null-assert`](type-avoid-not-null-assert.md) - a related escape hatch with the same crash-at-runtime risk
- [`android-viewmodel-scope`](android-viewmodel-scope.md) - lifecycle-safe alternatives in Android ViewModels
- [`android-savedstatehandle-viewmodel`](android-savedstatehandle-viewmodel.md) - restoring state instead of relying on `lateinit`
