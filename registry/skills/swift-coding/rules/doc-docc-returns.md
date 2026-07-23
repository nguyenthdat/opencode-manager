# doc-docc-returns

> Document return values with `- Returns`

## Why It Matters

A function's return type tells a caller *what kind* of value comes back, but not what it *means*—whether `nil` signals "not found" versus "invalid input," whether an empty array is a valid result, or what units a `Double` is in. The `- Returns:` DocC field is the conventional place to spell that out, and DocC/Xcode render it as its own labeled section in Quick Help.

## Bad

```swift
/// Looks up a user.
func findUser(id: String) -> User? {
    // nil could mean "not found" or "invalid id format" - undocumented
    ...
}

/// Converts a temperature.
func convert(_ value: Double) -> Double {
    // Returns Celsius? Fahrenheit? Undocumented unit.
    ...
}
```

## Good

```swift
/// Looks up a user by their unique identifier.
///
/// - Parameter id: The user's unique identifier.
/// - Returns: The matching ``User``, or `nil` if no user exists with that `id`.
///   Malformed identifiers also return `nil` rather than throwing.
func findUser(id: String) -> User? {
    ...
}

/// Converts a Fahrenheit temperature to Celsius.
///
/// - Parameter value: The temperature in degrees Fahrenheit.
/// - Returns: The equivalent temperature in degrees Celsius.
func convert(_ value: Double) -> Double {
    (value - 32) * 5 / 9
}
```

## Documenting Tuple and Collection Returns

```swift
/// Splits a full name into its given and family name components.
///
/// - Parameter fullName: A name string like `"Ada Lovelace"`.
/// - Returns: A tuple of `(givenName, familyName)`. If `fullName` has no
///   space, `familyName` is an empty string.
func splitName(_ fullName: String) -> (givenName: String, familyName: String) {
    ...
}

/// Finds all products currently out of stock.
///
/// - Returns: The out-of-stock products, in catalog order. Returns an
///   empty array (never `nil`) when every product is in stock.
func outOfStockProducts() -> [Product] {
    ...
}
```

## See Also

- [`doc-docc-parameters`](doc-docc-parameters.md) - Documenting input parameters
- [`doc-docc-throws`](doc-docc-throws.md) - Documenting thrown errors
- [`type-optional-map-flatmap`](type-optional-map-flatmap.md) - Optional-returning API design
