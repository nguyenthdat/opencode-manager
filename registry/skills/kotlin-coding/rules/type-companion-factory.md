# type-companion-factory

> Use a `companion object` factory function instead of a public constructor when validation is required

## Why It Matters

A public constructor can never fail to produce an instance or return an existing one, and it can't easily return a different subtype based on input. A `companion object` factory function can validate arguments and return a `Result`/nullable/sealed type on failure, cache and reuse instances, or pick among subtypes — all while callers still write the familiar `TypeName(...)`-shaped call at the use site.

## Bad

```kotlin
class EmailAddress(val value: String) {
    init {
        require(value.contains("@")) { "Invalid email: $value" }
        // Throwing from a constructor forces every caller into try/catch,
        // and there's no way to return a typed failure instead
    }
}

fun registerUser(rawEmail: String) {
    val email = EmailAddress(rawEmail)  // Crashes the whole registration flow on bad input
}
```

## Good

```kotlin
class EmailAddress private constructor(val value: String) {
    companion object {
        fun create(raw: String): EmailAddress? {
            if (!raw.contains("@")) return null
            return EmailAddress(raw)
        }

        fun of(raw: String): Result<EmailAddress> =
            if (raw.contains("@")) Result.success(EmailAddress(raw))
            else Result.failure(IllegalArgumentException("Invalid email: $raw"))
    }
}

fun registerUser(rawEmail: String) {
    val email = EmailAddress.create(rawEmail) ?: run {
        showValidationError()
        return
    }
    proceedWithRegistration(email)
}
```

## Factory Functions Can Also Pick A Subtype

```kotlin
sealed interface Shape {
    companion object {
        fun fromSides(sides: List<Double>): Shape = when (sides.size) {
            3 -> Triangle(sides)
            4 -> Quadrilateral(sides)
            else -> Polygon(sides)
        }
    }
}
```

## See Also

- [`err-require-precondition`](err-require-precondition.md) - alternative when a thrown exception is acceptable
- [`err-result-explicit-modeling`](err-result-explicit-modeling.md) - modeling the factory's failure case explicitly
- [`api-default-params-over-overloads`](api-default-params-over-overloads.md) - complements factories that need optional parameters
- [`type-sealed-class-hierarchy`](type-sealed-class-hierarchy.md) - factories are a common way to construct sealed variants
